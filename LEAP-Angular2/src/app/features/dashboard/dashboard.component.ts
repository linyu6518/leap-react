import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker'
import { NgxEchartsDirective } from 'ngx-echarts'
import { AnimatedNumberComponent } from '../../shared/animated-number/animated-number.component'
import type { EChartsOption } from 'echarts'
import type { ECharts } from 'echarts'

export interface LampOsfiRow {
  parameter: string
  amount: string
  dod: string
}

export interface LampFeedStatRow {
  source: string
  countReporting: string
  notionalReporting: string
  countCompare: string
  notionalCompare: string
  dod: string
}

export interface LampExceptionRow {
  group: string
  dod: string
  rowCountR: string
  notionalR: string
  rowCountC: string
  notionalC: string
}

interface StatCard {
  label: string
  value: number
  trend: { value: string; direction: 'up' | 'down' }
  theme: 'approved' | 'pending' | 'draft'
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    NzCardModule,
    NzIconModule,
    NzDatePickerModule,
    NgxEchartsDirective,
    AnimatedNumberComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  lastUpdateDate = ''
  /** LAMP-style monitoring (demo dates — not wired to live feeds) */
  lampReportDate: Date | null = new Date()
  lampCompareDate: Date | null = new Date(Date.now() - 3 * 86400000)
  lampHqlaChartOption: EChartsOption = {}
  lampOsfiRows: LampOsfiRow[] = [
    { parameter: 'LCR Ratio', amount: '128.20%', dod: '−0.18%' },
    { parameter: 'HQLA Level 1', amount: 'CA$ 324,881 M', dod: '−0.42%' },
    { parameter: 'HQLA Level 2A', amount: 'CA$ 5,621 M', dod: '+0.11%' },
    { parameter: 'HQLA Level 2B (RMBS)', amount: 'CA$ 0 M', dod: '0.00%' },
    { parameter: 'HQLA Level 2B (Non‑RMBS)', amount: 'CA$ 43,512 M', dod: '+1.05%' },
  ]
  lampFeedStats: LampFeedStatRow[] = [
    { source: 'MUREX_GPM', countReporting: '12,402', notionalReporting: '1,204.3B', countCompare: '12,318', notionalCompare: '1,198.1B', dod: '+0.68%' },
    { source: 'MUREX_GLBFX', countReporting: '3,891', notionalReporting: '442.7B', countCompare: '3,905', notionalCompare: '439.2B', dod: '−0.35%' },
    { source: 'SOPHIS', countReporting: '2,104', notionalReporting: '88.4B', countCompare: '2,098', notionalCompare: '88.1B', dod: '+0.29%' },
    { source: 'PEOPLESOFT', countReporting: '8,551', notionalReporting: '210.2B', countCompare: '8,540', notionalCompare: '209.8B', dod: '+0.12%' },
    { source: 'CALYPSO_CPG', countReporting: '1,992', notionalReporting: '156.0B', countCompare: '1,988', notionalCompare: '155.4B', dod: '+0.41%' },
  ]
  lampRejectExceptions: LampExceptionRow[] = [
    { group: 'SECURITY', dod: '−12', rowCountR: '842', notionalR: '42.1B', rowCountC: '854', notionalC: '41.9B' },
    { group: 'DERIVATIVE', dod: '+3', rowCountR: '1,204', notionalR: '520.0B', rowCountC: '1,201', notionalC: '518.2B' },
    { group: 'LENDING', dod: '0', rowCountR: '3,110', notionalR: '98.4B', rowCountC: '3,110', notionalC: '98.4B' },
  ]
  lampDiscardExceptions: LampExceptionRow[] = [
    { group: 'UNDEFINED', dod: '−2', rowCountR: '18', notionalR: '0.4B', rowCountC: '20', notionalC: '0.4B' },
    { group: 'DEPOSIT', dod: '+1', rowCountR: '556', notionalR: '12.2B', rowCountC: '555', notionalC: '12.1B' },
    { group: 'FUNDING', dod: '0', rowCountR: '221', notionalR: '55.0B', rowCountC: '221', notionalC: '55.0B' },
  ]

  selectedLegend: string | null = null
  selectedThreshold: string | null = null
  hoveredThreshold: string | null = null
  thresholdChartInstance: ECharts | null = null

  stats: StatCard[] = [
    { label: 'Approved', value: 251, trend: { value: '', direction: 'up' }, theme: 'approved' },
    { label: 'Pending Review', value: 8, trend: { value: '2', direction: 'down' }, theme: 'pending' },
    { label: 'Draft', value: 18, trend: { value: '5', direction: 'up' }, theme: 'draft' },
  ]

  trendChartOption: EChartsOption = {}
  varianceChartOption: EChartsOption = {}
  thresholdChartOption: EChartsOption = {}

