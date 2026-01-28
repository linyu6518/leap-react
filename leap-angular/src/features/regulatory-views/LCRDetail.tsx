import { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, Button } from 'antd'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ColGroupDef, CellClassParams, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community'
import { FileTextOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { mockDataService } from '@services/mockDataService'
import QueryPanel, { QueryParams } from '@components/shared/QueryPanel'
import AnimatedNumber from '@components/shared/AnimatedNumber'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-material.css'
import './LCRDetail.scss'

interface LCRRowData {
  nodeId: string
  name: string
  level: number
  isExpanded: boolean
  isLeaf: boolean
  hasAlert?: boolean
  isHighlighted?: boolean // For LCR Ratio, HQLA, Net Cash Outflows, Surplus rows
  isSummary?: boolean // For summary row (LCR Ratio)
  enterprise?: {
    current: number
    previous: number
    variance: number
  }
  cadRetail?: {
    current: number
    previous: number
    variance: number
  }
  wholesale?: {
    current: number
    previous: number
    variance: number
  }
  usRetail?: {
    current: number
    previous: number
    variance: number
  }
  children?: LCRRowData[]
}

function LCRDetail() {
  const location = useLocation()
  const navigate = useNavigate()
  const [lcrData, setLcrData] = useState<any>(null)
  const [lastUpdateDate, setLastUpdateDate] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['hqla', 'nco', 'nco-deposits']))
  const [queryParams, setQueryParams] = useState<Partial<QueryParams>>(() => {
    const state = location.state as any
    return {
      region: state?.enterprise || state?.region || null,
      segment: state?.segment || null,
      prior: state?.prior ? dayjs(state.prior) : null,
      current: state?.current ? dayjs(state.current) : null,
    }
  })

  useEffect(() => {
    updateLastUpdateDate()
    loadData()
  }, [queryParams])

  const updateLastUpdateDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    setLastUpdateDate(`${year}-${month}-${day}`)
  }

  const loadData = async () => {
    try {
      const data = await mockDataService.getLCRData()
      setLcrData(data)
    } catch (error) {
      console.error('Failed to load LCR data:', error)
    }
  }

  const handleQuery = (params: QueryParams) => {
    setQueryParams(params)
  }

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const getLCRRowData = useMemo((): LCRRowData[] => {
    const buildRows = (parentId: string | null = null, level: number = 0): LCRRowData[] => {
      const rows: LCRRowData[] = []
      
      const data: LCRRowData[] = [
        {
          nodeId: 'lcr-ratio',
          name: 'LCR Ratio',
          level: 0,
          isExpanded: false,
          isLeaf: true,
          isHighlighted: true,
          isSummary: true, // Mark as summary row
          enterprise: { current: 128.2, previous: 128.4, variance: -0.2 },
          cadRetail: { current: 128.2, previous: 128.4, variance: -0.2 },
          wholesale: { current: 128.2, previous: 128.4, variance: -0.2 },
          usRetail: { current: 128.2, previous: 128.4, variance: -0.2 },
        },
        {
          nodeId: 'hqla',
          name: 'HQLA',
          level: 0,
          isExpanded: expandedNodes.has('hqla'),
          isLeaf: false,
          isHighlighted: true,
          enterprise: { current: 33671, previous: 33671, variance: 0 },
          cadRetail: { current: 33671, previous: 33671, variance: 0 },
          wholesale: { current: 33671, previous: 33671, variance: 0 },
          usRetail: { current: 33671, previous: 33671, variance: 0 },
          children: [
            { 
              nodeId: 'hqla-cash', 
              name: 'Cash & Cash Equivalents', 
              level: 1, 
              isExpanded: expandedNodes.has('hqla-cash'),
              isLeaf: false,
              enterprise: { current: 10000, previous: 10000, variance: 0 }, 
              cadRetail: { current: 10000, previous: 10000, variance: 0 }, 
              wholesale: { current: 10000, previous: 10000, variance: 0 }, 
              usRetail: { current: 10000, previous: 10000, variance: 0 },
              children: [
                { nodeId: 'hqla-cash-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 5000, previous: 5000, variance: 0 }, cadRetail: { current: 5000, previous: 5000, variance: 0 }, wholesale: { current: 5000, previous: 5000, variance: 0 }, usRetail: { current: 5000, previous: 5000, variance: 0 } },
              ],
            },
            { nodeId: 'hqla-level1-nha', name: 'Level 1 - NHA MBS', level: 1, isExpanded: false, isLeaf: true, enterprise: { current: 5000, previous: 5000, variance: 0 }, cadRetail: { current: 5000, previous: 5000, variance: 0 }, wholesale: { current: 5000, previous: 5000, variance: 0 }, usRetail: { current: 5000, previous: 5000, variance: 0 } },
            { nodeId: 'hqla-level1-other', name: 'Level 1 - Other', level: 1, isExpanded: false, isLeaf: true, enterprise: { current: 3000, previous: 3000, variance: 0 }, cadRetail: { current: 3000, previous: 3000, variance: 0 }, wholesale: { current: 3000, previous: 3000, variance: 0 }, usRetail: { current: 3000, previous: 3000, variance: 0 } },
            { 
              nodeId: 'hqla-level2a', 
              name: 'Level 2a', 
              level: 1, 
              isExpanded: expandedNodes.has('hqla-level2a'),
              isLeaf: false,
              enterprise: { current: 4000, previous: 4000, variance: 0 }, 
              cadRetail: { current: 4000, previous: 4000, variance: 0 }, 
              wholesale: { current: 4000, previous: 4000, variance: 0 }, 
              usRetail: { current: 4000, previous: 4000, variance: 0 },
              children: [
                { nodeId: 'hqla-level2a-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 2000, previous: 2000, variance: 0 }, cadRetail: { current: 2000, previous: 2000, variance: 0 }, wholesale: { current: 2000, previous: 2000, variance: 0 }, usRetail: { current: 2000, previous: 2000, variance: 0 } },
              ],
            },
            { 
              nodeId: 'hqla-level2b', 
              name: 'Level 2b', 
              level: 1, 
              isExpanded: expandedNodes.has('hqla-level2b'),
              isLeaf: false,
              enterprise: { current: 3000, previous: 3000, variance: 0 }, 
              cadRetail: { current: 3000, previous: 3000, variance: 0 }, 
              wholesale: { current: 3000, previous: 3000, variance: 0 }, 
              usRetail: { current: 3000, previous: 3000, variance: 0 },
              children: [
                { nodeId: 'hqla-level2b-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 1500, previous: 1500, variance: 0 }, cadRetail: { current: 1500, previous: 1500, variance: 0 }, wholesale: { current: 1500, previous: 1500, variance: 0 }, usRetail: { current: 1500, previous: 1500, variance: 0 } },
              ],
            },
            { nodeId: 'hqla-internal-funding', name: 'Internal Funding With TDS', level: 1, isExpanded: false, isLeaf: true, enterprise: { current: 6671, previous: 6671, variance: 0 }, cadRetail: { current: 6671, previous: 6671, variance: 0 }, wholesale: { current: 6671, previous: 6671, variance: 0 }, usRetail: { current: 6671, previous: 6671, variance: 0 } },
          ],
        },
        {
          nodeId: 'nco',
          name: 'Net Cash Outflows',
          level: 0,
          isExpanded: expandedNodes.has('nco'),
          isLeaf: false,
          isHighlighted: true,
          enterprise: { current: 12671, previous: 12671, variance: 0 },
          cadRetail: { current: 12671, previous: 12671, variance: 0 },
          wholesale: { current: 12671, previous: 12671, variance: 0 },
          usRetail: { current: 12671, previous: 12671, variance: 0 },
          children: [
            { 
              nodeId: 'nco-deposits', 
              name: 'Deposits', 
              level: 1, 
              isExpanded: expandedNodes.has('nco-deposits'),
              isLeaf: false,
              enterprise: { current: 2000, previous: 2000, variance: 0 }, 
              cadRetail: { current: 2000, previous: 2000, variance: 0 }, 
              wholesale: { current: 2000, previous: 2000, variance: 0 }, 
              usRetail: { current: 2000, previous: 2000, variance: 0 },
              children: [
                { 
                  nodeId: 'nco-deposits-withdrawal', 
                  name: 'Withdrawal', 
                  level: 2, 
                  isExpanded: expandedNodes.has('nco-deposits-withdrawal'),
                  isLeaf: false,
                  enterprise: { current: 1500, previous: 1500, variance: 0 }, 
                  cadRetail: { current: 1500, previous: 1500, variance: 0 }, 
                  wholesale: { current: 1500, previous: 1500, variance: 0 }, 
                  usRetail: { current: 1500, previous: 1500, variance: 0 },
                  children: [
                    { nodeId: 'nco-deposits-withdrawal-child-1', name: 'Child 1', level: 3, isExpanded: false, isLeaf: true, enterprise: { current: 750, previous: 750, variance: 0 }, cadRetail: { current: 750, previous: 750, variance: 0 }, wholesale: { current: 750, previous: 750, variance: 0 }, usRetail: { current: 750, previous: 750, variance: 0 } },
                  ],
                },
                { 
                  nodeId: 'nco-deposits-buyback', 
                  name: 'BuyBack', 
                  level: 2, 
                  isExpanded: expandedNodes.has('nco-deposits-buyback'),
                  isLeaf: false,
                  enterprise: { current: 1200, previous: 1200, variance: 0 }, 
                  cadRetail: { current: 1200, previous: 1200, variance: 0 }, 
                  wholesale: { current: 1200, previous: 1200, variance: 0 }, 
                  usRetail: { current: 1200, previous: 1200, variance: 0 },
                  children: [
                    { nodeId: 'nco-deposits-buyback-child-1', name: 'Child 1', level: 3, isExpanded: false, isLeaf: true, enterprise: { current: 600, previous: 600, variance: 0 }, cadRetail: { current: 600, previous: 600, variance: 0 }, wholesale: { current: 600, previous: 600, variance: 0 }, usRetail: { current: 600, previous: 600, variance: 0 } },
                  ],
                },
                { 
                  nodeId: 'nco-deposits-rollover', 
                  name: 'Rollover', 
                  level: 2, 
                  isExpanded: expandedNodes.has('nco-deposits-rollover'),
                  isLeaf: false,
                  enterprise: { current: 1000, previous: 1000, variance: 0 }, 
                  cadRetail: { current: 1000, previous: 1000, variance: 0 }, 
                  wholesale: { current: 1000, previous: 1000, variance: 0 }, 
                  usRetail: { current: 1000, previous: 1000, variance: 0 },
                  children: [
                    { nodeId: 'nco-deposits-rollover-child-1', name: 'Child 1', level: 3, isExpanded: false, isLeaf: true, enterprise: { current: 500, previous: 500, variance: 0 }, cadRetail: { current: 500, previous: 500, variance: 0 }, wholesale: { current: 500, previous: 500, variance: 0 }, usRetail: { current: 500, previous: 500, variance: 0 } },
                  ],
                },
              ],
            },
            { 
              nodeId: 'nco-commitments', 
              name: 'Commitments', 
              level: 1, 
              isExpanded: expandedNodes.has('nco-commitments'),
              isLeaf: false,
              enterprise: { current: 900, previous: 900, variance: 0 }, 
              cadRetail: { current: 900, previous: 900, variance: 0 }, 
              wholesale: { current: 900, previous: 900, variance: 0 }, 
              usRetail: { current: 900, previous: 900, variance: 0 },
              children: [
                { nodeId: 'nco-commitments-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 450, previous: 450, variance: 0 }, cadRetail: { current: 450, previous: 450, variance: 0 }, wholesale: { current: 450, previous: 450, variance: 0 }, usRetail: { current: 450, previous: 450, variance: 0 } },
              ],
            },
            { 
              nodeId: 'nco-loans', 
              name: 'Loans', 
              level: 1, 
              isExpanded: expandedNodes.has('nco-loans'),
              isLeaf: false,
              enterprise: { current: 800, previous: 800, variance: 0 }, 
              cadRetail: { current: 800, previous: 800, variance: 0 }, 
              wholesale: { current: 800, previous: 800, variance: 0 }, 
              usRetail: { current: 800, previous: 800, variance: 0 },
              children: [
                { nodeId: 'nco-loans-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 400, previous: 400, variance: 0 }, cadRetail: { current: 400, previous: 400, variance: 0 }, wholesale: { current: 400, previous: 400, variance: 0 }, usRetail: { current: 400, previous: 400, variance: 0 } },
              ],
            },
            { 
              nodeId: 'nco-derivatives', 
              name: 'Derivatives', 
              level: 1, 
              isExpanded: expandedNodes.has('nco-derivatives'),
              isLeaf: false,
              enterprise: { current: 700, previous: 700, variance: 0 }, 
              cadRetail: { current: 700, previous: 700, variance: 0 }, 
              wholesale: { current: 700, previous: 700, variance: 0 }, 
              usRetail: { current: 700, previous: 700, variance: 0 },
              children: [
                { nodeId: 'nco-derivatives-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 350, previous: 350, variance: 0 }, cadRetail: { current: 350, previous: 350, variance: 0 }, wholesale: { current: 350, previous: 350, variance: 0 }, usRetail: { current: 350, previous: 350, variance: 0 } },
              ],
            },
            { 
              nodeId: 'nco-unsecured', 
              name: 'Unsecured', 
              level: 1, 
              isExpanded: expandedNodes.has('nco-unsecured'),
              isLeaf: false,
              enterprise: { current: 600, previous: 600, variance: 0 }, 
              cadRetail: { current: 600, previous: 600, variance: 0 }, 
              wholesale: { current: 600, previous: 600, variance: 0 }, 
              usRetail: { current: 600, previous: 600, variance: 0 },
              children: [
                { nodeId: 'nco-unsecured-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 300, previous: 300, variance: 0 }, cadRetail: { current: 300, previous: 300, variance: 0 }, wholesale: { current: 300, previous: 300, variance: 0 }, usRetail: { current: 300, previous: 300, variance: 0 } },
              ],
            },
            { 
              nodeId: 'nco-interaffiliate', 
              name: 'Interaffiliate Funding', 
              level: 1, 
              isExpanded: expandedNodes.has('nco-interaffiliate'),
              isLeaf: false,
              enterprise: { current: 500, previous: 500, variance: 0 }, 
              cadRetail: { current: 500, previous: 500, variance: 0 }, 
              wholesale: { current: 500, previous: 500, variance: 0 }, 
              usRetail: { current: 500, previous: 500, variance: 0 },
              children: [
                { nodeId: 'nco-interaffiliate-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 250, previous: 250, variance: 0 }, cadRetail: { current: 250, previous: 250, variance: 0 }, wholesale: { current: 250, previous: 250, variance: 0 }, usRetail: { current: 250, previous: 250, variance: 0 } },
              ],
            },
            { 
              nodeId: 'nco-secured', 
              name: 'Secured Funding', 
              level: 1, 
              isExpanded: expandedNodes.has('nco-secured'),
              isLeaf: false,
              enterprise: { current: 400, previous: 400, variance: 0 }, 
              cadRetail: { current: 400, previous: 400, variance: 0 }, 
              wholesale: { current: 400, previous: 400, variance: 0 }, 
              usRetail: { current: 400, previous: 400, variance: 0 },
              children: [
                { nodeId: 'nco-secured-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 200, previous: 200, variance: 0 }, cadRetail: { current: 200, previous: 200, variance: 0 }, wholesale: { current: 200, previous: 200, variance: 0 }, usRetail: { current: 200, previous: 200, variance: 0 } },
              ],
            },
            { 
              nodeId: 'nco-other-risks', 
              name: 'Other Risks', 
              level: 1, 
              isExpanded: expandedNodes.has('nco-other-risks'),
              isLeaf: false,
              enterprise: { current: 300, previous: 300, variance: 0 }, 
              cadRetail: { current: 300, previous: 300, variance: 0 }, 
              wholesale: { current: 300, previous: 300, variance: 0 }, 
              usRetail: { current: 300, previous: 300, variance: 0 },
              children: [
                { nodeId: 'nco-other-risks-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 150, previous: 150, variance: 0 }, cadRetail: { current: 150, previous: 150, variance: 0 }, wholesale: { current: 150, previous: 150, variance: 0 }, usRetail: { current: 150, previous: 150, variance: 0 } },
              ],
            },
            { 
              nodeId: 'nco-prime-services', 
              name: 'Prime Services', 
              level: 1, 
              isExpanded: expandedNodes.has('nco-prime-services'),
              isLeaf: false,
              enterprise: { current: 2071, previous: 2071, variance: 0 }, 
              cadRetail: { current: 2071, previous: 2071, variance: 0 }, 
              wholesale: { current: 2071, previous: 2071, variance: 0 }, 
              usRetail: { current: 2071, previous: 2071, variance: 0 },
              children: [
                { nodeId: 'nco-prime-services-child-1', name: 'Child 1', level: 2, isExpanded: false, isLeaf: true, enterprise: { current: 1035, previous: 1035, variance: 0 }, cadRetail: { current: 1035, previous: 1035, variance: 0 }, wholesale: { current: 1035, previous: 1035, variance: 0 }, usRetail: { current: 1035, previous: 1035, variance: 0 } },
              ],
            },
          ],
        },
        {
          nodeId: 'surplus',
          name: 'Surplus',
          level: 0,
          isExpanded: false,
          isLeaf: true,
          isHighlighted: true,
          enterprise: { current: 21000, previous: 21000, variance: 0 },
          cadRetail: { current: 21000, previous: 21000, variance: 0 },
          wholesale: { current: 21000, previous: 21000, variance: 0 },
          usRetail: { current: 21000, previous: 21000, variance: 0 },
        },
      ]

      // Recursive function to add children
      const addChildren = (children: LCRRowData[], parentLevel: number) => {
        for (const child of children) {
          const hasChildren = child.children && child.children.length > 0
          const isExpanded = expandedNodes.has(child.nodeId)
          
          rows.push({
            ...child,
            level: parentLevel + 1,
            isExpanded,
            isLeaf: !hasChildren,
          })
          
          if (hasChildren && isExpanded) {
            addChildren(child.children!, parentLevel + 1)
          }
        }
      }

      data.forEach((item) => {
        if (item.level === level && (parentId === null || item.nodeId === parentId || (parentId && item.nodeId.startsWith(parentId + '-')))) {
          rows.push(item)
          if (item.children && expandedNodes.has(item.nodeId)) {
            addChildren(item.children, level)
          }
        }
      })

      return rows
    }

    return buildRows()
  }, [expandedNodes])

  const lcrColumnDefs: (ColDef | ColGroupDef)[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Enterprise LCR',
        flex: 1,
        minWidth: 250,
        pinned: 'left',
        headerComponent: () => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '8px 0' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>Enterprise LCR</div>
            <div style={{ fontWeight: 400, fontSize: '12px', color: '#1890ff', marginTop: '2px' }}>(Amount in Millions CAD)</div>
          </div>
        ),
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as LCRRowData
          const indent = data.level * 20
          const isExpanded = expandedNodes.has(data.nodeId)
          const fontWeight = data.level === 0 ? 600 : 400
          return (
            <div 
              style={{ 
                paddingLeft: `${indent}px`, 
                display: 'flex', 
                alignItems: 'center',
                width: '100%',
                height: '100%',
                cursor: !data.isLeaf ? 'pointer' : 'default'
              }}
              onClick={(e) => {
                if (!data.isLeaf) {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleNodeExpansion(data.nodeId)
                }
              }}
            >
              {!data.isLeaf && (
                <span
                  style={{ 
                    marginRight: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    width: '11px',
                    height: '11px',
                    backgroundColor: isExpanded ? '#1890ff' : '#C0C0C0',
                    borderRadius: '2px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 400,
                    lineHeight: '1'
                  }}
                >
                  {isExpanded ? '−' : '+'}
                </span>
              )}
              <span style={{ fontWeight }}>{data.name}</span>
            </div>
          )
        },
        cellStyle: (params: CellClassParams) => {
          const data = params.data as LCRRowData
          const baseStyle: any = { fontWeight: data.level === 0 ? 600 : 400 }
          if (data?.isSummary) {
            baseStyle.backgroundColor = '#F5F5F5'
          } else if (data?.name === 'Surplus') {
            baseStyle.backgroundColor = '#E6F7FF'
          }
          return baseStyle
        },
      },
      {
        headerName: 'Enterprise',
        children: [
          {
            field: 'enterprise.current',
            headerName: '29-Sep',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              if (value == null) return ''
              // Check if it's a percentage (LCR Ratio)
              const data = params.data as LCRRowData
              if (data?.name === 'LCR Ratio') {
                return `${value}%`
              }
              return value.toLocaleString()
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right', fontWeight: 500, color: '#000000' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            field: 'enterprise.previous',
            headerName: '31-Aug',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              if (data?.name === 'LCR Ratio') {
                return `${value}%`
              }
              return value.toLocaleString()
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right', fontWeight: 500, color: '#000000' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            field: 'enterprise.variance',
            headerName: 'Variance',
            flex: 1,
            minWidth: 100,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              const isPercentage = data?.name === 'LCR Ratio'
              const absValue = Math.abs(value)
              const formatted = isPercentage ? `${absValue}%` : absValue.toLocaleString()
              
              if (value > 0) {
                return (
                  <span style={{ color: '#008A00', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowUpOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              } else if (value < 0) {
                return (
                  <span style={{ color: '#ff4d4f', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowDownOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              }
              return <span style={{ textAlign: 'right', fontWeight: 500, color: '#000000' }}>{formatted}</span>
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            headerName: '',
            flex: 0.5,
            minWidth: 70,
            maxWidth: 90,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as LCRRowData
              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'inline-block', transform: 'translateY(5px)' }}>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 20 20" 
                      fill="none" 
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx="10" cy="5" r="1.5" fill="#999" stroke="none"/>
                      <circle cx="10" cy="10" r="1.5" fill="#999" stroke="none"/>
                      <circle cx="10" cy="15" r="1.5" fill="#999" stroke="none"/>
                    </svg>
                    {data.hasAlert && (
                      <span style={{ 
                        position: 'absolute',
                        top: '0px',
                        right: '0px',
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: '#ff4d4f',
                        display: 'inline-block'
                      }} />
                    )}
                  </div>
                </div>
              )
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '8px'
              }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
        ],
      },
      {
        headerName: 'CAD Retail',
        children: [
          {
            field: 'cadRetail.current',
            headerName: '29-Sep',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              if (data?.name === 'LCR Ratio') {
                return `${value}%`
              }
              return value.toLocaleString()
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right', fontWeight: 500, color: '#000000' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            field: 'cadRetail.previous',
            headerName: '31-Aug',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              if (data?.name === 'LCR Ratio') {
                return `${value}%`
              }
              return value.toLocaleString()
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right', fontWeight: 500, color: '#000000' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            field: 'cadRetail.variance',
            headerName: 'Variance',
            flex: 1,
            minWidth: 100,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              const isPercentage = data?.name === 'LCR Ratio'
              const absValue = Math.abs(value)
              const formatted = isPercentage ? `${absValue}%` : absValue.toLocaleString()
              
              if (value > 0) {
                return (
                  <span style={{ color: '#008A00', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowUpOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              } else if (value < 0) {
                return (
                  <span style={{ color: '#ff4d4f', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowDownOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              }
              return <span style={{ textAlign: 'right', fontWeight: 500, color: '#000000' }}>{formatted}</span>
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            headerName: '',
            flex: 0.5,
            minWidth: 70,
            maxWidth: 90,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as LCRRowData
              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'inline-block', transform: 'translateY(5px)' }}>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 20 20" 
                      fill="none" 
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx="10" cy="5" r="1.5" fill="#999" stroke="none"/>
                      <circle cx="10" cy="10" r="1.5" fill="#999" stroke="none"/>
                      <circle cx="10" cy="15" r="1.5" fill="#999" stroke="none"/>
                    </svg>
                    {data.hasAlert && (
                      <span style={{ 
                        position: 'absolute',
                        top: '0px',
                        right: '0px',
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: '#ff4d4f',
                        display: 'inline-block'
                      }} />
                    )}
                  </div>
                </div>
              )
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '8px'
              }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
        ],
      },
      {
        headerName: 'Wholesale',
        children: [
          {
            field: 'wholesale.current',
            headerName: '29-Sep',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              if (data?.name === 'LCR Ratio') {
                return `${value}%`
              }
              return value.toLocaleString()
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right', fontWeight: 500, color: '#000000' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            field: 'wholesale.previous',
            headerName: '31-Aug',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              if (data?.name === 'LCR Ratio') {
                return `${value}%`
              }
              return value.toLocaleString()
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right', fontWeight: 500, color: '#000000' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            field: 'wholesale.variance',
            headerName: 'Variance',
            flex: 1,
            minWidth: 100,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              const isPercentage = data?.name === 'LCR Ratio'
              const absValue = Math.abs(value)
              const formatted = isPercentage ? `${absValue}%` : absValue.toLocaleString()
              
              if (value > 0) {
                return (
                  <span style={{ color: '#008A00', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowUpOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              } else if (value < 0) {
                return (
                  <span style={{ color: '#ff4d4f', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowDownOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              }
              return <span style={{ textAlign: 'right', fontWeight: 500, color: '#000000' }}>{formatted}</span>
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            headerName: '',
            flex: 0.5,
            minWidth: 70,
            maxWidth: 90,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as LCRRowData
              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'inline-block', transform: 'translateY(5px)' }}>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 20 20" 
                      fill="none" 
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx="10" cy="5" r="1.5" fill="#999" stroke="none"/>
                      <circle cx="10" cy="10" r="1.5" fill="#999" stroke="none"/>
                      <circle cx="10" cy="15" r="1.5" fill="#999" stroke="none"/>
                    </svg>
                    {data.hasAlert && (
                      <span style={{ 
                        position: 'absolute',
                        top: '0px',
                        right: '0px',
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: '#ff4d4f',
                        display: 'inline-block'
                      }} />
                    )}
                  </div>
                </div>
              )
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '8px'
              }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
        ],
      },
      {
        headerName: 'US Retail',
        children: [
          {
            field: 'usRetail.current',
            headerName: '29-Sep',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              if (data?.name === 'LCR Ratio') {
                return `${value}%`
              }
              return value.toLocaleString()
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right', fontWeight: 500, color: '#000000' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            field: 'usRetail.previous',
            headerName: '31-Aug',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              if (data?.name === 'LCR Ratio') {
                return `${value}%`
              }
              return value.toLocaleString()
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right', fontWeight: 500, color: '#000000' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            field: 'usRetail.variance',
            headerName: 'Variance',
            flex: 1,
            minWidth: 100,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const data = params.data as LCRRowData
              const isPercentage = data?.name === 'LCR Ratio'
              const absValue = Math.abs(value)
              const formatted = isPercentage ? `${absValue}%` : absValue.toLocaleString()
              
              if (value > 0) {
                return (
                  <span style={{ color: '#008A00', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowUpOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              } else if (value < 0) {
                return (
                  <span style={{ color: '#ff4d4f', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowDownOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              }
              return <span style={{ textAlign: 'right', fontWeight: 500, color: '#000000' }}>{formatted}</span>
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { textAlign: 'right' }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
          {
            headerName: '',
            flex: 0.5,
            minWidth: 70,
            maxWidth: 90,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as LCRRowData
              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'inline-block', transform: 'translateY(5px)' }}>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 20 20" 
                      fill="none" 
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx="10" cy="5" r="1.5" fill="#999" stroke="none"/>
                      <circle cx="10" cy="10" r="1.5" fill="#999" stroke="none"/>
                      <circle cx="10" cy="15" r="1.5" fill="#999" stroke="none"/>
                    </svg>
                    {data.hasAlert && (
                      <span style={{ 
                        position: 'absolute',
                        top: '0px',
                        right: '0px',
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: '#ff4d4f',
                        display: 'inline-block'
                      }} />
                    )}
                  </div>
                </div>
              )
            },
            cellStyle: (params: CellClassParams) => {
              const data = params.data as LCRRowData
              const baseStyle: any = { 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '8px'
              }
              if (data?.isSummary) {
                baseStyle.backgroundColor = '#F5F5F5'
              } else if (data?.name === 'Surplus') {
                baseStyle.backgroundColor = '#E6F7FF'
              }
              return baseStyle
            },
          },
        ],
      },
    ],
    [expandedNodes]
  )

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: false,
    }),
    []
  )

  return (
    <div className="lcr-detail-container">
      <div className="page-header-wrapper">
        <div className="page-header">
          <div className="page-title">
            <FileTextOutlined className="page-icon" />
            <div className="title-breadcrumb">
              <a 
                href="#" 
                className="breadcrumb-link"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/regulatory/lcr')
                }}
              >
                Regulatory
              </a>
              <span className="breadcrumb-separator">-</span>
              <a 
                href="#" 
                className="breadcrumb-link"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/regulatory/lcr')
                }}
              >
                Metrics
              </a>
              <span className="breadcrumb-separator">-</span>
              <span className="breadcrumb-current">LCR</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '0 20px' }}>
        <QueryPanel initialValues={queryParams} onQuery={handleQuery} />
      
        {lcrData && (
          <div style={{ marginTop: '24px' }}>
            <div className="status-row">
              <Card className="status-card approved">
                <div className="status-top">
                  <div className="status-label">LCR Ratio</div>
                </div>
                <div className="status-update">Last update: {lastUpdateDate}</div>
                <div className="status-value-row">
                  <div className="status-value">
                    <AnimatedNumber value={lcrData.lcrRatio} duration={1500} /><span style={{ fontSize: '30px' }}>%</span>
                  </div>
                  <div className={`status-trend ${lcrData.lcrRatio >= 100 ? 'positive' : ''}`}>
                    {lcrData.lcrRatio >= 100 ? '↑' : '↓'}
                    {lcrData.lcrRatioChange && <span>{Math.abs(lcrData.lcrRatioChange)}%</span>}
                  </div>
                </div>
              </Card>
              <Card className="status-card approved">
                <div className="status-top">
                  <div className="status-label">Total HQLA</div>
                </div>
                <div className="status-update">Last update: {lastUpdateDate}</div>
                <div className="status-value-row">
                  <div className="status-value">
                    <span style={{ fontSize: '30px' }}>$</span><AnimatedNumber value={lcrData.hqla / 1000000} duration={1500} decimals={1} /> <span style={{ fontSize: '30px' }}>M</span>
                  </div>
                  <div className="status-trend">
                    ↓
                  </div>
                </div>
              </Card>
              <Card className="status-card approved">
                <div className="status-top">
                  <div className="status-label">Total NCO</div>
                </div>
                <div className="status-update">Last update: {lastUpdateDate}</div>
                <div className="status-value-row">
                  <div className="status-value">
                    <span style={{ fontSize: '30px' }}>$</span><AnimatedNumber value={lcrData.nco / 1000000} duration={1500} decimals={1} /> <span style={{ fontSize: '30px' }}>M</span>
                  </div>
                  <div className="status-trend">
                    ↓
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="lcr-status-bar">
                <span className="status-item">
                  <span className="status-dot status-dot-green"></span>
                  <span className="status-number status-number-green">12</span>
                  <span className="status-text">sign-offs</span>
                </span>
                <span className="status-separator">|</span>
                <span className="status-item">
                  <span className="status-dot status-dot-orange"></span>
                  <span className="status-number status-number-orange">3</span>
                  <span className="status-text">adjustments</span>
                </span>
              </div>
              <Button 
                className="lcr-submit-button"
                style={{ 
                  height: '40px',
                  minWidth: '150px',
                  backgroundColor: '#1890ff !important',
                  borderColor: '#1890ff !important',
                  color: '#ffffff'
                }}
              >
                Submit
              </Button>
            </div>

            <div className="ag-theme-material" style={{ marginTop: '-2px' }}>
              <AgGridReact
                columnDefs={lcrColumnDefs}
                rowData={getLCRRowData}
                defaultColDef={defaultColDef}
                animateRows={true}
                domLayout="autoHeight"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LCRDetail
