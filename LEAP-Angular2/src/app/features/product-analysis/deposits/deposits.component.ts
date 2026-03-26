import { Component, OnInit, signal, computed, effect } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzFormModule } from 'ng-zorro-antd/form'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTabsModule } from 'ng-zorro-antd/tabs'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, ColGroupDef, ValueFormatterParams, CellClassParams } from 'ag-grid-community'
import { DepositNameCellRendererComponent, type SummaryRowData } from './cell-renderers/deposit-name-cell.renderer'
import { VarianceCellRendererComponent } from './cell-renderers/variance-cell.renderer'
import { ActionCellRendererComponent } from './cell-renderers/action-cell.renderer'
import { DepositsHeaderRendererComponent } from './cell-renderers/deposits-header.renderer'
import { Fr2052aActionCellRendererComponent } from './cell-renderers/fr2052a-action-cell.renderer'
import { WithdrawalRiskHeaderRendererComponent } from './cell-renderers/withdrawal-risk-header.renderer'
import { CommentPanelComponent } from './comment-panel/comment-panel.component'
import { EscalationPanelComponent } from './escalation-panel/escalation-panel.component'
import type { UsLcrRow } from './us-lcr-data'
import { US_LCR_DATA_MAP } from './us-lcr-data'

const STORAGE_KEY = 'leap_deposits_query_params'

interface StoredParams {
  region: string | null
  segment: string | null
  prior: string | null
  current: string | null
  tabIndex: number | null
}

function loadParams(): Partial<StoredParams> {
  try {
    const s = sessionStorage.getItem(STORAGE_KEY)
    if (s) return JSON.parse(s) as StoredParams
  } catch (_) {}
  return {}
}

function saveParams(p: {
  region?: string | null
  segment?: string | null
  prior?: Date | string | null
  current?: Date | string | null
  tabIndex?: number | null
}) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        region: p.region ?? null,
        segment: p.segment ?? null,
        prior: p.prior instanceof Date ? p.prior.toISOString().slice(0, 10) : p.prior ?? null,
        current: p.current instanceof Date ? p.current.toISOString().slice(0, 10) : p.current ?? null,
        tabIndex: p.tabIndex ?? null,
      })
    )
  } catch (_) {}
}

const COUNTERPARTY_GROUPS = [
  { key: 'TOTAL', headerName: 'Total', hasPrevious: true },
  { key: 'RETAIL', headerName: 'Retail', hasPrevious: false },
  { key: 'SME', headerName: 'SME', hasPrevious: false },
  { key: 'NON_FINANCIAL', headerName: 'Non-Financial', hasPrevious: false },
  { key: 'PENSION_FUNDS', headerName: 'Pension Funds', hasPrevious: false },
  { key: 'SOVEREIGNS', headerName: 'Sovereigns', hasPrevious: false },
  { key: 'GSE_PSE', headerName: 'GSE/PSEs', hasPrevious: false },
  { key: 'BANK', headerName: 'Bank', hasPrevious: false },
  { key: 'BROKER_DEALERS', headerName: 'Broker Dealers/FMUs', hasPrevious: false },
  { key: 'INVESTMENT_FUNDS', headerName: 'Investment Firms/Funds', hasPrevious: false },
  { key: 'OTHER_FINANCIAL', headerName: 'Other Financial Entities', hasPrevious: false },
] as const

export interface FR2052AData {
  pid: string
  product: string
  amount1: number
  amount2: number
  amount3: number
  hasAlert?: boolean
  isGrandTotal?: boolean
}

@Component({
  selector: 'app-deposits',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
    AgGridAngular,
    DepositNameCellRendererComponent,
    VarianceCellRendererComponent,
    ActionCellRendererComponent,
    DepositsHeaderRendererComponent,
    Fr2052aActionCellRendererComponent,
    WithdrawalRiskHeaderRendererComponent,
    CommentPanelComponent,
    EscalationPanelComponent,
  ],
  templateUrl: './deposits.component.html',
  styleUrls: ['./deposits.component.scss'],
})
export class DepositsComponent implements OnInit {
  form: FormGroup
  regionOpen = signal(false)
  segmentOpen = signal(false)
  activeTabIndex = signal(0)
  expandedNodes = signal<Set<string>>(
    new Set([
      'personal',
      'non-personal',
      'wholesale',
      'wholesale-gtb',
      'wholesale-gtb-operational',
      'wholesale-gtb-excess',
      'pwm',
    ])
  )