  private readonly graphik = "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

  /** Positive / up — matches Variance Top 10 bar green. */
  private readonly variancePosColor = '#76C700'
  /** Negative / down — matches Variance Top 10 bar red. */
  private readonly varianceNegColor = '#FF7070'

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateLastUpdateDate()
    this.initLampHqlaChart()
    this.initTrendChart()
    this.initVarianceChart()
    this.updateThresholdChart(null)
    const main = document.querySelector('.main-content-wrapper')
    if (main) (main as HTMLElement).scrollTop = 0
  }

  ngOnDestroy(): void {
    this.thresholdChartInstance = null
  }

  updateLastUpdateDate(): void {
    const now = new Date()
    this.lastUpdateDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  onThresholdChartInit(chart: ECharts): void {
    this.thresholdChartInstance = chart
  }

  onThresholdChartMouseOver(event: { name?: string }): void {
    this.hoveredThreshold = event?.name ?? null
    this.updateThresholdChart(this.selectedThreshold, this.hoveredThreshold)
    this.cdr.markForCheck()
  }

  onThresholdChartGlobalOut(): void {
    this.hoveredThreshold = null
    this.updateThresholdChart(this.selectedThreshold, null)
    this.cdr.markForCheck()
  }

  toggleLegend(name: string): void {
    const next = this.selectedLegend === name ? null : name
    this.selectedLegend = next
    this.selectedThreshold = next
    this.updateThresholdChart(next)
    if (this.thresholdChartInstance) {
      ;['Normal', 'Warning', 'Critical'].forEach((n) => {
        this.thresholdChartInstance!.dispatchAction({ type: next === n ? 'select' : 'downplay', name: n })
      })
    }
    this.cdr.markForCheck()
  }

  formatLampDate(d: Date | null): string {
    if (!d) return '—'
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  /**
   * Classify DoD (day-over-day) display strings: leading + / − (Unicode minus U+2212 or ASCII -) / neither.
   */
  dodTone(dod: string | null | undefined): 'neg' | 'pos' | 'neutral' {
    const s = (dod ?? '').trim()
    if (!s) return 'neutral'
    const c0 = s[0]
    if (c0 === '\u2212' || c0 === '-') return 'neg'
    if (c0 === '+') return 'pos'
    return 'neutral'
  }

  /** HQLA palette: L1 medium green → 2A lighter → 2B RMBS lime → 2B non‑RMBS forest. */
  private readonly lampHqlaColors = {
    level1: '#4E9F52',
    level2a: '#6FC96A',
    level2bRmbs: '#C8E650',
    level2bNonRmbs: '#154A22',
  } as const

  private initLampHqlaChart(): void {
    const baseRadius: [string, string] = ['71%', '76%']
    const c = this.lampHqlaColors
    const data = [
      { value: 86.88, name: 'Level 1', itemStyle: { color: c.level1 } },
      { value: 1.51, name: 'Level 2A', itemStyle: { color: c.level2a } },
      { value: 0.01, name: '2B RMBS', itemStyle: { color: c.level2bRmbs } },
      { value: 11.61, name: '2B Non‑RMBS', itemStyle: { color: c.level2bNonRmbs } },
    ]
    this.lampHqlaChartOption = {
      animation: true,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      textStyle: { fontFamily: this.graphik, color: '#3A473A', fontWeight: 300 },
      tooltip: { show: false },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: baseRadius,
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 0.3 },
          label: { show: true, formatter: '{b}\n{d}%', color: '#3A473A', fontWeight: 400, fontFamily: this.graphik, fontSize: 10 },
          emphasis: {
            itemStyle: { borderColor: '#fff', borderWidth: 0.3 },
            label: { show: true, fontSize: 12, fontWeight: 'bold' },
          },
          data,
        },
      ],
    }
  }

  private initTrendChart(): void {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const lcrData = [95, 108, 102, 115, 110, 125, 118, 132, 128, 120, 135, 142]
    const nsfrData = [100, 105, 112, 108, 118, 115, 125, 120, 135, 130, 128, 145]
    this.trendChartOption = {
      textStyle: { fontFamily: this.graphik, color: '#3A473A', fontWeight: 300 },
      tooltip: { show: false },
      legend: {
        data: ['LCR Ratio', 'NSFR Ratio'],
        bottom: 10,
        textStyle: { color: '#3A473A', fontWeight: 400, fontFamily: this.graphik },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLabel: { color: '#3A473A', fontWeight: 400, fontFamily: this.graphik },
        axisLine: { lineStyle: { color: '#9E9E9E', width: 1 } },
      },
      yAxis: {
        type: 'value',
        name: 'Ratio (%)',
        nameTextStyle: { color: '#3A473A', fontWeight: 400, fontFamily: this.graphik },
        axisLabel: { formatter: '{value}%', color: '#3A473A', fontWeight: 400, fontFamily: this.graphik },
        axisLine: { lineStyle: { color: '#9E9E9E', width: 1 } },
        splitLine: { lineStyle: { type: 'dashed', color: '#9E9E9E', width: 1, opacity: 0.3 } },
      },
      series: [
        { name: 'LCR Ratio', type: 'line', data: lcrData, smooth: false, lineStyle: { color: '#9E9E9E', width: 1 }, itemStyle: { color: this.variancePosColor, borderWidth: 0 }, symbol: 'circle', symbolSize: 3, areaStyle: { color: 'rgba(118, 199, 0, 0.1)' } },
        { name: 'NSFR Ratio', type: 'line', data: nsfrData, smooth: false, lineStyle: { color: '#9E9E9E', width: 1 }, itemStyle: { color: '#FF9800', borderWidth: 0 }, symbol: 'circle', symbolSize: 3, areaStyle: { color: 'rgba(255, 152, 0, 0.1)' } },
      ],
    }
  }

  private initVarianceChart(): void {
    const products = ['Deposits', 'Loans', 'Securities', 'Derivatives', 'Repos', 'FX', 'Commodities', 'Credit Cards', 'Mortgages', 'Trade Finance']
    const variances = [15000, -12000, 8000, -6000, 5500, -4000, 3500, 3000, -2500, 2000]
    this.varianceChartOption = {
      textStyle: { fontFamily: this.graphik, color: '#3A473A', fontWeight: 300 },
      tooltip: { show: false },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: products,
        axisLabel: { rotate: 30, color: '#3A473A', fontWeight: 400, fontFamily: this.graphik },
        axisLine: { lineStyle: { color: '#9E9E9E', width: 1 } },
      },
      yAxis: {
        type: 'value',
        name: 'Variance ($)',
        nameTextStyle: { color: '#3A473A', fontWeight: 400, fontFamily: this.graphik },
        axisLabel: { formatter: '${value}', color: '#3A473A', fontWeight: 400, fontFamily: this.graphik },
        axisLine: { lineStyle: { color: '#9E9E9E', width: 1 } },
        splitLine: { lineStyle: { type: 'dashed', color: '#9E9E9E', width: 1, opacity: 0.3 } },
      },
      series: [
        {
          type: 'bar',
          data: variances.map((val) => ({
            value: val,
            itemStyle: { color: val >= 0 ? this.variancePosColor : this.varianceNegColor },
          })),
          barWidth: '60%',
        },
      ],
    }
  }

  private updateThresholdChart(selected: string | null, hovered: string | null = null): void {
    const baseRadius: [string, string] = ['65%', '70%']
    const thickRadius: [string, string] = ['40%', '70%']
    const active = selected || hovered
    const shadowColors = {
      Normal: 'rgba(118, 199, 0, 0.6)',
      Warning: 'rgba(255, 193, 7, 0.6)',
      Critical: 'rgba(255, 112, 112, 0.6)',
    }
    const data = [
      { value: 120, name: 'Normal', itemStyle: { color: this.variancePosColor, ...(active === 'Normal' ? { shadowBlur: 20, shadowOffsetX: 18, shadowOffsetY: 18, shadowColor: shadowColors.Normal } : {}) }, ...(active === 'Normal' ? { radius: thickRadius } : {}) },
      { value: 35, name: 'Warning', itemStyle: { color: '#FFC107', ...(active === 'Warning' ? { shadowBlur: 20, shadowOffsetX: 18, shadowOffsetY: 18, shadowColor: shadowColors.Warning } : {}) }, ...(active === 'Warning' ? { radius: thickRadius } : {}) },
      { value: 12, name: 'Critical', itemStyle: { color: this.varianceNegColor, ...(active === 'Critical' ? { shadowBlur: 20, shadowOffsetX: 18, shadowOffsetY: 18, shadowColor: shadowColors.Critical } : {}) }, ...(active === 'Critical' ? { radius: thickRadius } : {}) },
    ]
    this.thresholdChartOption = {
      animation: true,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      textStyle: { fontFamily: this.graphik, color: '#3A473A', fontWeight: 300 },
      tooltip: { show: false },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: baseRadius,
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 0.3 },
          label: { show: true, formatter: '{b}\n{d}%', color: '#3A473A', fontWeight: 400, fontFamily: this.graphik },
          emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 0.3 }, label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          select: { itemStyle: { borderColor: '#fff', borderWidth: 0.3 }, label: { show: true, fontSize: 18, fontWeight: 'bold' } },
          selectedMode: 'single',
          data,
        },
      ],
    }
  }
}
