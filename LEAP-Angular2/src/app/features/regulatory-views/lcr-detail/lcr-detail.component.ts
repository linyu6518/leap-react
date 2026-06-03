import { Component, OnInit, signal, computed, effect } from '@angular/core'
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
import { LcrCurrentCellRendererComponent } from './cell-renderers/lcr-current-cell.renderer'
import { LcrDualMetricCellRendererComponent } from './cell-renderers/lcr-dual-metric-cell.renderer'
import { AnimatedNumberComponent } from '../../../shared/animated-number/animated-number.component'
import { buildLcrRowData, type LcrRowData, type LcrSegmentKey, type LcrWeighting } from './lcr-detail-data'
import { LcrAdjustPanelComponent, type LcrAdjustContext, type LcrAdjustSaveEvent } from './lcr-adjust-panel/lcr-adjust-panel.component'
import { SegmentTreePickerComponent } from '../../../shared/entity-tree/segment-tree-picker.component'
import { ReportScopeService } from '../../../core/services/report-scope.service'
import { columnRootsFromSelection } from '../../../shared/entity-tree/entity-data'
import { DrilldownPanelComponent } from '../../product-analysis/deposits/drilldown-panel/drilldown-panel.component'
import type { DrilldownContext } from '../../product-analysis/deposits/drilldown-panel/drilldown-data'
import { LcrBulkUploadPanelComponent, type LcrBulkUploadSubmitPayload } from './lcr-bulk-upload-panel/lcr-bulk-upload-panel.component'

const ROUTE_KEY = 'lcr-detail'
const STORAGE_KEY = 'leap_lcr_query_params'
const BULK_TEMPLATE_PATH = '/templates/lcr-bulk-upload-template.csv'
const BULK_TEMPLATE_FILENAME = 'lcr-bulk-upload-template.csv'
/** v2: default is 'both'; v1 key ignored so old 'weighted' sessions do not override. */
const WEIGHT_MODE_KEY = 'leap_lcr_weight_mode_v2'

type WeightMode = 'unweighted' | 'weighted' | 'both'

function loadWeightMode(): WeightMode {
  try {
    const s = sessionStorage.getItem(WEIGHT_MODE_KEY)
    if (s === 'unweighted' || s === 'weighted' || s === 'both') return s
  } catch (_) {}
  return 'both'
}