  tabs = ['Summary', 'FR2052A', 'US LCR', 'Enterprise LCR', 'US NSFR', 'Enterprise NSFR', 'ILST']

  rowData = signal<SummaryRowData[] | FR2052AData[] | (SummaryRowData & UsLcrRow)[]>([])
  columnDefs = computed<(ColDef | ColGroupDef)[]>(() => this.getColumnDefs())
  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: false,
    floatingFilter: false,
  }

  commentPanelOpen = signal(false)
  selectedRowForComment = signal<unknown>(null)

  escalationPanelOpen = signal(false)
  selectedRowForEscalation = signal<unknown>(null)
  escalationNoticeVisible = signal(false)
  private escalationNoticeTimer: ReturnType<typeof setTimeout> | null = null

  gridContext = {
    toggleNode: (id: string) => this.toggleNode(id),
    onCommentClick: (data: unknown) => this.openCommentPanel(data),
    onEscalateClick: (data: unknown) => this.openEscalationPanel(data),
  }

  constructor(private fb: FormBuilder, private router: Router) {
    const nav = this.router.getCurrentNavigation()
    const state = nav?.extras?.state as StoredParams | undefined
    const fromState = state && (state.region != null || state.segment != null || state.prior != null || state.current != null)
    const saved = fromState ? state : loadParams()
    const prior = saved.prior ? new Date(saved.prior) : null
    const current = saved.current ? new Date(saved.current) : null
    const tabIndex = typeof saved.tabIndex === 'number' ? saved.tabIndex : 0
    this.activeTabIndex.set(tabIndex)
    this.form = this.fb.group({
      region: [saved.region ?? null, Validators.required],
      segment: [saved.segment ?? null, Validators.required],
      prior: [prior, Validators.required],
      current: [current, Validators.required],
    })
    effect(() => {
      this.activeTabIndex()
      this.expandedNodes()
      this.rowData.set(this.getRowDataForCurrentTab())
    })
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.rowData.set(this.getRowDataForCurrentTab()))
    this.rowData.set(this.getRowDataForCurrentTab())
  }

  isFormComplete(): boolean {
    const v = this.form.value
    return !!(v.region && v.segment && v.prior && v.current)
  }

  onQuery(): void {
    const v = this.form.value
    saveParams({
      region: v.region,
      segment: v.segment,
      prior: v.prior,
      current: v.current,
      tabIndex: this.activeTabIndex(),
    })
    this.rowData.set(this.getRowDataForCurrentTab())
  }

  onTabChange(index: number): void {
    this.activeTabIndex.set(index)
    const v = this.form.value
    saveParams({
      region: v.region,
      segment: v.segment,
      prior: v.prior,
      current: v.current,
      tabIndex: index,
    })
    this.rowData.set(this.getRowDataForCurrentTab())
  }

  toggleNode(nodeId: string): void {
    const set = new Set(this.expandedNodes())
    if (set.has(nodeId)) set.delete(nodeId)
    else set.add(nodeId)
    this.expandedNodes.set(set)
    this.rowData.set(this.getRowDataForCurrentTab())
  }

  getRowDataForCurrentTab(): SummaryRowData[] | FR2052AData[] | (SummaryRowData & UsLcrRow)[] {
    if (!this.isFormComplete()) return []
    const tab = this.activeTabIndex()
    switch (tab) {
      case 1:
        return this.getFR2052AData()
      case 2:
        return this.buildUsLcrRowData()
      case 0:
      default:
        return this.buildSummaryRowData()
    }
  }

  getRowId(params: { data?: unknown; rowIndex?: number }): string {
    const d = params.data as { nodeId?: string; pid?: string; product?: string } | undefined
    if (d?.nodeId) return d.nodeId
    if (d?.pid != null || d?.product != null) return (d.pid ?? '') + '-' + (d.product ?? '') || String(params.rowIndex ?? 0)
    return String(params.rowIndex ?? 0)
  }

  onRowClicked(event: { data?: SummaryRowData; event?: Event | null }): void {
    const target = event.event?.target as HTMLElement | undefined
    if (target?.closest('[col-id="name"]')) return
  }

  openCommentPanel(data: unknown): void {
    this.selectedRowForComment.set(data)
    this.commentPanelOpen.set(true)
  }

  closeCommentPanel(): void {
    this.commentPanelOpen.set(false)
  }

  openEscalationPanel(data: unknown): void {
    this.selectedRowForEscalation.set(data)
    this.escalationPanelOpen.set(true)
  }

  closeEscalationPanel(): void {
    this.escalationPanelOpen.set(false)
  }

  onEscalationConfirmed(_: { contacts: string[]; comment: string }): void {
    this.closeEscalationPanel()
    this.showEscalationNotice()
  }

  dismissEscalationNotice(): void {
    this.escalationNoticeVisible.set(false)
    if (this.escalationNoticeTimer) {
      clearTimeout(this.escalationNoticeTimer)
      this.escalationNoticeTimer = null
    }
  }

  private showEscalationNotice(): void {
    this.escalationNoticeVisible.set(true)
    if (this.escalationNoticeTimer) clearTimeout(this.escalationNoticeTimer)
    this.escalationNoticeTimer = setTimeout(() => {
      this.escalationNoticeVisible.set(false)
      this.escalationNoticeTimer = null
    }, 4500)
  }

  getColumnDefs(): (ColDef | ColGroupDef)[] {
    const tab = this.activeTabIndex()
    switch (tab) {
      case 1:
        return this.getFr2052aColumnDefs()
      case 2:
        return this.getUsLcrColumnDefs()
      case 0:
      case 3:
      case 4:
      case 5:
      case 6:
      default:
        return this.getSummaryColumnDefs()
    }
  }

  private getFR2052AData(): FR2052AData[] {
    const data: FR2052AData[] = [
      { pid: 'O.D.1', product: 'Transactional Accounts', amount1: 137199, amount2: 138420, amount3: 12450, hasAlert: false },
      { pid: 'O.D.2', product: 'Non-Transactional Relationship Accounts', amount1: 89234, amount2: 88500, amount3: 4200, hasAlert: false },
      { pid: 'O.D.3', product: 'Non-Transactional Non-Relationship Accounts', amount1: 45620, amount2: 44100, amount3: 2100, hasAlert: true },
      { pid: 'O.D.4', product: 'Operational Account Balances', amount1: 28450, amount2: 29100, amount3: 1850, hasAlert: false },
      { pid: 'O.D.5', product: 'Excess Balances in Operational Accounts', amount1: 15680, amount2: 16200, amount3: 920, hasAlert: false },
      { pid: 'O.D.6', product: 'Non-Operational Account Balances', amount1: 52340, amount2: 51800, amount3: 3100, hasAlert: false },
      { pid: 'O.D.7', product: 'Operational Escrow Accounts', amount1: 12300, amount2: 11900, amount3: 680, hasAlert: false },
      { pid: 'O.D.8', product: 'Non-Reciprocal Brokered Deposits', amount1: -33, amount2: -28, amount3: -5, hasAlert: false },
      { pid: 'O.D.10', product: 'Less Stable Affiliated Sweep Account Balances', amount1: -24, amount2: -31, amount3: -8, hasAlert: true },
      { pid: 'O.D.11', product: 'Non-Affiliated Sweep Accounts', amount1: 18700, amount2: 19200, amount3: 1100, hasAlert: false },
      { pid: 'O.D.14', product: 'Other Third-Party Deposits', amount1: 22400, amount2: 21800, amount3: 1350, hasAlert: false },
      { pid: 'O.W.16', product: 'Wholesale CDs', amount1: 67800, amount2: 65200, amount3: 4200, hasAlert: false },
      { pid: 'S.L.4', product: 'Non-Structured Debt Maturing in Greater than 30-d', amount1: 12500, amount2: 12200, amount3: 750, hasAlert: false },
    ]
    const sum1 = data.reduce((a, r) => a + r.amount1, 0)
    const sum2 = data.reduce((a, r) => a + r.amount2, 0)
    const sum3 = data.reduce((a, r) => a + r.amount3, 0)
    data.push({
      pid: '',
      product: 'Grand Total',
      amount1: sum1,
      amount2: sum2,
      amount3: sum3,
      isGrandTotal: true,
    })
    return data
  }

  private getFr2052aColumnDefs(): ColDef[] {
    const numFmt = (p: ValueFormatterParams) => (p.value != null ? Number(p.value).toLocaleString() : '')
    const grandTotalStyle = { backgroundColor: '#E6F7FF' }
    const numStyle = { textAlign: 'right' as const, fontWeight: 500, color: '#000000' }
    return [
      {
        field: 'pid',
        headerName: 'Pid',
        flex: 1,
        minWidth: 150,
        cellStyle: (params: CellClassParams) =>
          (params.data as FR2052AData)?.isGrandTotal ? grandTotalStyle : undefined,
      },
      {
        field: 'product',
        headerName: 'Product',
        flex: 3,
        minWidth: 300,
        cellStyle: (params: CellClassParams) => {
          const d = params.data as FR2052AData
          if (d?.isGrandTotal) return { ...grandTotalStyle, fontWeight: 500 }
          return { fontWeight: 400 }
        },
      },
      {
        field: 'amount1',
        headerName: '6G Amount',
        flex: 1,
        minWidth: 120,
        valueFormatter: numFmt,
        cellStyle: (params: CellClassParams) => {
          const d = params.data as FR2052AData
          if (d?.isGrandTotal) return { ...grandTotalStyle, ...numStyle }
          return numStyle
        },
      },
      {
        field: 'amount2',
        headerName: '6G Amount',
        flex: 1,
        minWidth: 120,
        valueFormatter: numFmt,
        cellStyle: (params: CellClassParams) => {
          const d = params.data as FR2052AData
          if (d?.isGrandTotal) return { ...grandTotalStyle, ...numStyle }
          return numStyle
        },
      },
      {
        field: 'amount3',
        headerName: '6G Amount',
        flex: 1,
        minWidth: 120,
        valueFormatter: numFmt,
        cellStyle: (params: CellClassParams) => {
          const d = params.data as FR2052AData
          if (d?.isGrandTotal) return { ...grandTotalStyle, ...numStyle }
          return numStyle
        },
      },
      {
        headerName: 'Action',
        flex: 0.7,
        minWidth: 132,
        maxWidth: 148,
        cellStyle: (params: CellClassParams) => {
          const d = params.data as FR2052AData
          if (d?.isGrandTotal) return grandTotalStyle
          return { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px' }
        },
        cellRenderer: Fr2052aActionCellRendererComponent,
      },
    ]
  }

  private getUsLcrColumnDefs(): (ColDef | ColGroupDef)[] {
    const empty: UsLcrRow = {
      counterparty: '',
      keyFactor: '',
      lcrWeights: '',
      ruleText: '',
      notionalPrev: 0,
      notionalCurr: 0,
      notionalVar: 0,
      ncoPrev: 0,
      ncoCurr: 0,
      ncoVar: 0,
    }
    const numFmt = (p: ValueFormatterParams) => (p.value != null ? Number(p.value).toLocaleString() : '')
    const baseCellStyle = {
      fontSize: '13px',
      fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    }
    const grayStyle = (v: unknown) =>
      v === 'N/A' || v === '' ? { ...baseCellStyle, color: '#999999' } : baseCellStyle
    const lcrWeightsStyle = (v: unknown) =>
      v === 'N/A' || v === ''
        ? { ...baseCellStyle, textAlign: 'right' as const, fontWeight: 500, color: '#999999' }
        : { ...baseCellStyle, textAlign: 'right' as const, fontWeight: 500, color: '#000000' }
    return [
      {
        field: 'name',
        colId: 'name',
        headerName: 'Withdrawal Risk',
        flex: 1,
        minWidth: 220,
        pinned: 'left',
        cellRenderer: DepositNameCellRendererComponent,
        headerComponent: WithdrawalRiskHeaderRendererComponent,
      },
      {
        field: 'counterparty',
        headerName: 'Counterparty',
        flex: 1,
        minWidth: 120,
        cellStyle: (params: CellClassParams) => grayStyle(params.value),
      },
      {
        field: 'keyFactor',
        headerName: 'Key Factor',
        flex: 1,
        minWidth: 120,
        cellStyle: (params: CellClassParams) => grayStyle(params.value),
      },
      {
        field: 'lcrWeights',
        headerName: 'LCR Weights',
        flex: 1,
        minWidth: 120,
        cellStyle: (params: CellClassParams) => lcrWeightsStyle(params.value),
      },
      {
        field: 'ruleText',
        headerName: 'Rule Text',
        flex: 2,
        minWidth: 180,
        cellStyle: (params: CellClassParams) => grayStyle(params.value),
      },
      {
        headerName: 'Notional',
        children: [
          { field: 'notionalPrev', headerName: 'Previous', flex: 1, minWidth: 100, valueFormatter: numFmt, cellStyle: { ...baseCellStyle, textAlign: 'right', fontWeight: 500, color: '#000000' } },
          { field: 'notionalCurr', headerName: 'Current', flex: 1, minWidth: 100, valueFormatter: numFmt, cellStyle: { ...baseCellStyle, textAlign: 'right', fontWeight: 500, color: '#000000' } },
          { field: 'notionalVar', headerName: 'Variance', flex: 1, minWidth: 100, cellRenderer: VarianceCellRendererComponent, cellStyle: { ...baseCellStyle, textAlign: 'right' } },
          { headerName: '', flex: 0.4, minWidth: 80, maxWidth: 80, cellRenderer: ActionCellRendererComponent, cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' } },
        ],
      },
      {
        headerName: 'NCO',
        children: [
          { field: 'ncoPrev', headerName: 'Previous', flex: 1, minWidth: 100, valueFormatter: numFmt, cellStyle: { ...baseCellStyle, textAlign: 'right', fontWeight: 500, color: '#000000' } },
          { field: 'ncoCurr', headerName: 'Current', flex: 1, minWidth: 100, valueFormatter: numFmt, cellStyle: { ...baseCellStyle, textAlign: 'right', fontWeight: 500, color: '#000000' } },
          { field: 'ncoVar', headerName: 'Variance', flex: 1, minWidth: 100, cellRenderer: VarianceCellRendererComponent, cellStyle: { ...baseCellStyle, textAlign: 'right' } },
          { headerName: '', flex: 0.4, minWidth: 80, maxWidth: 80, cellRenderer: ActionCellRendererComponent, cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' } },
        ],
      },
    ]
  }

  private buildUsLcrRowData(): (SummaryRowData & UsLcrRow)[] {
    const summary = this.buildSummaryRowData()
    const map = US_LCR_DATA_MAP
    const empty: UsLcrRow = {
      counterparty: '',
      keyFactor: '',
      lcrWeights: '',
      ruleText: '',
      notionalPrev: 0,
      notionalCurr: 0,
      notionalVar: 0,
      ncoPrev: 0,
      ncoCurr: 0,
      ncoVar: 0,
    }
    return summary.map((row) => {
      const us = map[row.nodeId] ?? empty
      return { ...row, ...us }
    })
  }

  private getSummaryColumnDefs(): (ColDef | ColGroupDef)[] {
    const nameCol: ColDef = {
      field: 'name',
      colId: 'name',
      headerName: 'Deposits',
      width: 300,
      pinned: 'left',
      cellRenderer: DepositNameCellRendererComponent,
      headerComponent: DepositsHeaderRendererComponent,
    }
    const valueFormatter = (params: ValueFormatterParams) => {
      const value = params.value
      return value != null ? Number(value).toLocaleString() : ''
    }
    const numberCellStyle = { textAlign: 'right' as const, fontWeight: 500, color: '#000000' }

    const groups: ColGroupDef[] = COUNTERPARTY_GROUPS.map((g) => {
      const children: ColDef[] = []
      if (g.hasPrevious) {
        children.push({
          field: `counterparties.${g.key}.previous`,
          headerName: 'Previous',
          width: 130,
          valueFormatter,
          cellStyle: numberCellStyle,
        })
      }
      children.push(
        {
          field: `counterparties.${g.key}.current`,
          headerName: 'Current',
          width: 130,
          valueFormatter,
          cellStyle: numberCellStyle,
        },
        {
          field: `counterparties.${g.key}.variance`,
          headerName: 'Variance',
          width: 130,
          cellRenderer: VarianceCellRendererComponent,
          cellStyle: numberCellStyle,
        },
        {
          headerName: '',
          width: 80,
          cellRenderer: ActionCellRendererComponent,
          cellStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
          },
        }
      )
      return { headerName: g.headerName, children }
    })

    return [nameCol, ...groups]
  }

  buildSummaryRowData(): SummaryRowData[] {
    const expanded = this.expandedNodes()
    const rows: SummaryRowData[] = []

    const addTrend = (d: { previous?: number; current: number; variance: number }) => ({
      ...d,
      trend: (d.variance > 0 ? 'UP' : d.variance < 0 ? 'DOWN' : 'FLAT') as 'UP' | 'DOWN' | 'FLAT',
    })
    const processCp = (cp: Record<string, unknown>) => {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(cp)) {
        if (v && typeof v === 'object' && 'variance' in v) {
          out[k] = addTrend(v as { previous?: number; current: number; variance: number })
        } else {
          out[k] = v
        }
      }
      return out
    }

    const dataStructure: Array<{
      id: string
      name: string
      level: number
      isLeaf: boolean
      hasAlert: boolean
      children?: Array<Record<string, unknown> & { id: string; name: string; hasAlert?: boolean; children?: unknown[] }>
      counterparties: Record<string, unknown>
    }> = [
      {
        id: 'personal',
        name: 'Personal',
        level: 0,
        isLeaf: false,
        hasAlert: false,
        children: [
          { id: 'personal-demand', name: 'Demand Deposits (Checking)', hasAlert: true },
          { id: 'personal-cds', name: 'CDs/Term Deposits/GIC', hasAlert: false },
          { id: 'personal-savings', name: 'Savings Accounts', hasAlert: false },
          { id: 'personal-third', name: 'Third Party Deposits', hasAlert: true },
        ],
        counterparties: processCp({
          TOTAL: { previous: 22400, current: 28000, variance: 5600 },
          RETAIL: { current: 22400, variance: 5600 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 16800, variance: 5600 },
          GSE_PSE: { current: 18800, variance: -300 },
          BANK: { current: 93000, variance: -4800 },
          BROKER_DEALERS: { current: 8700, variance: 1300 },
          INVESTMENT_FUNDS: { current: -1100, variance: -4700 },
          OTHER_FINANCIAL: { current: 22400, variance: 800 },
        }),
      },
      {
        id: 'non-personal',
        name: 'Non-Personal',
        level: 0,
        isLeaf: false,
        hasAlert: false,
        children: [
          { id: 'non-personal-sweep', name: 'Sweep Accounts', hasAlert: false },
          { id: 'non-personal-brokered', name: 'Brokered CDs', hasAlert: false },
          { id: 'non-personal-banking', name: 'Business Banking', hasAlert: false },
        ],
        counterparties: processCp({
          TOTAL: { previous: 18800, current: 18500, variance: -300 },
          RETAIL: { current: 18800, variance: -300 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 18500, variance: -300 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
      },
      {
        id: 'wholesale',
        name: 'Wholesale Deposits',
        level: 0,
        isLeaf: false,
        hasAlert: false,
        children: [
          { id: 'wholesale-cds', name: 'CDs', hasAlert: false },
          { id: 'wholesale-term', name: 'Term Deposits', hasAlert: false },
          {
            id: 'wholesale-gtb',
            name: 'GTB',
            hasAlert: false,
            children: [
              {
                id: 'wholesale-gtb-operational',
                name: 'a. Operational',
                hasAlert: false,
                children: [
                  {
                    id: 'wholesale-gtb-operational-retail',
                    name: 'Retail/SME',
                    hasAlert: false,
                    children: [
                      { id: 'wholesale-gtb-operational-retail-insured', name: 'Insured', hasAlert: false },
                      { id: 'wholesale-gtb-operational-retail-uninsured', name: 'Partial or Uninsured', hasAlert: false },
                    ],
                  },
                  {
                    id: 'wholesale-gtb-operational-bank',
                    name: 'Bank',
                    hasAlert: false,
                    children: [
                      { id: 'wholesale-gtb-operational-bank-insured', name: 'Insured', hasAlert: false },
                      { id: 'wholesale-gtb-operational-bank-uninsured', name: 'Partial or Uninsured', hasAlert: false },
                    ],
                  },
                  {
                    id: 'wholesale-gtb-operational-broker',
                    name: 'Broker Dealers',
                    hasAlert: false,
                    children: [
                      { id: 'wholesale-gtb-operational-broker-insured', name: 'Insured', hasAlert: false },
                      { id: 'wholesale-gtb-operational-broker-uninsured', name: 'Partial or Uninsured', hasAlert: false },
                    ],
                  },
                  {
                    id: 'wholesale-gtb-operational-ia',
                    name: 'IA/FMUs/Funds',
                    hasAlert: false,
                    children: [
                      { id: 'wholesale-gtb-operational-ia-insured', name: 'Insured', hasAlert: false },
                      { id: 'wholesale-gtb-operational-ia-uninsured', name: 'Partial or Uninsured', hasAlert: false },
                    ],
                  },
                  {
                    id: 'wholesale-gtb-operational-pension',
                    name: 'Pension Funds',
                    hasAlert: false,
                    children: [
                      { id: 'wholesale-gtb-operational-pension-insured', name: 'Insured', hasAlert: false },
                      { id: 'wholesale-gtb-operational-pension-uninsured', name: 'Partial or Uninsured', hasAlert: false },
                    ],
                  },
                  {
                    id: 'wholesale-gtb-operational-pse',
                    name: 'PSE/GSE/MDBs',
                    hasAlert: false,
                    children: [
                      { id: 'wholesale-gtb-operational-pse-insured', name: 'Insured', hasAlert: false },
                      { id: 'wholesale-gtb-operational-pse-uninsured', name: 'Partial or Uninsured', hasAlert: false },
                    ],
                  },
                ],
              },
              {
                id: 'wholesale-gtb-excess',
                name: 'B.Operational Excess Balance',
                hasAlert: false,
                children: [
                  {
                    id: 'wholesale-gtb-excess-retail',
                    name: 'Retail/SME',
                    hasAlert: false,
                    children: [
                      { id: 'wholesale-gtb-excess-retail-insured', name: 'Insured', hasAlert: false },
                      { id: 'wholesale-gtb-excess-retail-uninsured', name: 'Partial or Uninsured', hasAlert: false },
                    ],
                  },
                  { id: 'wholesale-gtb-excess-bank', name: 'Bank', hasAlert: false },
                  { id: 'wholesale-gtb-excess-broker', name: 'Broker Dealers', hasAlert: false },
                  { id: 'wholesale-gtb-excess-ia', name: 'IA/FMUs/Funds', hasAlert: false },
                  { id: 'wholesale-gtb-excess-pension', name: 'Pension Funds', hasAlert: false },
                  { id: 'wholesale-gtb-excess-pse', name: 'PSE/GSE/MDBs', hasAlert: false },
                  { id: 'wholesale-gtb-excess-nonfin', name: 'Non-Financial Corp', hasAlert: false },
                ],
              },
            ],
          },
        ],
        counterparties: processCp({
          TOTAL: { previous: 94200, current: 89400, variance: -4800 },
          RETAIL: { current: 94200, variance: -4800 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 94200, variance: -4800 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
      },
      {
        id: 'pwm',
        name: 'PWM Deposits',
        level: 0,
        isLeaf: false,
        hasAlert: false,
        children: [
          { id: 'pwm-cds', name: 'CDs', hasAlert: true },
          { id: 'pwm-term', name: 'Term Deposits', hasAlert: false },
          { id: 'pwm-demand', name: 'Demand Deposits', hasAlert: true },
          { id: 'pwm-savings', name: 'Savings', hasAlert: false },
        ],
        counterparties: processCp({
          TOTAL: { previous: 9500, current: 8800, variance: -700 },
          RETAIL: { current: 9500, variance: -700 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 8800, variance: -700 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
      },
    ]

    const childData: Record<string, Record<string, unknown>> = {
      'personal-demand': processCp({
        TOTAL: { previous: 8000, current: 10000, variance: 2000 },
        RETAIL: { current: 8000, variance: 2000 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 8000, variance: 2000 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'personal-cds': processCp({
        TOTAL: { previous: 5000, current: 6000, variance: 1000 },
        RETAIL: { current: 5000, variance: 1000 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 5000, variance: 1000 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'personal-savings': processCp({
        TOTAL: { previous: 4000, current: 5000, variance: 1000 },
        RETAIL: { current: 4000, variance: 1000 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 4000, variance: 1000 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'personal-third': processCp({
        TOTAL: { previous: 3000, current: 4000, variance: 1000 },
        RETAIL: { current: 3000, variance: 1000 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 3000, variance: 1000 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'non-personal-sweep': processCp({
        TOTAL: { previous: 6000, current: 5800, variance: -200 },
        RETAIL: { current: 6000, variance: -200 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 5800, variance: -200 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'non-personal-brokered': processCp({
        TOTAL: { previous: 5000, current: 5000, variance: 0 },
        RETAIL: { current: 5000, variance: 0 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 5000, variance: 0 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'non-personal-banking': processCp({
        TOTAL: { previous: 7800, current: 7700, variance: -100 },
        RETAIL: { current: 7800, variance: -100 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 7700, variance: -100 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'wholesale-cds': processCp({
        TOTAL: { previous: 30000, current: 28000, variance: -2000 },
        RETAIL: { current: 30000, variance: -2000 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 28000, variance: -2000 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'wholesale-term': processCp({
        TOTAL: { previous: 34200, current: 33400, variance: -800 },
        RETAIL: { current: 34200, variance: -800 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 33400, variance: -800 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'wholesale-gtb': processCp({
        TOTAL: { previous: 30000, current: 28000, variance: -2000 },
        RETAIL: { current: 30000, variance: -2000 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 28000, variance: -2000 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'pwm-cds': processCp({
        TOTAL: { previous: 5000, current: 4500, variance: -500 },
        RETAIL: { current: 5000, variance: -500 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 4500, variance: -500 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'pwm-term': processCp({
        TOTAL: { previous: 2000, current: 1800, variance: -200 },
        RETAIL: { current: 2000, variance: -200 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 1800, variance: -200 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'pwm-demand': processCp({
        TOTAL: { previous: 4500, current: 4300, variance: -200 },
        RETAIL: { current: 4500, variance: -200 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 4300, variance: -200 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
      'pwm-savings': processCp({
        TOTAL: { previous: 1500, current: 1200, variance: -300 },
        RETAIL: { current: 1500, variance: -300 },
        SME: { current: 0, variance: 0 },
        NON_FINANCIAL: { current: 0, variance: 0 },
        PENSION_FUNDS: { current: 0, variance: 0 },
        SOVEREIGNS: { current: 1200, variance: -300 },
        GSE_PSE: { current: 0, variance: 0 },
        BANK: { current: 0, variance: 0 },
        BROKER_DEALERS: { current: 0, variance: 0 },
        INVESTMENT_FUNDS: { current: 0, variance: 0 },
        OTHER_FINANCIAL: { current: 0, variance: 0 },
      }),
    }

    function addChildren(
      children: Array<Record<string, unknown> & { id: string; name: string; hasAlert?: boolean; children?: unknown[] }>,
      parentLevel: number
    ) {
      for (const child of children) {
        const hasChildren = Array.isArray(child.children) && child.children.length > 0
        const isChildExpanded = hasChildren && expanded.has(child.id)
        rows.push({
          nodeId: child.id,
          name: child.name,
          level: parentLevel + 1,
          isExpanded: isChildExpanded,
          isLeaf: !hasChildren,
          hasAlert: !!child.hasAlert,
          counterparties: childData[child.id] ?? {},
        })
        if (isChildExpanded && Array.isArray(child.children)) {
          addChildren(
            child.children as Array<Record<string, unknown> & { id: string; name: string; hasAlert?: boolean; children?: unknown[] }>,
            parentLevel + 1
          )
        }
      }
    }

    for (const item of dataStructure) {
      const isExpanded = expanded.has(item.id)
      rows.push({
        nodeId: item.id,
        name: item.name,
        level: item.level,
        isExpanded,
        isLeaf: item.isLeaf,
        hasAlert: item.hasAlert,
        counterparties: item.counterparties,
      })
      if (isExpanded && item.children) {
        addChildren(item.children, item.level)
      }
    }

    return rows
  }
}
