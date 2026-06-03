import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef } from 'ag-grid-community'
import {
  type DrilldownContext,
  type DrilldownRow,
  buildDrilldownRows,
  getDrilldownColumnDefs,
  CURRENCY_OPTIONS,
  LINE_CODE_OPTIONS,
} from './drilldown-data'

const ALL = '__ALL__'

@Component({
  selector: 'app-drilldown-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule, NzDatePickerModule, NzIconModule, AgGridAngular],
  templateUrl: './drilldown-panel.component.html',
  styleUrls: ['./drilldown-panel.component.scss'],
})
export class DrilldownPanelComponent implements OnChanges {
  @Input() visible = false
  @Input() context: DrilldownContext | null = null
  @Output() closed = new EventEmitter<void>()

  readonly ALL = ALL
  readonly currencyOptions = CURRENCY_OPTIONS
  readonly lineCodeOptions = LINE_CODE_OPTIONS
  readonly columnDefs: ColDef[] = getDrilldownColumnDefs()
  readonly defaultColDef: ColDef = { sortable: true, resizable: true, suppressMovable: false }

  private baseRows = signal<DrilldownRow[]>([])

  segmentFilter = ALL
  currencyFilter = ALL
  lineCodeFilter = ALL
  dateFilter: Date | null = null
  dateOpen = false

  private segmentSig = signal<string>(ALL)
  private currencySig = signal<string>(ALL)
  private lineCodeSig = signal<string>(ALL)
  private dateSig = signal<Date | null>(null)

  readonly segmentOptions = computed<string[]>(() => {
    const set = new Set(this.baseRows().map(r => r.v_segment_name))
    return [...set]
  })

  readonly filteredRows = computed<DrilldownRow[]>(() => {
    const seg = this.segmentSig()
    const ccy = this.currencySig()
    const line = this.lineCodeSig()
    const date = this.dateSig()
    const dateIso = date ? date.toISOString().slice(0, 10) : null
    return this.baseRows().filter(r => {
      if (seg !== ALL && r.v_segment_name !== seg) return false
      if (ccy !== ALL && r.v_source_currency !== ccy) return false
      if (line !== ALL && r.v_osfi_lcr_line_code !== line) return false
      if (dateIso && r.d_cashflow_date < dateIso) return false
      return true
    })
  })

  ngOnChanges(changes: SimpleChanges): void {
    if ('context' in changes && this.context) {
      this.baseRows.set(buildDrilldownRows(this.context))
      // Seed filters from the drill-down context
      this.segmentFilter = ALL
      this.currencyFilter = ALL
      this.lineCodeFilter = ALL
      this.dateFilter = this.context.date ? new Date(this.context.date) : null
      this.syncSignals()
    }
  }

  /** Bridge ngModel values into signals so the computed re-runs. */
  syncSignals(): void {
    this.segmentSig.set(this.segmentFilter)
    this.currencySig.set(this.currencyFilter)
    this.lineCodeSig.set(this.lineCodeFilter)
    this.dateSig.set(this.dateFilter)
  }

  resetFilters(): void {
    this.segmentFilter = ALL
    this.currencyFilter = ALL
    this.lineCodeFilter = ALL
    this.dateFilter = null
    this.syncSignals()
  }

  downloadCsv(): void {
    const rows = this.filteredRows()
    const cols = this.columnDefs.filter((c): c is ColDef & { field: string } => !!c.field)
    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const header = cols.map(c => escape(c.headerName ?? c.field)).join(',')
    const body = rows
      .map(r => cols.map(c => escape((r as unknown as Record<string, unknown>)[c.field])).join(','))
      .join('\n')
    const csv = `${header}\n${body}`
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cashflow-detail.csv'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  close(): void {
    this.closed.emit()
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('panel-overlay')) this.close()
  }
}
