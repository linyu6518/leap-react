import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NgxEchartsDirective } from 'ngx-echarts'
import { AnimatedNumberComponent } from '../../shared/animated-number/animated-number.component'
import type { EChartsOption } from 'echarts'
import type { ECharts } from 'echarts'

interface StatCard {
  label: string
  value: number
  trend: { value: string; direction: 'up' | 'down' }
  theme: 'approved' | 'pending' | 'draft'
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NzCardModule, NzIconModule, NgxEchartsDirective, AnimatedNumberComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  lastUpdateDate = ''
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

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateLastUpdateDate()
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
        { name: 'LCR Ratio', type: 'line', data: lcrData, smooth: false, lineStyle: { color: '#9E9E9E', width: 1 }, itemStyle: { color: '#6CC100', borderWidth: 0 }, symbol: 'circle', symbolSize: 3, areaStyle: { color: 'rgba(108, 193, 0, 0.1)' } },
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
          data: variances.map((val) => ({ value: val, itemStyle: { color: val >= 0 ? '#6CC100' : '#FF6767' } })),
          barWidth: '60%',
        },
      ],
    }
  }

  private updateThresholdChart(selected: string | null, hovered: string | null = null): void {
    const baseRadius: [string, string] = ['65%', '70%']
    const thickRadius: [string, string] = ['40%', '70%']
    const active = selected || hovered
    const shadowColors = { Normal: 'rgba(108, 193, 0, 0.6)', Warning: 'rgba(255, 193, 7, 0.6)', Critical: 'rgba(255, 103, 103, 0.6)' }
    const data = [
      { value: 120, name: 'Normal', itemStyle: { color: '#6CC100', ...(active === 'Normal' ? { shadowBlur: 20, shadowOffsetX: 18, shadowOffsetY: 18, shadowColor: shadowColors.Normal } : {}) }, ...(active === 'Normal' ? { radius: thickRadius } : {}) },
      { value: 35, name: 'Warning', itemStyle: { color: '#FFC107', ...(active === 'Warning' ? { shadowBlur: 20, shadowOffsetX: 18, shadowOffsetY: 18, shadowColor: shadowColors.Warning } : {}) }, ...(active === 'Warning' ? { radius: thickRadius } : {}) },
      { value: 12, name: 'Critical', itemStyle: { color: '#FF6767', ...(active === 'Critical' ? { shadowBlur: 20, shadowOffsetX: 18, shadowOffsetY: 18, shadowColor: shadowColors.Critical } : {}) }, ...(active === 'Critical' ? { radius: thickRadius } : {}) },
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
