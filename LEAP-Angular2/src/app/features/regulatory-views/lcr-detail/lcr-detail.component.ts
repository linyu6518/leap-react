import { Component, OnInit, AfterViewInit, OnDestroy, signal, computed, effect } from '@angular/core'
import confetti from 'canvas-confetti'
import { DecimalPipe } from '@angular/common'
import { Router, ActivatedRoute, RouterLink } from '@angular/router'
import { ViewModeService } from '../../../core/services/view-mode.service'
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzFormModule } from 'ng-zorro-antd/form'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, ColGroupDef, ValueFormatterParams, CellClassParams, GridApi, GridReadyEvent } from 'ag-grid-community'
import { DepositNameCellRendererComponent } from '../../product-analysis/deposits/cell-renderers/deposit-name-cell.renderer'
import { LcrVarianceCellRendererComponent } from './cell-renderers/lcr-variance-cell.renderer'
import { LcrEnterpriseHeaderRendererComponent } from './cell-renderers/lcr-enterprise-header.renderer'
import { LcrCurrentCellRendererComponent } from './cell-renderers/lcr-current-cell.renderer'
import { LcrActionCellRendererComponent } from './cell-renderers/lcr-action-cell.renderer'
import { AnimatedNumberComponent } from '../../../shared/animated-number/animated-number.component'
import { CommentPanelComponent } from '../../product-analysis/deposits/comment-panel/comment-panel.component'
import { LcrAdjustPanelComponent, type LcrAdjustContext, type LcrAdjustSaveEvent } from './lcr-adjust-panel/lcr-adjust-panel.component'
import {
  LcrBulkUploadPanelComponent,
  type LcrBulkUploadSubmitPayload,
} from './lcr-bulk-upload-panel/lcr-bulk-upload-panel.component'
import { buildLcrRowData, type LcrRowData, type LcrSegmentKey } from './lcr-detail-data'

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

const BULK_TEMPLATE_PATH = '/templates/lcr-bulk-upload-template.csv'
const BULK_TEMPLATE_FILENAME = 'lcr-bulk-upload-template.csv'

/** Fallback before first layout measure (matches expanded sidebar width in layout) */
const CONTENT_AREA_LEFT_FALLBACK = 270

const SEGMENTS = [
  { key: 'enterprise', headerName: 'Enterprise' },
  { key: 'cadRetail', headerName: 'CAD Retail' },
  { key: 'wholesale', headerName: 'Wholesale' },
  { key: 'usRetail', headerName: 'US Retail' },
] as const

