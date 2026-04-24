import { Component, OnInit, signal, computed, effect } from '@angular/core'
import confetti from 'canvas-confetti'
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
import { Fr2052aAmountCellRendererComponent } from './cell-renderers/fr2052a-amount-cell.renderer'
import { WithdrawalRiskHeaderRendererComponent } from './cell-renderers/withdrawal-risk-header.renderer'
import { CommentPanelComponent } from './comment-panel/comment-panel.component'
import { buildRowIndex, rowHasAnyComment, hasScopedComment, type ScopeKey } from './comment-panel/comment-data'
import { DRIVER_CODES } from './comment-panel/driver-codes'
import { EscalationPanelComponent } from './escalation-panel/escalation-panel.component'
import { AdjustmentPanelComponent } from './adjustment-panel/adjustment-panel.component'
import type { UsLcrRow } from './us-lcr-data'
import { US_LCR_DATA_MAP } from './us-lcr-data'
import type { FR2052AData, Fr2052AmountField } from './fr2052a-data'

export type { FR2052AData, Fr2052AmountField } from './fr2052a-data'

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

type Trend = 'UP' | 'DOWN' | 'FLAT'
type CpField = { previous?: number; current: number; variance: number; trend?: Trend }
type Cp = Record<string, CpField>

const CP_BREAKDOWN_KEYS = [
  'RETAIL', 'SME', 'NON_FINANCIAL', 'PENSION_FUNDS', 'SOVEREIGNS',
  'GSE_PSE', 'BANK', 'BROKER_DEALERS', 'INVESTMENT_FUNDS', 'OTHER_FINANCIAL',
] as const

/**
 * Build a leaf Cp from (current, variance, previous) for TOTAL plus a breakdown
 * across non-TOTAL counterparty columns. Missing breakdown keys default to 0.
 *
 * Parents are never listed here — their values are derived by summing children.
 */
function leafCp(
  total: { current: number; variance: number; previous: number },
  breakdown: Partial<Record<(typeof CP_BREAKDOWN_KEYS)[number], { current: number; variance: number }>> = {},
): Cp {
  const out: Cp = {
    TOTAL: { previous: total.previous, current: total.current, variance: total.variance },
  }
  for (const k of CP_BREAKDOWN_KEYS) {
    const b = breakdown[k]
    out[k] = { current: b?.current ?? 0, variance: b?.variance ?? 0 }
  }
  return out
}

/**
 * Counterparties for every leaf in the summary tree. All non-leaf nodes are
 * computed from these via {@link sumCounterparties} so the displayed totals
 * always equal the sum of their descendants.
 */
