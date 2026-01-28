import { useEffect, useState } from 'react'
import { Card } from 'antd'
import ReactECharts from 'echarts-for-react'
import { AppstoreOutlined, CheckOutlined, HourglassOutlined, FileTextOutlined } from '@ant-design/icons'
import type { EChartsOption } from 'echarts'
import { mockDataService } from '@services/mockDataService'
import AnimatedNumber from '@components/shared/AnimatedNumber'
import './Dashboard.scss'

interface StatCard {
  label: string
  value: number
  trend: { value: string; direction: 'up' | 'down' }
  theme: 'approved' | 'pending' | 'draft'
  cornerIcon: React.ReactNode
}

function Dashboard() {
  const [lastUpdateDate, setLastUpdateDate] = useState('')
  const [selectedLegend, setSelectedLegend] = useState<string | null>(null)
  const [thresholdChartRef, setThresholdChartRef] = useState<any>(null)
  const [stats, setStats] = useState<StatCard[]>([
    {
      label: 'Approved',
      value: 251,
      trend: { value: '', direction: 'up' },
      theme: 'approved',
      cornerIcon: <CheckOutlined />,
    },
    {
      label: 'Pending Review',
      value: 8,
      trend: { value: '2', direction: 'down' },
      theme: 'pending',
      cornerIcon: <HourglassOutlined />,
    },
    {
      label: 'Draft',
      value: 18,
      trend: { value: '5', direction: 'up' },
      theme: 'draft',
      cornerIcon: <FileTextOutlined />,
    },
  ])

  const [trendChartOption, setTrendChartOption] = useState<EChartsOption>({})
  const [varianceChartOption, setVarianceChartOption] = useState<EChartsOption>({})
  const [thresholdChartOption, setThresholdChartOption] = useState<EChartsOption>({})
  const [selectedThreshold, setSelectedThreshold] = useState<string | null>(null)
  const [hoveredThreshold, setHoveredThreshold] = useState<string | null>(null)

  useEffect(() => {
    updateLastUpdateDate()
    initTrendChart()
    initVarianceChart()
    initThresholdChart()
    loadDashboardStats()
    
    // Ensure page scrolls to top when Dashboard loads
    // This prevents the title from being hidden behind the sticky header
    const mainContentWrapper = document.querySelector('.main-content-wrapper')
    if (mainContentWrapper) {
      mainContentWrapper.scrollTop = 0
    }
  }, [])

  useEffect(() => {
    updateThresholdChart(selectedThreshold, hoveredThreshold)
  }, [selectedThreshold, hoveredThreshold])

  const updateLastUpdateDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    setLastUpdateDate(`${year}-${month}-${day}`)
  }

  const loadDashboardStats = async () => {
    try {
      const data = await mockDataService.getDashboardStats()
      setStats([
        {
          label: 'Approved',
          value: data.approved || 251,
          trend: { value: '', direction: 'up' },
          theme: 'approved',
          cornerIcon: <CheckOutlined />,
        },
        {
          label: 'Pending Review',
          value: data.pending || 8,
          trend: { value: '2', direction: 'down' },
          theme: 'pending',
          cornerIcon: <HourglassOutlined />,
        },
        {
          label: 'Draft',
          value: data.draft || 18,
          trend: { value: '5', direction: 'up' },
          theme: 'draft',
          cornerIcon: <FileTextOutlined />,
        },
      ])
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    }
  }

  const initTrendChart = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const lcrData = [95, 108, 102, 115, 110, 125, 118, 132, 128, 120, 135, 142]
    const nsfrData = [100, 105, 112, 108, 118, 115, 125, 120, 135, 130, 128, 145]

    setTrendChartOption({
      title: {
        show: false,
      },
      textStyle: {
        fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        color: '#3A473A',
        fontWeight: 300,
      },
      tooltip: {
        show: false, // Disable tooltip
      },
      legend: {
        data: ['LCR Ratio', 'NSFR Ratio'],
        bottom: 10,
        textStyle: {
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLabel: {
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        axisLine: {
          lineStyle: { color: '#9E9E9E', width: 1 },
        },
      },
      yAxis: {
        type: 'value',
        name: 'Ratio (%)',
        nameTextStyle: {
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        axisLabel: {
          formatter: '{value}%',
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        axisLine: {
          lineStyle: { color: '#9E9E9E', width: 1 },
        },
        splitLine: {
          lineStyle: { type: 'dashed', color: '#9E9E9E', width: 1, opacity: 0.3 },
        },
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
          areaStyle: { color: 'rgba(108, 193, 0, 0.1)' },
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
          areaStyle: { color: 'rgba(255, 152, 0, 0.1)' },
        },
      ],
    })
  }

  const initVarianceChart = () => {
    const products = [
      'Deposits',
      'Loans',
      'Securities',
      'Derivatives',
      'Repos',
      'FX',
      'Commodities',
      'Credit Cards',
      'Mortgages',
      'Trade Finance',
    ]
    const variances = [15000, -12000, 8000, -6000, 5500, -4000, 3500, 3000, -2500, 2000]

    setVarianceChartOption({
      title: {
        show: false,
      },
      textStyle: {
        fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        color: '#3A473A',
        fontWeight: 300,
      },
      tooltip: {
        show: false, // Disable tooltip
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: products,
        axisLabel: {
          rotate: 30,
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        axisLine: {
          lineStyle: { color: '#9E9E9E', width: 1 },
        },
      },
      yAxis: {
        type: 'value',
        name: 'Variance ($)',
        nameTextStyle: {
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        axisLabel: {
          formatter: '${value}',
          color: '#3A473A',
          fontWeight: 400,
          fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        axisLine: {
          lineStyle: { color: '#9E9E9E', width: 1 },
        },
        splitLine: {
          lineStyle: { type: 'dashed', color: '#9E9E9E', width: 1, opacity: 0.3 },
        },
      },
      series: [
        {
          type: 'bar',
          data: variances.map((val) => ({
            value: val,
            itemStyle: { color: val >= 0 ? '#6CC100' : '#FF6767' },
          })),
          barWidth: '60%',
        },
      ],
    })
  }

  const initThresholdChart = () => {
    updateThresholdChart(null)
  }

  const updateThresholdChart = (selected: string | null, hovered: string | null = null) => {
    // Adjust radius based on selection or hover - make selected/hovered portion much thicker
    const baseRadius = ['65%', '70%'] // Thinnest ring
    const thickRadius = ['40%', '70%'] // Very thick ring (smaller inner radius = much thicker ring, 30% width)
    
    // Use hovered if no selection, otherwise use selected
    const activeItem = selected || hovered
    
    // Define shadow colors for each item (same color family)
    const shadowColors = {
      Normal: 'rgba(108, 193, 0, 0.6)', // Green shadow
      Warning: 'rgba(255, 193, 7, 0.6)', // Yellow shadow
      Critical: 'rgba(255, 103, 103, 0.6)', // Red shadow
    }
    
    const data = [
      { 
        value: 120, 
        name: 'Normal', 
        itemStyle: { 
          color: '#6CC100',
          // Add shadow with same color family when active
          ...(activeItem === 'Normal' ? {
            shadowBlur: 20,
            shadowOffsetX: 18,
            shadowOffsetY: 18,
            shadowColor: shadowColors.Normal,
          } : {})
        },
        // Make selected/hovered portion thicker by adjusting its radius
        ...(activeItem === 'Normal' ? { radius: thickRadius } : {})
      },
      { 
        value: 35, 
        name: 'Warning', 
        itemStyle: { 
          color: '#FFC107',
          ...(activeItem === 'Warning' ? {
            shadowBlur: 20,
            shadowOffsetX: 18,
            shadowOffsetY: 18,
            shadowColor: shadowColors.Warning,
          } : {})
        },
        ...(activeItem === 'Warning' ? { radius: thickRadius } : {})
      },
      { 
        value: 12, 
        name: 'Critical', 
        itemStyle: { 
          color: '#FF6767',
          ...(activeItem === 'Critical' ? {
            shadowBlur: 20,
            shadowOffsetX: 18,
            shadowOffsetY: 18,
            shadowColor: shadowColors.Critical,
          } : {})
        },
        ...(activeItem === 'Critical' ? { radius: thickRadius } : {})
      },
    ]

    setThresholdChartOption({
      title: {
        show: false,
      },
      animation: true,
      animationDuration: 500, // Animation duration in milliseconds
      animationEasing: 'cubicOut', // Smooth easing function
      textStyle: {
        fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        color: '#3A473A',
        fontWeight: 300,
      },
      tooltip: {
        show: false, // Disable tooltip
      },
      legend: {
        show: false, // Hide legend (the scale with vertical line and text)
      },
      series: [
        {
          type: 'pie',
          radius: baseRadius, // Base radius for non-selected portions
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 0.3,
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            color: '#3A473A',
            fontWeight: 400,
            fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          },
          emphasis: {
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 0.3,
            },
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          select: {
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 0.3,
            },
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
            },
          },
          selectedMode: 'single', // Only one portion can be selected at a time
          data: data,
        },
      ],
    })
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-title">
          <AppstoreOutlined />
          <span>Dashboard</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="grid-main">
          <div className="status-row">
            {stats.map((stat, index) => (
              <Card key={index} className={`status-card ${stat.theme}`}>
                <div className="status-top">
                  <div className="status-label">{stat.label}</div>
                  <span className="status-corner">{stat.cornerIcon}</span>
                </div>
                <div className="status-update">Last update: {lastUpdateDate}</div>
                <div className="status-value-row">
                  <div className="status-value">
                    <AnimatedNumber value={stat.value} duration={1500} />
                  </div>
                  <div className={`status-trend ${stat.trend.direction === 'up' ? 'positive' : ''}`}>
                    {stat.trend.direction === 'up' ? '↑' : '↓'}
                    {stat.trend.value && <span>{stat.trend.value}</span>}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="chart-stack">
            <Card className="chart-card variance-card">
              <div className="card-title">Variance Top 10</div>
              <div className="card-update">Last update: {lastUpdateDate}</div>
              <ReactECharts option={varianceChartOption} className="chart" />
            </Card>

            <Card className="chart-card threshold-card">
              <div className="card-title">Threshold Exceedance</div>
              <div className="card-update">Last update: {lastUpdateDate}</div>
              <ReactECharts
                option={thresholdChartOption}
                className="chart"
                ref={(e) => setThresholdChartRef(e)}
                onEvents={{
                  mouseover: (params: any) => {
                    if (params.seriesType === 'pie' && params.name) {
                      setHoveredThreshold(params.name)
                    }
                  },
                  mouseout: () => {
                    setHoveredThreshold(null)
                  },
                }}
              />
              <div className="threshold-legend">
                <div
                  className={`legend-item normal ${selectedLegend === 'Normal' ? 'active' : ''}`}
                  onClick={() => {
                    const newSelected = selectedLegend === 'Normal' ? null : 'Normal'
                    setSelectedLegend(newSelected)
                    setSelectedThreshold(newSelected)
                    if (thresholdChartRef) {
                      const chartInstance = thresholdChartRef.getEchartsInstance()
                      if (newSelected) {
                        // Select Normal and downplay others
                        chartInstance.dispatchAction({
                          type: 'select',
                          name: 'Normal',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Warning',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Critical',
                        })
                      } else {
                        // Deselect all
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Normal',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Warning',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Critical',
                        })
                      }
                    }
                  }}
                >
                  <span className="dot"></span>
                  <span>Normal</span>
                </div>
                <div
                  className={`legend-item warning ${selectedLegend === 'Warning' ? 'active' : ''}`}
                  onClick={() => {
                    const newSelected = selectedLegend === 'Warning' ? null : 'Warning'
                    setSelectedLegend(newSelected)
                    setSelectedThreshold(newSelected)
                    if (thresholdChartRef) {
                      const chartInstance = thresholdChartRef.getEchartsInstance()
                      if (newSelected) {
                        // Select Warning and downplay others
                        chartInstance.dispatchAction({
                          type: 'select',
                          name: 'Warning',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Normal',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Critical',
                        })
                      } else {
                        // Deselect all
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Normal',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Warning',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Critical',
                        })
                      }
                    }
                  }}
                >
                  <span className="dot"></span>
                  <span>Warning</span>
                </div>
                <div
                  className={`legend-item critical ${selectedLegend === 'Critical' ? 'active' : ''}`}
                  onClick={() => {
                    const newSelected = selectedLegend === 'Critical' ? null : 'Critical'
                    setSelectedLegend(newSelected)
                    setSelectedThreshold(newSelected)
                    if (thresholdChartRef) {
                      const chartInstance = thresholdChartRef.getEchartsInstance()
                      if (newSelected) {
                        // Select Critical and downplay others
                        chartInstance.dispatchAction({
                          type: 'select',
                          name: 'Critical',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Normal',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Warning',
                        })
                      } else {
                        // Deselect all
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Normal',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Warning',
                        })
                        chartInstance.dispatchAction({
                          type: 'downplay',
                          name: 'Critical',
                        })
                      }
                    }
                  }}
                >
                  <span className="dot"></span>
                  <span>Critical</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="chart-card trend-card">
            <div className="card-title">LCR/NSFR Trend (Last 12 Months)</div>
            <div className="card-update">Last update: {lastUpdateDate}</div>
            <ReactECharts option={trendChartOption} className="chart" />
          </Card>
        </div>

        <div className="sidebar-column">
          <Card className="activities-card">
            <div className="card-title">Recent Activity</div>
            <div className="activity-date">Today</div>
            <div className="activity-item">
              <div className="activity-avatar">YL</div>
              <div className="activity-details">
                <div className="activity-title">
                  <span className="activity-name">Lin</span> signed off Reciprocal
                </div>
                <div className="activity-meta">9:50 am • View</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-avatar purple">YL</div>
              <div className="activity-details">
                <div className="activity-title">
                  <span className="activity-name">Lin</span> Submitted LCR Analysis
                </div>
                <div className="activity-meta">9:42 am • View</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-avatar orange">YL</div>
              <div className="activity-details">
                <div className="activity-title">
                  <span className="activity-name">Lin</span> Escalated NSFR Report
                </div>
                <div className="activity-meta">9:13 am • View</div>
              </div>
            </div>

            <div className="activity-date">Yesterday</div>
            <div className="activity-item">
              <div className="activity-avatar green">YL</div>
              <div className="activity-details">
                <div className="activity-title">
                  <span className="activity-name">Lin</span> Approved Cashable
                </div>
                <div className="activity-meta">1:22 pm • View</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-avatar green">YL</div>
              <div className="activity-details">
                <div className="activity-title">
                  <span className="activity-name">Lin</span> Submitted LCR Analysis
                </div>
                <div className="activity-meta">11:25 am • View</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-avatar purple">YL</div>
              <div className="activity-details">
                <div className="activity-title">
                  <span className="activity-name">Lin</span> Escalated NSFR Report
                </div>
                <div className="activity-meta">10:54 am • View</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-avatar muted">YL</div>
              <div className="activity-details">
                <div className="activity-title">
                  <span className="activity-name">Lin</span> Published Deposits Review
                </div>
                <div className="activity-meta">9:21 am • View</div>
              </div>
            </div>
          </Card>

          <Card className="notifications-card">
            <div className="card-title">Notifications</div>
            <div className="notification-item">
              <div className="notification-icon warning">
                <span>!</span>
              </div>
              <div className="notification-details">
                <div className="notification-title">Threshold Alert</div>
                <div className="notification-meta">LCR ratio below minimum threshold</div>
                <div className="notification-time">2 hours ago</div>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon info">
                <span>i</span>
              </div>
              <div className="notification-details">
                <div className="notification-title">System Update</div>
                <div className="notification-meta">New regulatory requirements added</div>
                <div className="notification-time">5 hours ago</div>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon success">
                <span>✓</span>
              </div>
              <div className="notification-details">
                <div className="notification-title">Report Generated</div>
                <div className="notification-meta">Monthly NSFR report is ready</div>
                <div className="notification-time">1 day ago</div>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon warning">
                <span>!</span>
              </div>
              <div className="notification-details">
                <div className="notification-title">Data Sync Required</div>
                <div className="notification-meta">Some data sources need synchronization</div>
                <div className="notification-time">2 days ago</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