export type LcrCurrencyTabId = 'ALL' | 'CAD' | 'USD' | 'JPY' | 'EUR' | 'GBP' | 'OTH' | 'ADJ'

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
    LcrVarianceCellRendererComponent,
    LcrEnterpriseHeaderRendererComponent,
    AnimatedNumberComponent,
    CommentPanelComponent,
    LcrAdjustPanelComponent,
    LcrBulkUploadPanelComponent,
    LcrCurrentCellRendererComponent,
    LcrActionCellRendererComponent,
  ],
  templateUrl: './lcr-detail.component.html',
  styleUrls: ['./lcr-detail.component.scss'],
})
export class LcrDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  form: FormGroup
  regionOpen = signal(false)
  segmentOpen = signal(false)
  lastUpdateDate = ''
  lcrRatio = 128
  totalHqla = 5250
  totalNco = 4100
  isCheckerMode = computed(() => this.viewModeService.viewMode() === 'checker')
  /** nodeId -> segment -> sign-off marker */
  signedOffBySegment = signal<Record<string, Partial<Record<LcrSegmentKey, boolean>>>>({})
  /** Counts any checker action (escalate / sign-off / adjustment) since last publish */
  private checkerModificationCount = signal(0)
  canPublish = computed(() => this.isCheckerMode() && this.checkerModificationCount() > 0)
  expandedNodes = signal<Set<string>>(new Set(['hqla', 'nco', 'nco-deposits']))

  /** nodeId → segment → { original, adjusted } */
  private lcrOverrides = signal<Record<string, Partial<Record<LcrSegmentKey, { original: number; adjusted: number }>>>>({})

  rowData = computed<LcrRowData[]>(() => {
    const base = buildLcrRowData(this.expandedNodes())
    const overrides = this.lcrOverrides()
    if (!Object.keys(overrides).length) return base
    return base.map(row => {
      const o = overrides[row.nodeId]
      if (!o) return row
      const adjustedFrom: Partial<Record<LcrSegmentKey, number>> = { ...row.adjustedFrom }
      const patch: Partial<LcrRowData> = {}
      for (const [seg, vals] of Object.entries(o) as [LcrSegmentKey, { original: number; adjusted: number }][]) {
        adjustedFrom[seg] = vals.original
        const segData = row[seg]
        patch[seg] = { ...segData, current: vals.adjusted }
      }
      return { ...row, ...patch, adjustedFrom }
    })
  })

  columnDefs = computed<(ColDef | ColGroupDef)[]>(() => this.getColumnDefs())
  defaultColDef: ColDef = { resizable: true, sortable: false }
  commentPanelOpen = signal(false)
  selectedRowForComment = signal<unknown>(null)
  lcrAdjustPanelOpen = signal(false)
  lcrAdjustContext = signal<LcrAdjustContext | null>(null)
  escalateNoticeVisible = signal(false)
  signOffNoticeVisible = signal(false)
  publishNoticeVisible = signal(false)
  bulkUploadPanelOpen = signal(false)
  bulkUploadNoticeVisible = signal(false)
  /** Sticky footer currency view (UI); wire to grid/API when backend exists */
  selectedCurrency = signal<LcrCurrencyTabId>('ALL')
  readonly currencyTabs: ReadonlyArray<{ id: LcrCurrencyTabId; label: string; flag: string }> = [
    { id: 'ALL', label: 'ALL', flag: '🌐' },
    { id: 'CAD', label: 'CAD', flag: '🇨🇦' },
    { id: 'USD', label: 'USD', flag: '🇺🇸' },
    { id: 'JPY', label: 'JPY', flag: '🇯🇵' },
    { id: 'EUR', label: 'EUR', flag: '🇪🇺' },
    { id: 'GBP', label: 'GBP', flag: '🇬🇧' },
    { id: 'OTH', label: 'OTH', flag: '🌏' },
    { id: 'ADJ', label: 'ADJ', flag: '⚙️' },
  ]
  private escalateNoticeTimer: ReturnType<typeof setTimeout> | null = null
  private signOffNoticeTimer: ReturnType<typeof setTimeout> | null = null
  private publishNoticeTimer: ReturnType<typeof setTimeout> | null = null
  private bulkUploadNoticeTimer: ReturnType<typeof setTimeout> | null = null
  gridContext: Record<string, unknown> = {}
  private gridApi: GridApi | null = null

  /** Fixed footer aligned to `.content-area` (viewport bottom); synced via ResizeObserver */
  currencyBarLeft = signal(typeof window !== 'undefined' ? CONTENT_AREA_LEFT_FALLBACK : 0)
  currencyBarWidth = signal(
    typeof window !== 'undefined'
      ? Math.max(320, window.innerWidth - CONTENT_AREA_LEFT_FALLBACK)
      : 800,
  )
  private currencyBarLayoutObserver: ResizeObserver | null = null

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private viewModeService: ViewModeService,
  ) {
    // When viewMode changes, mutate gridContext in-place and force AG Grid to re-render cells
    effect(() => {
      const ctx = this.buildGridContext()
      Object.assign(this.gridContext, ctx)
      this.gridApi?.refreshCells({ force: true })
    })

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

  ngAfterViewInit(): void {
    const root = document.querySelector('.content-area')
    if (!(root instanceof HTMLElement)) return

    const sync = () => {
      const r = root.getBoundingClientRect()
      this.currencyBarLeft.set(Math.round(r.left))
      this.currencyBarWidth.set(Math.max(0, Math.round(r.width)))
    }
    sync()
    this.currencyBarLayoutObserver = new ResizeObserver(() => sync())
    this.currencyBarLayoutObserver.observe(root)
  }

  ngOnDestroy(): void {
    this.currencyBarLayoutObserver?.disconnect()
    this.currencyBarLayoutObserver = null
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

  selectCurrency(id: LcrCurrencyTabId): void {
    this.selectedCurrency.set(id)
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api
  }

  private buildGridContext(): Record<string, unknown> {
    return {
      isCheckerMode: this.isCheckerMode(),
      signedOffBySegment: this.signedOffBySegment(),
      toggleNode: (id: string) => this.toggleNode(id),
      onCommentClick: (data: unknown) => this.openCommentPanel(data),
      onLcrEditClick: (payload: { row: LcrRowData; segment: LcrSegmentKey; segmentLabel: string }) =>
        this.openLcrAdjustPanel(payload),
      onEscalate: (data: unknown) => this.onCheckerEscalate(data),
      onSignOff: (data: unknown) => this.onCheckerSignOff(data),
      onReject: (data: unknown) => this.onCheckerReject(data),
    }
  }

  onCheckerEscalate(_data: unknown): void {
    this.checkerModificationCount.update(n => n + 1)
    this.showNotice('escalate')
  }

  onCheckerSignOff(data: unknown): void {
    const payload = data as { row?: { nodeId?: string }; segment?: LcrSegmentKey } | null
    const nodeId = payload?.row?.nodeId
    const segment = payload?.segment
    if (nodeId && segment) {
      this.signedOffBySegment.update(prev => ({
        ...prev,
        [nodeId]: {
          ...(prev[nodeId] ?? {}),
          [segment]: true,
        },
      }))
    }
    this.checkerModificationCount.update(n => n + 1)
    this.showNotice('signoff')
  }

  onCheckerReject(_data: unknown): void {
    // No notification for Reject at this stage
  }

  onPublish(): void {
    this.checkerModificationCount.set(0)
    this.showPublishNotice()
  }

  dismissEscalateNotice(): void {
    this.escalateNoticeVisible.set(false)
    if (this.escalateNoticeTimer) { clearTimeout(this.escalateNoticeTimer); this.escalateNoticeTimer = null }
  }

  dismissSignOffNotice(): void {
    this.signOffNoticeVisible.set(false)
    if (this.signOffNoticeTimer) { clearTimeout(this.signOffNoticeTimer); this.signOffNoticeTimer = null }
  }

  dismissPublishNotice(): void {
    this.publishNoticeVisible.set(false)
    if (this.publishNoticeTimer) { clearTimeout(this.publishNoticeTimer); this.publishNoticeTimer = null }
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

  private showNotice(type: 'escalate' | 'signoff'): void {
    if (type === 'escalate') {
      this.escalateNoticeVisible.set(true)
      if (this.escalateNoticeTimer) clearTimeout(this.escalateNoticeTimer)
      this.escalateNoticeTimer = setTimeout(() => {
        this.escalateNoticeVisible.set(false)
        this.escalateNoticeTimer = null
      }, 4500)
    } else {
      this.signOffNoticeVisible.set(true)
      if (this.signOffNoticeTimer) clearTimeout(this.signOffNoticeTimer)
      this.signOffNoticeTimer = setTimeout(() => {
        this.signOffNoticeVisible.set(false)
        this.signOffNoticeTimer = null
      }, 4500)
    }
  }

  private showPublishNotice(): void {
    this.publishNoticeVisible.set(true)
    if (this.publishNoticeTimer) clearTimeout(this.publishNoticeTimer)
    this.publishNoticeTimer = setTimeout(() => {
      this.publishNoticeVisible.set(false)
      this.publishNoticeTimer = null
    }, 4500)

    queueMicrotask(() => this.fireToastConfetti())
  }

  /** Full-viewport confetti for success toasts (FR2052A-aligned). */
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

  openCommentPanel(data: unknown): void {
    this.selectedRowForComment.set(data)
    this.commentPanelOpen.set(true)
  }

  closeCommentPanel(): void {
    this.commentPanelOpen.set(false)
  }

  openLcrAdjustPanel(payload: { row: LcrRowData; segment: LcrSegmentKey; segmentLabel: string }): void {
    const currentValue = (payload.row[payload.segment] as { current: number }).current
    this.lcrAdjustContext.set({ ...payload, currentValue })
    this.lcrAdjustPanelOpen.set(true)
  }

  closeLcrAdjustPanel(): void {
    this.lcrAdjustPanelOpen.set(false)
  }

  onLcrAdjustSaved(event: LcrAdjustSaveEvent): void {
    const overrides = { ...this.lcrOverrides() }
    overrides[event.nodeId] = {
      ...overrides[event.nodeId],
      [event.segment]: { original: event.originalValue, adjusted: event.newValue },
    }
    this.lcrOverrides.set(overrides)
    this.checkerModificationCount.update(n => n + 1)
    this.closeLcrAdjustPanel()
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
    const isSegmentSignedOff = (row: LcrRowData | undefined, segment: LcrSegmentKey): boolean =>
      !!this.signedOffBySegment()?.[row?.nodeId ?? '']?.[segment]

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
          minWidth: 110,
          cellRenderer: LcrCurrentCellRendererComponent,
          cellStyle: (params: CellClassParams) => {
            const base = this.cellStyleForRow(params)
            const d = params.data as LcrRowData
            const hasAdj = !!d?.adjustedFrom?.[seg.key as LcrSegmentKey]
            const isSignedOff = isSegmentSignedOff(d, seg.key as LcrSegmentKey)
            return (hasAdj || isSignedOff)
              ? { ...base, padding: '0', display: 'flex', alignItems: 'stretch' }
              : { ...numberStyle, ...base }
          },
        },
        {
          field: `${seg.key}.previous`,
          headerName: '31-Aug',
          flex: 1,
          minWidth: 100,
          valueFormatter: numFmt,
          cellStyle: (params: CellClassParams) => {
            const d = params.data as LcrRowData
            const style: Record<string, string | number> = { ...numberStyle, ...this.cellStyleForRow(params) }
            if (isSegmentSignedOff(d, seg.key as LcrSegmentKey)) style['backgroundColor'] = '#f5fbf2'
            return style
          },
        },
        {
          field: `${seg.key}.variance`,
          headerName: 'Variance',
          flex: 1,
          minWidth: 100,
          cellRenderer: LcrVarianceCellRendererComponent,
          cellStyle: (params: CellClassParams) => {
            const d = params.data as LcrRowData
            const style: Record<string, string | number> = { textAlign: 'right', ...this.cellStyleForRow(params) }
            if (isSegmentSignedOff(d, seg.key as LcrSegmentKey)) style['backgroundColor'] = '#f5fbf2'
            return style
          },
        },
        {
          headerName: '',
          flex: 0.5,
          minWidth: 70,
          maxWidth: 90,
          cellRenderer: LcrActionCellRendererComponent,
          cellRendererParams: { segment: seg.key },
          cellStyle: (params: CellClassParams) => {
            const style: Record<string, string | number> = {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              overflow: 'visible',
              ...this.cellStyleForRow(params),
            }
            if (isSegmentSignedOff(params.data as LcrRowData, seg.key as LcrSegmentKey)) style['backgroundColor'] = '#f5fbf2'
            return style
          },
        },
      ],
    }))

    return [nameCol, ...groups]
  }
}