const LEAF_COUNTERPARTIES: Record<string, Cp> = {
  // Personal (retail)
  'personal-demand': leafCp(
    { current: 10000, variance: 2000, previous: 8000 },
    { RETAIL: { current: 10000, variance: 2000 } },
  ),
  'personal-cds': leafCp(
    { current: 6000, variance: 1000, previous: 5000 },
    { RETAIL: { current: 6000, variance: 1000 } },
  ),
  'personal-savings': leafCp(
    { current: 5000, variance: 1000, previous: 4000 },
    { RETAIL: { current: 5000, variance: 1000 } },
  ),
  'personal-third': leafCp(
    { current: 4000, variance: 1000, previous: 3000 },
    {
      RETAIL: { current: 3200, variance: 800 },
      OTHER_FINANCIAL: { current: 800, variance: 200 },
    },
  ),

  // Non-Personal (SME / small commercial)
  'non-personal-sweep': leafCp(
    { current: 5800, variance: -200, previous: 6000 },
    {
      SME: { current: 4000, variance: -150 },
      NON_FINANCIAL: { current: 1800, variance: -50 },
    },
  ),
  'non-personal-brokered': leafCp(
    { current: 5000, variance: 0, previous: 5000 },
    { BROKER_DEALERS: { current: 5000, variance: 0 } },
  ),
  'non-personal-banking': leafCp(
    { current: 7700, variance: -100, previous: 7800 },
    {
      SME: { current: 5000, variance: -60 },
      NON_FINANCIAL: { current: 2700, variance: -40 },
    },
  ),

  // Wholesale direct leaves
  'wholesale-cds': leafCp(
    { current: 28000, variance: -2000, previous: 30000 },
    {
      BANK: { current: 15000, variance: -1000 },
      GSE_PSE: { current: 8000, variance: -500 },
      SOVEREIGNS: { current: 5000, variance: -500 },
    },
  ),
  'wholesale-term': leafCp(
    { current: 33400, variance: -800, previous: 34200 },
    {
      BANK: { current: 20000, variance: -400 },
      SOVEREIGNS: { current: 8000, variance: -200 },
      GSE_PSE: { current: 5400, variance: -200 },
    },
  ),

  // Wholesale > GTB > a. Operational (paired insured/uninsured per counterparty)
  'wholesale-gtb-operational-retail-insured': leafCp(
    { current: 3000, variance: -500, previous: 3500 },
    {
      RETAIL: { current: 2000, variance: -350 },
      SME: { current: 1000, variance: -150 },
    },
  ),
  'wholesale-gtb-operational-retail-uninsured': leafCp(
    { current: 3000, variance: -300, previous: 3300 },
    {
      RETAIL: { current: 2000, variance: -200 },
      SME: { current: 1000, variance: -100 },
    },
  ),
  'wholesale-gtb-operational-bank-insured': leafCp(
    { current: 2000, variance: -200, previous: 2200 },
    { BANK: { current: 2000, variance: -200 } },
  ),
  'wholesale-gtb-operational-bank-uninsured': leafCp(
    { current: 2000, variance: -100, previous: 2100 },
    { BANK: { current: 2000, variance: -100 } },
  ),
  'wholesale-gtb-operational-broker-insured': leafCp(
    { current: 1500, variance: 0, previous: 1500 },
    { BROKER_DEALERS: { current: 1500, variance: 0 } },
  ),
  'wholesale-gtb-operational-broker-uninsured': leafCp(
    { current: 1500, variance: -100, previous: 1600 },
    { BROKER_DEALERS: { current: 1500, variance: -100 } },
  ),
  'wholesale-gtb-operational-ia-insured': leafCp(
    { current: 1500, variance: -100, previous: 1600 },
    { INVESTMENT_FUNDS: { current: 1500, variance: -100 } },
  ),
  'wholesale-gtb-operational-ia-uninsured': leafCp(
    { current: 1500, variance: -100, previous: 1600 },
    { INVESTMENT_FUNDS: { current: 1500, variance: -100 } },
  ),
  'wholesale-gtb-operational-pension-insured': leafCp(
    { current: 1000, variance: -50, previous: 1050 },
    { PENSION_FUNDS: { current: 1000, variance: -50 } },
  ),
  'wholesale-gtb-operational-pension-uninsured': leafCp(
    { current: 1000, variance: -50, previous: 1050 },
    { PENSION_FUNDS: { current: 1000, variance: -50 } },
  ),
  'wholesale-gtb-operational-pse-insured': leafCp(
    { current: 1000, variance: -50, previous: 1050 },
    { GSE_PSE: { current: 1000, variance: -50 } },
  ),
  'wholesale-gtb-operational-pse-uninsured': leafCp(
    { current: 1000, variance: -50, previous: 1050 },
    { GSE_PSE: { current: 1000, variance: -50 } },
  ),

  // Wholesale > GTB > B. Operational Excess Balance
  'wholesale-gtb-excess-retail-insured': leafCp(
    { current: 1500, variance: -100, previous: 1600 },
    {
      RETAIL: { current: 1000, variance: -70 },
      SME: { current: 500, variance: -30 },
    },
  ),
  'wholesale-gtb-excess-retail-uninsured': leafCp(
    { current: 1000, variance: -50, previous: 1050 },
    {
      RETAIL: { current: 700, variance: -35 },
      SME: { current: 300, variance: -15 },
    },
  ),
  'wholesale-gtb-excess-bank': leafCp(
    { current: 1200, variance: -50, previous: 1250 },
    { BANK: { current: 1200, variance: -50 } },
  ),
  'wholesale-gtb-excess-broker': leafCp(
    { current: 800, variance: -20, previous: 820 },
    { BROKER_DEALERS: { current: 800, variance: -20 } },
  ),
  'wholesale-gtb-excess-ia': leafCp(
    { current: 1000, variance: -80, previous: 1080 },
    { INVESTMENT_FUNDS: { current: 1000, variance: -80 } },
  ),
  'wholesale-gtb-excess-pension': leafCp(
    { current: 900, variance: -50, previous: 950 },
    { PENSION_FUNDS: { current: 900, variance: -50 } },
  ),
  'wholesale-gtb-excess-pse': leafCp(
    { current: 800, variance: -30, previous: 830 },
    { GSE_PSE: { current: 800, variance: -30 } },
  ),
  'wholesale-gtb-excess-nonfin': leafCp(
    { current: 800, variance: -20, previous: 820 },
    { NON_FINANCIAL: { current: 800, variance: -20 } },
  ),

  // PWM (retail wealth)
  'pwm-cds': leafCp(
    { current: 4500, variance: -500, previous: 5000 },
    { RETAIL: { current: 4500, variance: -500 } },
  ),
  'pwm-term': leafCp(
    { current: 1800, variance: -200, previous: 2000 },
    { RETAIL: { current: 1800, variance: -200 } },
  ),
  'pwm-demand': leafCp(
    { current: 4300, variance: -200, previous: 4500 },
    { RETAIL: { current: 4300, variance: -200 } },
  ),
  'pwm-savings': leafCp(
    { current: 1200, variance: -300, previous: 1500 },
    { RETAIL: { current: 1200, variance: -300 } },
  ),
}

