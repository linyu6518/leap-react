import { Component, OnInit, signal, computed } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { Router, ActivatedRoute, RouterLink } from '@angular/router'
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzFormModule } from 'ng-zorro-antd/form'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, ColGroupDef, ValueFormatterParams, CellClassParams } from 'ag-grid-community'
import { DepositNameCellRendererComponent } from '../../product-analysis/deposits/cell-renderers/deposit-name-cell.renderer'
import { ActionCellRendererComponent } from '../../product-analysis/deposits/cell-renderers/action-cell.renderer'
import { LcrVarianceCellRendererComponent } from './cell-renderers/lcr-variance-cell.renderer'
import { LcrEnterpriseHeaderRendererComponent } from './cell-renderers/lcr-enterprise-header.renderer'
import { AnimatedNumberComponent } from '../../../shared/animated-number/animated-number.component'
import { buildLcrRowData, type LcrRowData } from './lcr-detail-data'

const STORAGE_KEY = 'leap_lcr_query_params'

interface StoredParams {
  region: string | null
  segment: string | null
  prior: string | null
  current: string | null
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
}) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        region: p.region ?? null,
        segment: p.segment ?? null,
        prior: p.prior instanceof Date ? p.prior.toISOString().slice(0, 10) : p.prior ?? null,
        current: p.current instanceof Date ? p.current.toISOString().slice(0, 10) : p.current ?? null,
      })
    )
  } catch (_) {}
}

const SEGMENTS = [
  { key: 'enterprise', headerName: 'Enterprise' },
  { key: 'cadRetail', headerName: 'CAD Retail' },
  { key: 'wholesale', headerName: 'Wholesale' },
  { key: 'usRetail', headerName: 'US Retail' },
] as const

@Component({
  selector: 'app-lcr-detail',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    AgGridAngular,
    DepositNameCellRendererComponent,
    ActionCellRendererComponent,
    LcrVarianceCellRendererComponent,
    LcrEnterpriseHeaderRendererComponent,
    AnimatedNumberComponent,
  ],
  templateUrl: './lcr-detail.component.html',
  styleUrls: ['./lcr-detail.component.scss'],
})
export class LcrDetailComponent implements OnInit {
  form: FormGroup
  regionOpen = signal(false)
  segmentOpen = signal(false)
  lastUpdateDate = ''
  lcrRatio = 128
  totalHqla = 5250
  totalNco = 4100
  expandedNodes = signal<Set<string>>(new Set(['hqla', 'nco', 'nco-deposits']))
  rowData = computed<LcrRowData[]>(() => buildLcrRowData(this.expandedNodes()))
  columnDefs = computed<(ColDef | ColGroupDef)[]>(() => this.getColumnDefs())
  defaultColDef: ColDef = { resizable: true, sortable: false }
  gridContext = { toggleNode: (id: string) => this.toggleNode(id) }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    const nav = this.router.getCurrentNavigation()
    const state = nav?.extras?.state as (StoredParams & { enterprise?: string | null }) | undefined
    const fromState = state && (state.region != null || state.enterprise != null || state.segment != null || state.prior != null || state.current != null)
    const saved = fromState ? state : loadParams()
    const region = saved.region ?? (saved as { enterprise?: string | null }).enterprise ?? null
    const prior = saved.prior ? new Date(saved.prior) : null
    const current = saved.current ? new Date(saved.current) : null
    this.form = this.fb.group({
      region: [region, Validators.required],
      segment: [saved.segment ?? null, Validators.required],
      prior: [prior, Validators.required],
      current: [current, Validators.required],
    })
    if (fromState && region) saveParams({ region, segment: saved.segment ?? null, prior: saved.prior ?? null, current: saved.current ?? null })
    this.updateLastUpdateDate()
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((qp) => {
      if (qp['region'] || qp['enterprise']) {
        this.form.patchValue({
          region: qp['region'] ?? qp['enterprise'] ?? this.form.value.region,
          segment: qp['segment'] ?? this.form.value.segment,
        })
      }
    })
    const saved = loadParams()
    if (saved.region || saved.segment || saved.prior || saved.current) {
      this.form.patchValue({
        region: saved.region ?? this.form.value.region,
        segment: saved.segment ?? this.form.value.segment,
        prior: saved.prior ? new Date(saved.prior) : this.form.value.prior,
        current: saved.current ? new Date(saved.current) : this.form.value.current,
      })
    }
  }

  private updateLastUpdateDate(): void {
    const now = new Date()
    this.lastUpdateDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  isFormComplete(): boolean {
    const v = this.form.value
    return !!(v.region && v.segment && v.prior && v.current)
  }

  onQuery(): void {
    const v = this.form.getRawValue()
    saveParams({ region: v.region, segment: v.segment, prior: v.prior, current: v.current })
    this.updateLastUpdateDate()
  }

  toggleNode(nodeId: string): void {
    const set = new Set(this.expandedNodes())
    if (set.has(nodeId)) set.delete(nodeId)
    else set.add(nodeId)
    this.expandedNodes.set(set)
  }

  getRowId(params: { data?: LcrRowData }): string {
    return params.data?.nodeId ?? String(params.data)
  }

  private cellStyleForRow(params: CellClassParams): Record<string, string | number> {
    const d = params.data as LcrRowData
    const base: Record<string, string | number> = {}
    if (d?.isSummary) base['backgroundColor'] = '#F5F5F5'
    else if (d?.name === 'Surplus') base['backgroundColor'] = '#E6F7FF'
    return base
  }

  private getColumnDefs(): (ColDef | ColGroupDef)[] {
    const numFmt = (params: ValueFormatterParams) => {
      const value = params.value
      if (value == null) return ''
      const data = params.data as LcrRowData
      if (data?.name === 'LCR Ratio') return `${value}%`
      return Number(value).toLocaleString()
    }
    const numberStyle = { textAlign: 'right' as const, fontWeight: 500, color: '#000000' }

    const nameCol: ColDef = {
      field: 'name',
      colId: 'name',
      headerName: 'Enterprise LCR',
      flex: 1,
      minWidth: 250,
      pinned: 'left',
      cellRenderer: DepositNameCellRendererComponent,
      headerComponent: LcrEnterpriseHeaderRendererComponent,
      cellStyle: (params: CellClassParams) => this.cellStyleForRow(params),
    }

    const groups: ColGroupDef[] = SEGMENTS.map((seg) => ({
      headerName: seg.headerName,
      children: [
        {
          field: `${seg.key}.current`,
          headerName: '29-Sep',
          flex: 1,
          minWidth: 100,
          valueFormatter: numFmt,
          cellStyle: (params: CellClassParams) => ({ ...numberStyle, ...this.cellStyleForRow(params) }),
        },
        {
          field: `${seg.key}.previous`,
          headerName: '31-Aug',
          flex: 1,
          minWidth: 100,
          valueFormatter: numFmt,
          cellStyle: (params: CellClassParams) => ({ ...numberStyle, ...this.cellStyleForRow(params) }),
        },
        {
          field: `${seg.key}.variance`,
          headerName: 'Variance',
          flex: 1,
          minWidth: 100,
          cellRenderer: LcrVarianceCellRendererComponent,
          cellStyle: (params: CellClassParams) => ({ textAlign: 'right' as const, ...this.cellStyleForRow(params) }),
        },
        {
          headerName: '',
          flex: 0.5,
          minWidth: 70,
          maxWidth: 90,
          cellRenderer: ActionCellRendererComponent,
          cellStyle: (params: CellClassParams) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            ...this.cellStyleForRow(params),
          }),
        },
      ],
    }))

    return [nameCol, ...groups]
  }
}
