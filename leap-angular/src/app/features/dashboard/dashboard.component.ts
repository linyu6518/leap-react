import { Component, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // 统计卡片数据
  stats = [
    { label: 'Approved', value: 251, trend: { value: '', direction: 'up' }, theme: 'approved', cornerIcon: 'check_circle' },
    { label: 'Pending Review', value: 8, trend: { value: '2', direction: 'down' }, theme: 'pending', cornerIcon: 'schedule' },
    { label: 'Draft', value: 18, trend: { value: '5', direction: 'up' }, theme: 'draft', cornerIcon: 'edit_note' }
  ];

  // LCR/NSFR趋势图配置
  trendChartOption: EChartsOption = {};

  // Variance Top 10柱状图配置
  varianceChartOption: EChartsOption = {};

  // 阈值超标环形图配置
  thresholdChartOption: EChartsOption = {};

  // 最后更新时间
  lastUpdateDate: string = '';

  ngOnInit(): void {
    this.updateLastUpdateDate();
    this.initTrendChart();
    this.initVarianceChart();
    this.initThresholdChart();
  }

  private updateLastUpdateDate(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.lastUpdateDate = `${year}-${month}-${day}`;
  }

  private initTrendChart(): void {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const lcrData = [95, 108, 102, 115, 110, 125, 118, 132, 128, 120, 135, 142];
    const nsfrData = [100, 105, 112, 108, 118, 115, 125, 120, 135, 130, 128, 145];

    this.trendChartOption = {
      title: {
        show: false
      },
      textStyle: {
        fontFamily: 'Graphik, sans-serif',
        color: '#3A473A',
        fontWeight: 300
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['LCR Ratio', 'NSFR Ratio'],
        bottom: 10,
        textStyle: {
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: 'Graphik, sans-serif'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLabel: {
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: 'Graphik, sans-serif'
        },
        axisLine: {
          lineStyle: { color: '#9E9E9E', width: 1 }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Ratio (%)',
        nameTextStyle: {
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: 'Graphik, sans-serif'
        },
        axisLabel: {
          formatter: '{value}%',
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: 'Graphik, sans-serif'
        },
        axisLine: {
          lineStyle: { color: '#9E9E9E', width: 1 }
        },
        splitLine: {
          lineStyle: { type: 'dashed', color: '#9E9E9E', width: 1, opacity: 0.3 }
        }
      },
      series: [
        {
          name: 'LCR Ratio',
          type: 'line',
          data: lcrData,
          smooth: false,
          lineStyle: { color: '#9E9E9E', width: 1 },
          itemStyle: { color: '#6CC100', borderWidth: 0 },
          symbol: 'circle',
          symbolSize: 3,
          areaStyle: { color: 'rgba(108, 193, 0, 0.1)' }
        },
        {
          name: 'NSFR Ratio',
          type: 'line',
          data: nsfrData,
          smooth: false,
          lineStyle: { color: '#9E9E9E', width: 1 },
          itemStyle: { color: '#FF9800', borderWidth: 0 },
          symbol: 'circle',
          symbolSize: 3,
          areaStyle: { color: 'rgba(255, 152, 0, 0.1)' }
        }
      ]
    };
  }

  private initVarianceChart(): void {
    const products = ['Deposits', 'Loans', 'Securities', 'Derivatives', 'Repos', 'FX', 'Commodities', 'Credit Cards', 'Mortgages', 'Trade Finance'];
    const variances = [15000, -12000, 8000, -6000, 5500, -4000, 3500, 3000, -2500, 2000];

    this.varianceChartOption = {
      title: {
        show: false
      },
      textStyle: {
        fontFamily: 'Graphik, sans-serif',
        color: '#3A473A',
        fontWeight: 300
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const value = params[0].value;
          const color = value >= 0 ? '#6CC100' : '#FF6767';
          return `${params[0].name}<br/><span style="color:${color}">$${Math.abs(value).toLocaleString()}</span>`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: products,
        axisLabel: {
          rotate: 30,
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: 'Graphik, sans-serif'
        },
        axisLine: {
          lineStyle: { color: '#9E9E9E', width: 1 }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Variance ($)',
        nameTextStyle: {
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: 'Graphik, sans-serif'
        },
        axisLabel: {
          formatter: '${value}',
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: 'Graphik, sans-serif'
        },
        axisLine: {
          lineStyle: { color: '#9E9E9E', width: 1 }
        },
        splitLine: {
          lineStyle: { type: 'dashed', color: '#9E9E9E', width: 1, opacity: 0.3 }
        }
      },
      series: [
        {
          type: 'bar',
          data: variances.map(val => ({
            value: val,
            itemStyle: { color: val >= 0 ? '#6CC100' : '#FF6767' }
          })),
          barWidth: '60%'
        }
      ]
    };
  }

  private initThresholdChart(): void {
    this.thresholdChartOption = {
      title: {
        show: false
      },
      textStyle: {
        fontFamily: 'Graphik, sans-serif',
        color: '#3A473A',
        fontWeight: 300
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: 'Graphik, sans-serif'
        }
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 0.3
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            color: '#3A473A',
            fontWeight: 400,
            fontFamily: 'Graphik, sans-serif'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          data: [
            { value: 120, name: 'Normal', itemStyle: { color: '#6CC100' } },
            { value: 35, name: 'Warning', itemStyle: { color: '#FFC107' } },
            { value: 12, name: 'Critical', itemStyle: { color: '#FF6767' } }
          ]
        }
      ]
    };
  }
}