interface StoredParams {
  region: string | null
  segment: string | string[] | null
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
  segment?: string[] | null
  prior?: Date | string | null
  current?: Date | string | null
}) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        region: p.region ?? null,
        segment: p.segment ?? [],
        prior: p.prior instanceof Date ? p.prior.toISOString().slice(0, 10) : p.prior ?? null,
        current: p.current instanceof Date ? p.current.toISOString().slice(0, 10) : p.current ?? null,
      })
    )
  } catch (_) {}
}

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
    SegmentTreePickerComponent,
    DrilldownPanelComponent,
    LcrCurrentCellRendererComponent,
    LcrDualMetricCellRendererComponent,
    LcrAdjustPanelComponent,
    LcrBulkUploadPanelComponent,
  ],
  templateUrl: './lcr-detail.component.html',
  styleUrls: ['./lcr-detail.component.scss'],
})
export class LcrDetailComponent implements OnInit {
  form: FormGroup
  regionOpen = signal(false)
  lastUpdateDate = ''
  lcrRatio = 128
  totalHqla = 5250
  totalNco = 4100
  expandedNodes = signal<Set<string>>(new Set(['hqla', 'nco', 'nco-deposits']))
  rowData = computed<LcrRowData[]>(() => buildLcrRowData(this.expandedNodes()))
  columnDefs = computed<(ColDef | ColGroupDef)[]>(() => this.getColumnDefs())
  defaultColDef: ColDef = { resizable: true, sortable: false }
  gridContext = {
    toggleNode: (id: string) => this.toggleNode(id),
    onLcrEditClick: (payload: { row: LcrRowData; segment: LcrSegmentKey; segmentLabel: string; currentValue: number }) =>
      this.openLcrAdjustPanel(payload),
    openDrilldown: (ctx: DrilldownContext) => this.openDrilldown(ctx),
    currentDateIso: () => this.currentDateIso(),
  }
  regionSig = signal<string | null>(null)
  segmentsSig = signal<string[]>([])
  weightMode = signal<WeightMode>(loadWeightMode())
  drilldownOpen = signal(false)
  drilldownContext = signal<DrilldownContext | null>(null)
  lcrAdjustPanelOpen = signal(false)
  lcrAdjustContext = signal<LcrAdjustContext | null>(null)
  bulkUploadPanelOpen = signal(false)
  bulkUploadNoticeVisible = signal(false)
  private bulkUploadNoticeTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private scopeSvc: ReportScopeService,
  ) {
    try {
      sessionStorage.removeItem('leap_lcr_weight_mode')
    } catch (_) {}
    const nav = this.router.getCurrentNavigation()
    const state = nav?.extras?.state as (StoredParams & { enterprise?: string | null }) | undefined
    const fromState = state && (state.region != null || state.enterprise != null || state.segment != null || state.prior != null || state.current != null)
    const saved = fromState ? state : loadParams()
    const scope = this.scopeSvc.effectiveScope(ROUTE_KEY)
    const region = saved.region ?? (saved as { enterprise?: string | null }).enterprise ?? scope.region ?? null
    const prior = saved.prior ? new Date(saved.prior) : null
    const current = saved.current ? new Date(saved.current) : null
    const rawSeg = saved.segment
    const segments: string[] = rawSeg
      ? (Array.isArray(rawSeg) ? rawSeg : [rawSeg])
      : scope.segments
    this.form = this.fb.group({
      region: [region, Validators.required],
      prior: [prior, Validators.required],
      current: [current, Validators.required],
    })
    if (fromState && region) saveParams({ region, segment: segments, prior: saved.prior ?? null, current: saved.current ?? null })
    this.regionSig.set(region)
    this.segmentsSig.set(segments)
    this.updateLastUpdateDate()

    effect(() => {
      const scope = this.scopeSvc.globalScope()
      if (!this.scopeSvc.isPageOverridden(ROUTE_KEY)) {
        const r = scope.region ?? null
        this.form.patchValue({ region: r }, { emitEvent: false })
        this.regionSig.set(r)
        this.segmentsSig.set(scope.segments)
      }
    })
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((qp) => {
      if (qp['region'] || qp['enterprise']) {
        this.form.patchValue({
          region: qp['region'] ?? qp['enterprise'] ?? this.form.value.region,
        })
      }
    })
    this.form.get('region')?.valueChanges.subscribe((r: string | null) => {
      this.regionSig.set(r)
      this.segmentsSig.set([])
      this.scopeSvc.setPageOverride(ROUTE_KEY, r, [])
    })
  }

  onSegmentsChange(codes: string[]): void {
    this.segmentsSig.set(codes)
    this.scopeSvc.setPageOverride(ROUTE_KEY, this.regionSig(), codes)
  }

  setWeightMode(mode: WeightMode): void {
    this.weightMode.set(mode)
    try {
      sessionStorage.setItem(WEIGHT_MODE_KEY, mode)
    } catch (_) {}
  }

  private updateLastUpdateDate(): void {
    const now = new Date()
    this.lastUpdateDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  isFormComplete(): boolean {
    const v = this.form.value
    return !!(
      v.region &&
      this.segmentsSig().length > 0 &&
      v.prior &&
      v.current
    )
  }

  onQuery(): void {
    const v = this.form.getRawValue()
    saveParams({ region: v.region, segment: this.segmentsSig(), prior: v.prior, current: v.current })
    this.scopeSvc.setPageOverride(ROUTE_KEY, v.region, this.segmentsSig())
    this.updateLastUpdateDate()
  }

  openDrilldown(ctx: DrilldownContext): void {
    this.drilldownContext.set(ctx)
    this.drilldownOpen.set(true)
  }

  closeDrilldown(): void {
    this.drilldownOpen.set(false)
    this.drilldownContext.set(null)
  }

  openLcrAdjustPanel(payload: { row: LcrRowData; segment: LcrSegmentKey; segmentLabel: string; currentValue: number }): void {
    this.lcrAdjustContext.set({ ...payload })
    this.lcrAdjustPanelOpen.set(true)
  }

  closeLcrAdjustPanel(): void {
    this.lcrAdjustPanelOpen.set(false)
    this.lcrAdjustContext.set(null)
  }

  onLcrAdjustSaved(_event: LcrAdjustSaveEvent): void {
    this.closeLcrAdjustPanel()
  }

  openBulkUploadPanel(): void {
    this.bulkUploadPanelOpen.set(true)
  }

  closeBulkUploadPanel(): void {
    this.bulkUploadPanelOpen.set(false)
  }

  async downloadBulkUploadTemplate(): Promise<void> {
    try {
      const res = await fetch(BULK_TEMPLATE_PATH)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = BULK_TEMPLATE_FILENAME
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('LCR template download failed', err)
    }
  }

  onBulkUploadSubmitted(_payload: LcrBulkUploadSubmitPayload): void {
    this.bulkUploadNoticeVisible.set(true)
    if (this.bulkUploadNoticeTimer) clearTimeout(this.bulkUploadNoticeTimer)
    this.bulkUploadNoticeTimer = setTimeout(() => {
      this.bulkUploadNoticeVisible.set(false)
      this.bulkUploadNoticeTimer = null
    }, 4500)
  }

  dismissBulkUploadNotice(): void {
    this.bulkUploadNoticeVisible.set(false)
    if (this.bulkUploadNoticeTimer) {
      clearTimeout(this.bulkUploadNoticeTimer)
      this.bulkUploadNoticeTimer = null
    }
  }

  /** Current report date as ISO yyyy-MM-dd for seeding the drill-down filter. */
  private currentDateIso(): string | null {
    const v = this.form?.value?.current
    if (!v) return null
    return v instanceof Date ? v.toISOString().slice(0, 10) : String(v)
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

    const makeActionCol = (): ColDef => ({
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
    })

    // Build the Current / Previous / Variance trio for one segment + one weighting set.
    const metricCols = (
      base: string,
      segmentCode: string,
      label: string,
      weighting: LcrWeighting,
      withPencil: boolean,
    ): ColDef[] => {
      const field = (m: string) => `${base}.${weighting}.${m}`
      const clickCtx = (period: 'current' | 'previous', e: { data?: unknown; value?: unknown }) => ({
        segmentCode,
        segmentLabel: label,
        period,
        weighting,
        productName: (e.data as { name?: string } | undefined)?.name ?? '',
        date: this.currentDateIso(),
        amount: typeof e.value === 'number' ? e.value : null,
      })

      const current: ColDef = {
        field: field('current'),
        headerName: 'Current',
        flex: 1,
        minWidth: 100,
        valueFormatter: numFmt,
        cellClass: 'drill-clickable',
        cellStyle: (params: CellClassParams) => ({ ...numberStyle, ...this.cellStyleForRow(params) }),
        onCellClicked: (e) => this.openDrilldown(clickCtx('current', e)),
      }
      if (withPencil) current.cellRenderer = LcrCurrentCellRendererComponent

      return [
        current,
        {
          field: field('previous'),
          headerName: 'Previous',
          flex: 1,
          minWidth: 100,
          valueFormatter: numFmt,
          cellClass: 'drill-clickable',
          cellStyle: (params: CellClassParams) => ({ ...numberStyle, ...this.cellStyleForRow(params) }),
          onCellClicked: (e) => this.openDrilldown(clickCtx('previous', e)),
        },
        {
          field: field('variance'),
          headerName: 'Variance',
          flex: 1,
          minWidth: 100,
          cellRenderer: LcrVarianceCellRendererComponent,
          cellStyle: (params: CellClassParams) => ({ textAlign: 'right' as const, ...this.cellStyleForRow(params) }),
        },
      ]
    }

    // Both mode: one column per metric, stacked Uw (top) + W (bottom) in each cell.
    const dualMetricCols = (base: string, code: string, label: string): ColDef[] => {
      const dualParams = { base, segmentCode: code, segmentLabel: label }
      const dualStyle = (params: CellClassParams) => ({
        ...numberStyle,
        ...this.cellStyleForRow(params),
        paddingTop: 2,
        paddingBottom: 2,
      })
      return [
        {
          field: `${base}.weighted.current`,
          headerName: 'Current',
          headerTooltip: 'Unweighted (left) / Weighted (right)',
          flex: 1,
          minWidth: 168,
          cellRenderer: LcrDualMetricCellRendererComponent,
          cellRendererParams: { ...dualParams, metric: 'current' },
          cellClass: 'dual-metric-cell',
          cellStyle: dualStyle,
        },
        {
          field: `${base}.weighted.previous`,
          headerName: 'Previous',
          headerTooltip: 'Unweighted (left) / Weighted (right)',
          flex: 1,
          minWidth: 168,
          cellRenderer: LcrDualMetricCellRendererComponent,
          cellRendererParams: { ...dualParams, metric: 'previous' },
          cellClass: 'dual-metric-cell',
          cellStyle: dualStyle,
        },
        {
          field: `${base}.weighted.variance`,
          headerName: 'Variance',
          headerTooltip: 'Unweighted (left) / Weighted (right)',
          flex: 1,
          minWidth: 168,
          cellRenderer: LcrDualMetricCellRendererComponent,
          cellRendererParams: { ...dualParams, metric: 'variance' },
          cellClass: 'dual-metric-cell',
          cellStyle: (params: CellClassParams) => ({ textAlign: 'right' as const, ...this.cellStyleForRow(params) }),
        },
        makeActionCol(),
      ]
    }

    // One segment column group, honoring the active weighting mode.
    const buildSegmentGroup = (base: string, code: string, label: string): ColGroupDef => {
      const mode = this.weightMode()
      if (mode === 'both') {
        return {
          headerName: label,
          children: dualMetricCols(base, code, label),
        }
      }
      const weighting: LcrWeighting = mode === 'unweighted' ? 'unweighted' : 'weighted'
      return {
        headerName: label,
        children: [...metricCols(base, code, label, weighting, weighting === 'weighted'), makeActionCol()],
      }
    }

    const segRoots = columnRootsFromSelection(this.regionSig(), this.segmentsSig())

    if (!segRoots.length) {
      // Fallback: static enterprise/cadRetail/wholesale/usRetail columns
      const FALLBACK = [
        { key: 'enterprise', headerName: 'Enterprise' },
        { key: 'cadRetail', headerName: 'CAD Retail' },
        { key: 'wholesale', headerName: 'Wholesale' },
        { key: 'usRetail', headerName: 'US Retail' },
      ] as const
      const groups = FALLBACK.map((seg) => buildSegmentGroup(seg.key, seg.key, seg.headerName))
      return [nameCol, ...groups]
    }

    const groups = segRoots.map(({ code, label }) => buildSegmentGroup(`segments.${code}`, code, label))
    return [nameCol, ...groups]
  }
}