/** Zero-valued Cp used as a rollup identity. */
function emptyCp(includePrevious: boolean): Cp {
  const out: Cp = {
    TOTAL: includePrevious
      ? { previous: 0, current: 0, variance: 0 }
      : { current: 0, variance: 0 },
  }
  for (const k of CP_BREAKDOWN_KEYS) out[k] = { current: 0, variance: 0 }
  return out
}

/** Pairwise sum: returns `a + b` for every counterparty column. */
function addCp(a: Cp, b: Cp): Cp {
  const out: Cp = {}
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    const x = a[k] ?? { current: 0, variance: 0 }
    const y = b[k] ?? { current: 0, variance: 0 }
    const hasPrev = x.previous != null || y.previous != null
    out[k] = {
      ...(hasPrev ? { previous: (x.previous ?? 0) + (y.previous ?? 0) } : {}),
      current: (x.current ?? 0) + (y.current ?? 0),
      variance: (x.variance ?? 0) + (y.variance ?? 0),
    }
  }
  return out
}

/** Attach a UP/DOWN/FLAT trend flag to every column, based on its variance. */
function attachTrend(cp: Cp): Cp {
  const out: Cp = {}
  for (const [k, v] of Object.entries(cp)) {
    out[k] = {
      ...v,
      trend: v.variance > 0 ? 'UP' : v.variance < 0 ? 'DOWN' : 'FLAT',
    }
  }
  return out
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
    Fr2052aAmountCellRendererComponent,
    WithdrawalRiskHeaderRendererComponent,
    CommentPanelComponent,
    EscalationPanelComponent,
    AdjustmentPanelComponent,
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
  /** Scope (counterparty column) the panel should focus. Set by Action = 'TOTAL', by Variance cell = the cell's column key. */
  activeScopeKey = signal<ScopeKey>('TOTAL')
  /** Static summary-tree index for the Comment panel. Built once; the panel uses it to find descendant rows. */
  readonly summaryRowIndex = buildRowIndex()
  /** Cached `nodeId -> Cp` for the entire tree (independent of expansion). Populated by buildSummaryRowData. */
  private _cpByNode = signal<ReadonlyMap<string, Cp>>(new Map())
  /** `nodeId -> direct children ids` for the whole tree. Populated by buildSummaryRowData. */
  private _childrenByNode = signal<ReadonlyMap<string, string[]>>(new Map())
  /** `${nodeId}::${scope}` -> variance number, derived from {@link _cpByNode}. */
  readonly varianceByNodeScope = computed<ReadonlyMap<string, number>>(() => {
    const out = new Map<string, number>()
    for (const [nodeId, cp] of this._cpByNode()) {
      for (const [scope, field] of Object.entries(cp)) {
        out.set(`${nodeId}::${scope}`, field.variance ?? 0)
      }
    }
    return out
  })
  readonly childrenByNode = computed<ReadonlyMap<string, string[]>>(() => this._childrenByNode())
  /** Expose to template. */
  readonly DRIVER_CODES = DRIVER_CODES

  escalationPanelOpen = signal(false)
  selectedRowForEscalation = signal<unknown>(null)
  escalationNoticeVisible = signal(false)
  private escalationNoticeTimer: ReturnType<typeof setTimeout> | null = null

  adjustmentPanelOpen = signal(false)
  /** Row + column must be set together so the panel always reads the correct cell value. */
  adjustmentPanelContext = signal<{ row: FR2052AData; amountField: Fr2052AmountField } | null>(null)
  adjustmentNoticeVisible = signal(false)
  private adjustmentNoticeTimer: ReturnType<typeof setTimeout> | null = null

  gridContext = {
    toggleNode: (id: string) => this.toggleNode(id),
    onCommentClick: (data: unknown) => this.openCommentPanel(data),
    onEscalateClick: (data: unknown) => this.openEscalationPanel(data),
    onAdjustClick: (payload: { row: unknown; amountField: Fr2052AmountField }) => this.openAdjustmentPanel(payload),
    hasScopedComment: (rowId: string, scope: ScopeKey) => hasScopedComment(rowId, scope),
    openScopedPanel: (data: unknown, scope: ScopeKey) => this.openScopedPanel(data, scope),
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
    this.activeScopeKey.set('TOTAL')
    this.selectedRowForComment.set(data)
    this.commentPanelOpen.set(true)
  }

  /** Entry point from a Variance cell: open the panel focused on the cell's counterparty scope. */
  openScopedPanel(data: unknown, scope: ScopeKey): void {
    this.activeScopeKey.set(scope)
    this.selectedRowForComment.set(data)
    this.commentPanelOpen.set(true)
  }

  /** Emitted by the panel's scope-tab bar so the grid stays in sync (dots, tooltips are scope-aware). */
  onPanelScopeChanged(scope: ScopeKey): void {
    this.activeScopeKey.set(scope)
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

  openAdjustmentPanel(payload: { row: unknown; amountField: Fr2052AmountField }): void {
    const raw = payload.row as FR2052AData | null | undefined
    if (!raw) return
    this.adjustmentPanelContext.set({
      row: { ...raw },
      amountField: payload.amountField,
    })
    this.adjustmentPanelOpen.set(true)
  }

  closeAdjustmentPanel(): void {
    this.adjustmentPanelOpen.set(false)
    this.adjustmentPanelContext.set(null)
  }

  private recalculateFr2052GrandTotal(rows: FR2052AData[]): FR2052AData[] {
    const dataRows = rows.filter(r => !r.isGrandTotal)
    const gtIndex = rows.findIndex(r => r.isGrandTotal)
    if (gtIndex < 0) return rows
    const sum1 = dataRows.reduce((a, r) => a + (r.amount1 || 0), 0)
    const sum2 = dataRows.reduce((a, r) => a + (r.amount2 || 0), 0)
    const sum3 = dataRows.reduce((a, r) => a + (r.amount3 || 0), 0)
    return rows.map((r, i) =>
      i === gtIndex ? { ...r, amount1: sum1, amount2: sum2, amount3: sum3 } : r
    )
  }

  onAdjustmentSaved(updatedRow: unknown): void {
    const updated = updatedRow as FR2052AData
    const current = this.rowData() as FR2052AData[]
    const next = current.map(row =>
      row.pid === updated.pid && row.product === updated.product ? { ...row, ...updated } : row
    )
    this.rowData.set(this.recalculateFr2052GrandTotal(next))
    this.closeAdjustmentPanel()
    this.showAdjustmentNotice()
  }

  onEscalationConfirmed(_: { contacts: string[]; comment: string }): void {
    const escalatedRow = this.selectedRowForEscalation() as FR2052AData | null
    if (escalatedRow) {
      const current = this.rowData() as FR2052AData[]
      this.rowData.set(
        current.map(row =>
          row.pid === escalatedRow.pid && row.product === escalatedRow.product
            ? { ...row, isEscalated: true }
            : row
        )
      )
    }
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

    queueMicrotask(() => this.fireToastConfetti())
  }

  dismissAdjustmentNotice(): void {
    this.adjustmentNoticeVisible.set(false)
    if (this.adjustmentNoticeTimer) {
      clearTimeout(this.adjustmentNoticeTimer)
      this.adjustmentNoticeTimer = null
    }
  }

  private showAdjustmentNotice(): void {
    this.adjustmentNoticeVisible.set(true)
    if (this.adjustmentNoticeTimer) clearTimeout(this.adjustmentNoticeTimer)
    this.adjustmentNoticeTimer = setTimeout(() => {
      this.adjustmentNoticeVisible.set(false)
      this.adjustmentNoticeTimer = null
    }, 4500)

    queueMicrotask(() => this.fireToastConfetti())
  }

  /** Full-viewport confetti for success toasts (Escalation + Adjustment). */
  private fireToastConfetti(): void {
    const colors = [
      '#E53935',
      '#FB8C00',
      '#FDD835',
      '#43A047',
      '#1E88E5',
      '#8E24AA',
      '#EC407A',
      '#26A69A',
      '#7CB342',
      '#5C6BC0',
    ]
    const burst = (particleCount: number, spread: number, startVelocity: number) =>
      confetti({
        particleCount,
        spread,
        startVelocity,
        gravity: 0.58,
        ticks: 150,
        scalar: 0.58,
        drift: 0.012,
        colors,
        origin: { x: 0.88, y: 0.07 },
        disableForReducedMotion: true,
      })
    void burst(64, 50, 30)
    setTimeout(() => {
      void burst(36, 66, 22)
    }, 85)
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
      { pid: 'O.D.1', product: 'Transactional Accounts', amount1: 137199, amount2: 138420, amount3: 12450, hasAlert: false, reportingEntity: 'TD USA', counterparty: 'Retail', insured: 'Yes', businessLine: 'Retail Banking', currency: 'USD', trigger: 'US Retail', internal: 'No', converted: 'No', maturityAmount: 137199, issueId: 'US_501' },
      { pid: 'O.D.2', product: 'Non-Transactional Relationship Accounts', amount1: 89234, amount2: 88500, amount3: 4200, hasAlert: false, reportingEntity: 'TD USA', counterparty: 'SME', insured: 'No', businessLine: 'Commercial', currency: 'USD', trigger: 'US SME', internal: 'No', converted: 'No', maturityAmount: 89234, issueId: 'US_502' },
      { pid: 'O.D.3', product: 'Non-Transactional Non-Relationship Accounts', amount1: 45620, amount2: 44100, amount3: 2100, hasAlert: true, reportingEntity: 'TD USA', counterparty: 'Retail', insured: 'No', businessLine: 'No', currency: 'USD', trigger: 'US Retail', internal: 'No', converted: 'No', maturityAmount: 45620, issueId: 'US_511' },
      { pid: 'O.D.4', product: 'Operational Account Balances', amount1: 28450, amount2: 29100, amount3: 1850, hasAlert: false, reportingEntity: 'TD Canada', counterparty: 'Non-Financial', insured: 'Yes', businessLine: 'Wealth', currency: 'CAD', trigger: 'CAD Retail', internal: 'No', converted: 'No', maturityAmount: 28450, issueId: 'CA_401' },
      { pid: 'O.D.5', product: 'Excess Balances in Operational Accounts', amount1: 15680, amount2: 16200, amount3: 920, hasAlert: false, reportingEntity: 'TD Canada', counterparty: 'Retail', insured: 'Yes', businessLine: 'Retail Banking', currency: 'CAD', trigger: 'CAD Retail', internal: 'No', converted: 'No', maturityAmount: 15680, issueId: 'CA_402' },
      { pid: 'O.D.6', product: 'Non-Operational Account Balances', amount1: 52340, amount2: 51800, amount3: 3100, hasAlert: false, reportingEntity: 'TD USA', counterparty: 'Bank', insured: 'No', businessLine: 'Wholesale', currency: 'USD', trigger: 'US Wholesale', internal: 'Yes', converted: 'No', maturityAmount: 52340, issueId: 'US_601' },
      { pid: 'O.D.7', product: 'Operational Escrow Accounts', amount1: 12300, amount2: 11900, amount3: 680, hasAlert: false, reportingEntity: 'TD USA', counterparty: 'GSE/PSE', insured: 'No', businessLine: 'Government', currency: 'USD', trigger: 'US Retail', internal: 'No', converted: 'No', maturityAmount: 12300, issueId: 'US_701' },
      { pid: 'O.D.8', product: 'Non-Reciprocal Brokered Deposits', amount1: -33, amount2: -28, amount3: -5, hasAlert: false, reportingEntity: 'TD USA', counterparty: 'Broker Dealers', insured: 'No', businessLine: 'Capital Markets', currency: 'USD', trigger: 'US Wholesale', internal: 'No', converted: 'Yes', maturityAmount: -33, issueId: 'US_801' },
      { pid: 'O.D.10', product: 'Less Stable Affiliated Sweep Account Balances', amount1: -24, amount2: -31, amount3: -8, hasAlert: true, reportingEntity: 'TD USA', counterparty: 'Investment Funds', insured: 'No', businessLine: 'Asset Management', currency: 'USD', trigger: 'US Wholesale', internal: 'No', converted: 'Yes', maturityAmount: -24, issueId: 'US_802' },
      { pid: 'O.D.11', product: 'Non-Affiliated Sweep Accounts', amount1: 18700, amount2: 19200, amount3: 1100, hasAlert: false, reportingEntity: 'TD Canada', counterparty: 'SME', insured: 'No', businessLine: 'Commercial', currency: 'CAD', trigger: 'CAD SME', internal: 'No', converted: 'No', maturityAmount: 18700, issueId: 'CA_501' },
      { pid: 'O.D.14', product: 'Other Third-Party Deposits', amount1: 22400, amount2: 21800, amount3: 1350, hasAlert: false, reportingEntity: 'TD USA', counterparty: 'Other Financial', insured: 'No', businessLine: 'Commercial', currency: 'USD', trigger: 'US Retail', internal: 'No', converted: 'No', maturityAmount: 22400, issueId: 'US_901' },
      { pid: 'O.W.16', product: 'Wholesale CDs', amount1: 67800, amount2: 65200, amount3: 4200, hasAlert: false, reportingEntity: 'TD USA', counterparty: 'Bank', insured: 'No', businessLine: 'Wholesale', currency: 'USD', trigger: 'US Wholesale', internal: 'Yes', converted: 'No', maturityAmount: 67800, issueId: 'US_1001' },
      { pid: 'S.L.4', product: 'Non-Structured Debt Maturing in Greater than 30-d', amount1: 12500, amount2: 12200, amount3: 750, hasAlert: false, reportingEntity: 'TD Canada', counterparty: 'Sovereigns', insured: 'No', businessLine: 'Government', currency: 'CAD', trigger: 'CAD Wholesale', internal: 'No', converted: 'No', maturityAmount: 12500, issueId: 'CA_601' },
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

  /** Marks cells with before/after amounts so grid CSS can align padding and focus ring. */
  private fr2052aAmountAdjustedCellClass(params: CellClassParams): string | undefined {
    const d = params.data as FR2052AData | undefined
    if (!d || d.isGrandTotal) return undefined
    const f = params.colDef?.field
    if (f !== 'amount1' && f !== 'amount2' && f !== 'amount3') return undefined
    const prev = d.amountAdjustedFrom?.[f]
    if (typeof prev === 'number') return 'fr2052a-amount-adjusted'
    return undefined
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
        minWidth: 140,
        wrapText: true,
        cellClass: (params) => this.fr2052aAmountAdjustedCellClass(params),
        cellRenderer: Fr2052aAmountCellRendererComponent,
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
        minWidth: 140,
        wrapText: true,
        cellClass: (params) => this.fr2052aAmountAdjustedCellClass(params),
        cellRenderer: Fr2052aAmountCellRendererComponent,
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
        minWidth: 140,
        wrapText: true,
        cellClass: (params) => this.fr2052aAmountAdjustedCellClass(params),
        cellRenderer: Fr2052aAmountCellRendererComponent,
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

    /** Static hierarchy. Counterparties live in LEAF_COUNTERPARTIES; parents are rolled up. */
    interface TreeNode {
      id: string
      name: string
      hasAlert?: boolean
      children?: TreeNode[]
    }

    const dataStructure: Array<{ id: string; name: string; level: number; hasAlert: boolean; children: TreeNode[] }> = [
      {
        id: 'personal',
        name: 'Personal',
        level: 0,
        hasAlert: false,
        children: [
          { id: 'personal-demand', name: 'Demand Deposits (Checking)', hasAlert: true },
          { id: 'personal-cds', name: 'CDs/Term Deposits/GIC', hasAlert: false },
          { id: 'personal-savings', name: 'Savings Accounts', hasAlert: false },
          { id: 'personal-third', name: 'Third Party Deposits', hasAlert: true },
        ],
      },
      {
        id: 'non-personal',
        name: 'Non-Personal',
        level: 0,
        hasAlert: false,
        children: [
          { id: 'non-personal-sweep', name: 'Sweep Accounts', hasAlert: false },
          { id: 'non-personal-brokered', name: 'Brokered CDs', hasAlert: false },
          { id: 'non-personal-banking', name: 'Business Banking', hasAlert: false },
        ],
      },
      {
        id: 'wholesale',
        name: 'Wholesale Deposits',
        level: 0,
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
      },
      {
        id: 'pwm',
        name: 'PWM Deposits',
        level: 0,
        hasAlert: false,
        children: [
          { id: 'pwm-cds', name: 'CDs', hasAlert: true },
          { id: 'pwm-term', name: 'Term Deposits', hasAlert: false },
          { id: 'pwm-demand', name: 'Demand Deposits', hasAlert: true },
          { id: 'pwm-savings', name: 'Savings', hasAlert: false },
        ],
      },
    ]

    // Rollup caches keyed by nodeId: cp sums, "any descendant has comments" flag, and `node -> children ids`.
    const cpCache = new Map<string, Cp>()
    const commentsCache = new Map<string, boolean>()
    const childrenMap = new Map<string, string[]>()

    const computeCp = (node: TreeNode): Cp => {
      const hit = cpCache.get(node.id)
      if (hit) return hit
      const hasChildren = Array.isArray(node.children) && node.children.length > 0
      let cp: Cp
      if (!hasChildren) {
        cp = LEAF_COUNTERPARTIES[node.id] ?? emptyCp(true)
      } else {
        cp = emptyCp(true)
        for (const c of node.children!) cp = addCp(cp, computeCp(c))
      }
      cpCache.set(node.id, cp)
      childrenMap.set(node.id, (node.children ?? []).map((c) => c.id))
      return cp
    }

    const hasAnyComments = (node: TreeNode): boolean => {
      const hit = commentsCache.get(node.id)
      if (hit !== undefined) return hit
      const own = rowHasAnyComment(node.id)
      const fromChildren = (node.children ?? []).some((c) => hasAnyComments(c))
      const flag = own || fromChildren
      commentsCache.set(node.id, flag)
      return flag
    }

    const pushRow = (node: TreeNode, level: number): void => {
      const hasChildren = Array.isArray(node.children) && node.children.length > 0
      const isExpanded = hasChildren && expanded.has(node.id)
      rows.push({
        nodeId: node.id,
        name: node.name,
        level,
        isExpanded,
        isLeaf: !hasChildren,
        hasAlert: !!node.hasAlert,
        hasComments: hasAnyComments(node),
        counterparties: attachTrend(computeCp(node)),
      })
      if (isExpanded) {
        for (const c of node.children!) pushRow(c, level + 1)
      }
    }

    for (const item of dataStructure) {
      pushRow(item, item.level)
    }

    // Force full-tree rollup (computeCp is memoized; walking every node guarantees
    // _cpByNode has entries for collapsed descendants too).
    const walkAll = (node: TreeNode): void => {
      computeCp(node)
      for (const c of node.children ?? []) walkAll(c)
    }
    for (const item of dataStructure) walkAll(item)

    this._cpByNode.set(cpCache)
    this._childrenByNode.set(childrenMap)

    return rows
  }
}
