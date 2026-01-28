import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, Tabs } from 'antd'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ColGroupDef, CellClassParams, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community'
import { FolderOutlined, ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined } from '@ant-design/icons'
import QueryPanel, { QueryParams } from '@components/shared/QueryPanel'
import CommentaryDrawer from '@components/shared/CommentaryDrawer'
import { useAppDispatch, useAppSelector } from '@store/hooks'
import { loadProductsAsync } from '@store/slices/productSlice'
import dayjs from 'dayjs'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-material.css'
import './Deposits.scss'

interface FR2052AData {
  pid: string
  product: string
  amount1: number
  amount2: number
  amount3: number
  hasAlert?: boolean
  isGrandTotal?: boolean
}

// interface USLCRData extends SummaryRowData {
//   counterparty: string
//   keyFactor: string
//   lcrWeights: string
//   ruleText: string
//   notionalPrev: number
//   notionalCurr: number
//   notionalVar: number
//   ncoPrev: number
//   ncoCurr: number
//   ncoVar: number
// }

type CounterpartyType =
  | 'TOTAL'
  | 'RETAIL'
  | 'SME'
  | 'NON_FINANCIAL'
  | 'PENSION_FUNDS'
  | 'SOVEREIGNS'
  | 'GSE_PSE'
  | 'BANK'
  | 'BROKER_DEALERS'
  | 'INVESTMENT_FUNDS'
  | 'OTHER_FINANCIAL'

interface SummaryRowData {
  nodeId: string
  name: string
  level: number
  isExpanded: boolean
  isLeaf: boolean
  hasAlert?: boolean // For red dot indicator
  counterparties: {
    [key in CounterpartyType]?: {
      previous?: number
      current: number
      variance: number
      trend: 'UP' | 'DOWN' | 'FLAT'
    }
  }
}

function Deposits() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { products } = useAppSelector((state) => state.product)

  const [activeTab, setActiveTab] = useState('Summary')
  const [commentaryOpen, setCommentaryOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [historyComments, setHistoryComments] = useState<any[]>([])
  
  // Initialize queryParams from location.state if available
  const initialQueryParams = useMemo(() => {
    if (location.state) {
      const state = location.state as any
      return {
        region: state.region || undefined,
        segment: state.segment || undefined,
        prior: state.prior ? dayjs(state.prior) : undefined,
        current: state.current ? dayjs(state.current) : undefined,
      }
    }
    return {}
  }, [location.state])
  
  const [queryParams, setQueryParams] = useState<Partial<QueryParams>>(initialQueryParams)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['personal', 'non-personal', 'wholesale', 'wholesale-gtb', 'wholesale-gtb-operational', 'wholesale-gtb-excess', 'pwm']))

  const tabs = ['Summary', 'FR2052A', 'US LCR', 'Enterprise LCR', 'US NSFR', 'Enterprise NSFR', 'ILST']

  // Update queryParams when location.state changes
  useEffect(() => {
    if (location.state) {
      const state = location.state as any
      setQueryParams({
        region: state.region || undefined,
        segment: state.segment || undefined,
        prior: state.prior ? dayjs(state.prior) : undefined,
        current: state.current ? dayjs(state.current) : undefined,
      })
    }
  }, [location.state])

  useEffect(() => {
    loadData()
  }, [queryParams])

  const loadData = async () => {
    await dispatch(
      loadProductsAsync({
        productType: 'Deposits',
        params: queryParams as any,
      })
    )
  }

  const handleQuery = (params: QueryParams) => {
    setQueryParams(params)
  }

  // Check if all required fields are filled
  const isFormComplete = useMemo(() => {
    return !!(
      queryParams.region &&
      queryParams.segment &&
      queryParams.prior &&
      queryParams.current
    )
  }, [queryParams])


  const handleCommentary = (product: any) => {
    setSelectedProduct(product)
    setHistoryComments(
      product.commentary
        ? [
            {
              id: 1,
              user: 'Current User',
              timestamp: new Date(),
              content: product.commentary,
            },
          ]
        : []
    )
    setCommentaryOpen(true)
  }

  const handleSaveCommentary = (content: string) => {
    // TODO: Save commentary via Redux action
    console.log('Saving commentary:', content)
    setCommentaryOpen(false)
  }

  const defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: false,
    floatingFilter: false,
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

  const summaryColumnDefs: (ColDef | ColGroupDef)[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Deposits',
        width: 300,
        pinned: 'left',
        headerComponent: () => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '8px 0' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>Deposits</div>
            <div style={{ fontWeight: 400, fontSize: '12px', color: '#1890ff', marginTop: '2px' }}>(Amount in Millions CAD)</div>
          </div>
        ),
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as SummaryRowData
          const indent = data.level * 20
          const isExpanded = expandedNodes.has(data.nodeId)
          // Level 0 (主分类) 用粗体，Level 1+ (子分类) 用正常粗细
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
                  className="expansion-icon"
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
      },
      {
        headerName: 'Total',
        children: [
          {
            field: 'counterparties.TOTAL.previous',
            headerName: 'Previous',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.TOTAL.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.TOTAL.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'Retail',
        children: [
          {
            field: 'counterparties.RETAIL.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.RETAIL.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'SME',
        children: [
          {
            field: 'counterparties.SME.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.SME.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'Non-Financial',
        children: [
          {
            field: 'counterparties.NON_FINANCIAL.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.NON_FINANCIAL.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'Pension Funds',
        children: [
          {
            field: 'counterparties.PENSION_FUNDS.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.PENSION_FUNDS.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'Sovereigns',
        children: [
          {
            field: 'counterparties.SOVEREIGNS.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.SOVEREIGNS.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'GSE/PSEs',
        children: [
          {
            field: 'counterparties.GSE_PSE.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.GSE_PSE.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'Bank',
        children: [
          {
            field: 'counterparties.BANK.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.BANK.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'Broker Dealers/FMUs',
        children: [
          {
            field: 'counterparties.BROKER_DEALERS.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.BROKER_DEALERS.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'Investment Firms/Funds',
        children: [
          {
            field: 'counterparties.INVESTMENT_FUNDS.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.INVESTMENT_FUNDS.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'Other Financial Entities',
        children: [
          {
            field: 'counterparties.OTHER_FINANCIAL.current',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'counterparties.OTHER_FINANCIAL.variance',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
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
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: '',
            width: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
    ],
    [expandedNodes]
  )

  const fr2052aColumnDefs: ColDef[] = useMemo(
    () => [
      { 
        field: 'pid', 
        headerName: 'Pid', 
        flex: 1,
        minWidth: 150,
        cellStyle: (params: CellClassParams) => {
          const data = params.data as FR2052AData
          if (data?.isGrandTotal) {
            return { backgroundColor: '#E6F7FF' }
          }
          return undefined
        },
      },
      { 
        field: 'product', 
        headerName: 'Product', 
        flex: 3,
        minWidth: 300,
        cellStyle: (params: CellClassParams) => {
          const data = params.data as FR2052AData
          if (data?.isGrandTotal) {
            return { backgroundColor: '#E6F7FF', fontWeight: 500 }
          }
          return { fontWeight: 400 } as any
        },
      },
      {
        field: 'amount1',
        headerName: '6G Amount',
        flex: 1,
        minWidth: 120,
        valueFormatter: (params: ValueFormatterParams) => {
          const value = params.value
          return value != null ? value.toLocaleString() : ''
        },
        cellStyle: (params: CellClassParams) => {
          const data = params.data as FR2052AData
          if (data?.isGrandTotal) {
            return { backgroundColor: '#E6F7FF', textAlign: 'right', fontWeight: 500, color: '#000000' }
          }
          return { textAlign: 'right', fontWeight: 500, color: '#000000' } as any
        },
      },
      {
        field: 'amount2',
        headerName: '6G Amount',
        flex: 1,
        minWidth: 120,
        valueFormatter: (params: ValueFormatterParams) => {
          const value = params.value
          return value != null ? value.toLocaleString() : ''
        },
        cellStyle: (params: CellClassParams) => {
          const data = params.data as FR2052AData
          if (data?.isGrandTotal) {
            return { backgroundColor: '#E6F7FF', textAlign: 'right', fontWeight: 500, color: '#000000' }
          }
          return { textAlign: 'right', fontWeight: 500, color: '#000000' } as any
        },
      },
      {
        field: 'amount3',
        headerName: '6G Amount',
        flex: 1,
        minWidth: 120,
        valueFormatter: (params: ValueFormatterParams) => {
          const value = params.value
          return value != null ? value.toLocaleString() : ''
        },
        cellStyle: (params: CellClassParams) => {
          const data = params.data as FR2052AData
          if (data?.isGrandTotal) {
            return { backgroundColor: '#E6F7FF', textAlign: 'right', fontWeight: 500, color: '#000000' }
          }
          return { textAlign: 'right', fontWeight: 500, color: '#000000' } as any
        },
      },
      {
        headerName: 'Action',
        flex: 0.5,
        minWidth: 80,
        maxWidth: 100,
        cellStyle: (params: CellClassParams) => {
          const data = params.data as FR2052AData
          if (data?.isGrandTotal) {
            return { backgroundColor: '#E6F7FF' } as any
          }
          return { 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '8px'
          } as any
        },
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as FR2052AData
          if (data?.isGrandTotal) return ''
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
      },
    ],
    []
  )

  const usLcrColumnDefs: (ColDef | ColGroupDef)[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Withdrawal Risk',
        width: 300,
        pinned: 'left',
        headerComponent: () => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '8px 0' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>Withdrawal Risk</div>
            <div style={{ fontWeight: 400, fontSize: '12px', color: '#1890ff', marginTop: '2px' }}>(Amount in Millions CAD)</div>
          </div>
        ),
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as SummaryRowData
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
                  className="expansion-icon"
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
      },
      {
        field: 'counterparty',
        headerName: 'Counterparty',
        width: 150,
        cellStyle: (params: CellClassParams) => {
          const value = params.value
          const baseStyle = { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
          if (value === 'N/A' || value === '') {
            return { ...baseStyle, color: '#999999' }
          }
          return baseStyle
        },
      },
      {
        field: 'keyFactor',
        headerName: 'Key Factor',
        width: 150,
        cellStyle: (params: CellClassParams) => {
          const value = params.value
          const baseStyle = { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
          if (value === 'N/A' || value === '') {
            return { ...baseStyle, color: '#999999' }
          }
          return baseStyle
        },
      },
      {
        field: 'lcrWeights',
        headerName: 'LCR Weights',
        width: 150,
        cellStyle: (params: CellClassParams) => {
          const value = params.value
          if (value === 'N/A' || value === '') {
            return { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", textAlign: 'right', fontWeight: 500, color: '#999999' }
          }
          return { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", textAlign: 'right', fontWeight: 500, color: '#000000' }
        },
      },
      {
        field: 'ruleText',
        headerName: 'Rule Text',
        width: 200,
        cellStyle: (params: CellClassParams) => {
          const value = params.value
          const baseStyle = { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
          if (value === 'N/A' || value === '') {
            return { ...baseStyle, color: '#999999' }
          }
          return baseStyle
        },
      },
      {
        headerName: 'Notional',
        children: [
          {
            field: 'notionalPrev',
            headerName: 'Previous',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'notionalCurr',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'notionalVar',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
              const baseStyle = { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", textAlign: 'right' as const, fontWeight: 500 }
              if (value > 0) {
                return (
                  <span style={{ ...baseStyle, color: '#008A00', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowUpOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              } else if (value < 0) {
                return (
                  <span style={{ ...baseStyle, color: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowDownOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              }
              return <span style={{ ...baseStyle, color: '#000000' }}>{formatted}</span>
            },
            cellStyle: { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", textAlign: 'right' },
          },
          {
            headerName: '',
            flex: 0,
            minWidth: 80,
            maxWidth: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
      {
        headerName: 'NCO',
        children: [
          {
            field: 'ncoPrev',
            headerName: 'Previous',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'ncoCurr',
            headerName: 'Current',
            width: 130,
            valueFormatter: (params: ValueFormatterParams) => {
              const value = params.value
              return value != null ? value.toLocaleString() : ''
            },
            cellStyle: { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", textAlign: 'right', fontWeight: 500, color: '#000000' },
          },
          {
            field: 'ncoVar',
            headerName: 'Variance',
            width: 130,
            cellRenderer: (params: ICellRendererParams) => {
              const value = params.value
              if (value == null) return ''
              const absValue = Math.abs(value)
              const formatted = absValue.toLocaleString()
              const baseStyle = { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", textAlign: 'right' as const, fontWeight: 500 }
              if (value > 0) {
                return (
                  <span style={{ ...baseStyle, color: '#008A00', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowUpOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              } else if (value < 0) {
                return (
                  <span style={{ ...baseStyle, color: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {formatted} <ArrowDownOutlined style={{ fontSize: '12px' }} />
                  </span>
                )
              }
              return <span style={{ ...baseStyle, color: '#000000' }}>{formatted}</span>
            },
            cellStyle: { fontSize: '13px', fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", textAlign: 'right' },
          },
          {
            headerName: '',
            flex: 0,
            minWidth: 80,
            maxWidth: 80,
            headerComponent: () => <div></div>,
            cellRenderer: (params: ICellRendererParams) => {
              const data = params.data as SummaryRowData
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
            cellStyle: { 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px'
            },
          },
        ],
      },
    ],
    [expandedNodes]
  )

  const getColumnDefs = () => {
    switch (activeTab) {
      case 'Summary':
        return summaryColumnDefs
      case 'FR2052A':
        return fr2052aColumnDefs
      case 'US LCR':
        return usLcrColumnDefs
      default:
        return summaryColumnDefs
    }
  }

  const getSummaryRowData = useMemo((): SummaryRowData[] => {
    const buildRows = (): SummaryRowData[] => {
      const rows: SummaryRowData[] = []
      
      // Always return data, even if form is not complete
      
      // Helper to add trend to counterparty data
      const addTrendToCounterparties = (cp: any): any => {
        const result: any = {}
        for (const [key, value] of Object.entries(cp)) {
          if (value && typeof value === 'object' && 'variance' in value) {
            const v = value as { previous?: number; current: number; variance: number }
            const trend: 'UP' | 'DOWN' | 'FLAT' = v.variance > 0 ? 'UP' : v.variance < 0 ? 'DOWN' : 'FLAT'
            result[key] = { ...v, trend }
          } else {
            result[key] = value
          }
        }
        return result
      }

      // Sample data structure based on the image
      const dataStructure = [
        {
          id: 'personal',
          name: 'Personal',
          level: 0,
          isLeaf: false,
          hasAlert: false,
          children: [
            { id: 'personal-demand', name: 'Demand Deposits (Checking)', hasAlert: true },
            { id: 'personal-cds', name: 'CDs/Term Deposits/GIC', hasAlert: false },
            { id: 'personal-savings', name: 'Savings Accounts', hasAlert: false },
            { id: 'personal-third', name: 'Third Party Deposits', hasAlert: true },
          ],
          counterparties: addTrendToCounterparties({
            TOTAL: { previous: 22400, current: 28000, variance: 5600 },
            RETAIL: { current: 22400, variance: 5600 },
            SME: { current: 0, variance: 0 },
            NON_FINANCIAL: { current: 0, variance: 0 },
            PENSION_FUNDS: { current: 0, variance: 0 },
            SOVEREIGNS: { current: 16800, variance: 5600 },
            GSE_PSE: { current: 18800, variance: -300 },
            BANK: { current: 93000, variance: -4800 },
            BROKER_DEALERS: { current: 8700, variance: 1300 },
            INVESTMENT_FUNDS: { current: -1100, variance: -4700 },
            OTHER_FINANCIAL: { current: 22400, variance: 800 },
          }),
        },
        {
          id: 'non-personal',
          name: 'Non-Personal',
          level: 0,
          isLeaf: false,
          hasAlert: false,
          children: [
            { id: 'non-personal-sweep', name: 'Sweep Accounts', hasAlert: false },
            { id: 'non-personal-brokered', name: 'Brokered CDs', hasAlert: false },
            { id: 'non-personal-banking', name: 'Business Banking', hasAlert: false },
          ],
          counterparties: addTrendToCounterparties({
            TOTAL: { previous: 18800, current: 18500, variance: -300 },
            RETAIL: { current: 18800, variance: -300 },
            SME: { current: 0, variance: 0 },
            NON_FINANCIAL: { current: 0, variance: 0 },
            PENSION_FUNDS: { current: 0, variance: 0 },
            SOVEREIGNS: { current: 18500, variance: -300 },
            GSE_PSE: { current: 0, variance: 0 },
            BANK: { current: 0, variance: 0 },
            BROKER_DEALERS: { current: 0, variance: 0 },
            INVESTMENT_FUNDS: { current: 0, variance: 0 },
            OTHER_FINANCIAL: { current: 0, variance: 0 },
          }),
        },
        {
          id: 'wholesale',
          name: 'Wholesale Deposits',
          level: 0,
          isLeaf: false,
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
                    {
                      id: 'wholesale-gtb-excess-bank',
                      name: 'Bank',
                      hasAlert: false,
                    },
                    {
                      id: 'wholesale-gtb-excess-broker',
                      name: 'Broker Dealers',
                      hasAlert: false,
                    },
                    {
                      id: 'wholesale-gtb-excess-ia',
                      name: 'IA/FMUs/Funds',
                      hasAlert: false,
                    },
                    {
                      id: 'wholesale-gtb-excess-pension',
                      name: 'Pension Funds',
                      hasAlert: false,
                    },
                    {
                      id: 'wholesale-gtb-excess-pse',
                      name: 'PSE/GSE/MDBs',
                      hasAlert: false,
                    },
                    {
                      id: 'wholesale-gtb-excess-nonfin',
                      name: 'Non-Financial Corp',
                      hasAlert: false,
                    },
                  ],
                },
              ],
            },
          ],
          counterparties: addTrendToCounterparties({
            TOTAL: { previous: 94200, current: 89400, variance: -4800 },
            RETAIL: { current: 94200, variance: -4800 },
            SME: { current: 0, variance: 0 },
            NON_FINANCIAL: { current: 0, variance: 0 },
            PENSION_FUNDS: { current: 0, variance: 0 },
            SOVEREIGNS: { current: 94200, variance: -4800 },
            GSE_PSE: { current: 0, variance: 0 },
            BANK: { current: 0, variance: 0 },
            BROKER_DEALERS: { current: 0, variance: 0 },
            INVESTMENT_FUNDS: { current: 0, variance: 0 },
            OTHER_FINANCIAL: { current: 0, variance: 0 },
          }),
        },
        {
          id: 'pwm',
          name: 'PWM Deposits',
          level: 0,
          isLeaf: false,
          hasAlert: false,
          children: [
            { id: 'pwm-cds', name: 'CDs', hasAlert: true },
            { id: 'pwm-term', name: 'Term Deposits', hasAlert: false },
            { id: 'pwm-demand', name: 'Demand Deposits', hasAlert: true },
            { id: 'pwm-savings', name: 'Savings', hasAlert: false },
          ],
          counterparties: addTrendToCounterparties({
            TOTAL: { previous: 9500, current: 8800, variance: -700 },
            RETAIL: { current: 9500, variance: -700 },
            SME: { current: 0, variance: 0 },
            NON_FINANCIAL: { current: 0, variance: 0 },
            PENSION_FUNDS: { current: 0, variance: 0 },
            SOVEREIGNS: { current: 8800, variance: -700 },
            GSE_PSE: { current: 0, variance: 0 },
            BANK: { current: 0, variance: 0 },
            BROKER_DEALERS: { current: 0, variance: 0 },
            INVESTMENT_FUNDS: { current: 0, variance: 0 },
            OTHER_FINANCIAL: { current: 0, variance: 0 },
          }),
        },
      ]

      // Helper function to add trend to counterparty data
      const addTrend = (data: { previous?: number; current: number; variance: number }): { previous?: number; current: number; variance: number; trend: 'UP' | 'DOWN' | 'FLAT' } => {
        const trend: 'UP' | 'DOWN' | 'FLAT' = data.variance > 0 ? 'UP' : data.variance < 0 ? 'DOWN' : 'FLAT'
        return { ...data, trend }
      }

      // Helper to process counterparty data and add trend
      const processCounterparties = (data: Record<string, any>): Record<string, any> => {
        const result: Record<string, any> = {}
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'object' && 'variance' in value) {
            result[key] = addTrend(value as { previous?: number; current: number; variance: number })
          } else {
            result[key] = value
          }
        }
        return result
      }

      // Child data for each category
      const childData: Record<string, any> = {
        'personal-demand': processCounterparties({
          TOTAL: { previous: 8000, current: 10000, variance: 2000 },
          RETAIL: { current: 8000, variance: 2000 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 8000, variance: 2000 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'personal-cds': processCounterparties({
          TOTAL: { previous: 5000, current: 6000, variance: 1000 },
          RETAIL: { current: 5000, variance: 1000 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 5000, variance: 1000 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'personal-savings': processCounterparties({
          TOTAL: { previous: 4000, current: 5000, variance: 1000 },
          RETAIL: { current: 4000, variance: 1000 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 4000, variance: 1000 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'personal-third': processCounterparties({
          TOTAL: { previous: 3000, current: 4000, variance: 1000 },
          RETAIL: { current: 3000, variance: 1000 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 3000, variance: 1000 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'non-personal-sweep': processCounterparties({
          TOTAL: { previous: 6000, current: 5800, variance: -200 },
          RETAIL: { current: 6000, variance: -200 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 5800, variance: -200 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'non-personal-brokered': processCounterparties({
          TOTAL: { previous: 5000, current: 5000, variance: 0 },
          RETAIL: { current: 5000, variance: 0 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 5000, variance: 0 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'non-personal-banking': processCounterparties({
          TOTAL: { previous: 7800, current: 7700, variance: -100 },
          RETAIL: { current: 7800, variance: -100 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 7700, variance: -100 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'wholesale-cds': processCounterparties({
          TOTAL: { previous: 30000, current: 28000, variance: -2000 },
          RETAIL: { current: 30000, variance: -2000 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 28000, variance: -2000 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'wholesale-term': processCounterparties({
          TOTAL: { previous: 34200, current: 33400, variance: -800 },
          RETAIL: { current: 34200, variance: -800 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 33400, variance: -800 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'wholesale-gtb': processCounterparties({
          TOTAL: { previous: 30000, current: 28000, variance: -2000 },
          RETAIL: { current: 30000, variance: -2000 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 28000, variance: -2000 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        // GTB sub-items - empty counterparties as they don't have summary data
        'wholesale-gtb-operational': {},
        'wholesale-gtb-operational-retail': {},
        'wholesale-gtb-operational-retail-insured': {},
        'wholesale-gtb-operational-retail-uninsured': {},
        'wholesale-gtb-operational-bank': {},
        'wholesale-gtb-operational-bank-insured': {},
        'wholesale-gtb-operational-bank-uninsured': {},
        'wholesale-gtb-operational-broker': {},
        'wholesale-gtb-operational-broker-insured': {},
        'wholesale-gtb-operational-broker-uninsured': {},
        'wholesale-gtb-operational-ia': {},
        'wholesale-gtb-operational-ia-insured': {},
        'wholesale-gtb-operational-ia-uninsured': {},
        'wholesale-gtb-operational-pension': {},
        'wholesale-gtb-operational-pension-insured': {},
        'wholesale-gtb-operational-pension-uninsured': {},
        'wholesale-gtb-operational-pse': {},
        'wholesale-gtb-operational-pse-insured': {},
        'wholesale-gtb-operational-pse-uninsured': {},
        'wholesale-gtb-excess': {},
        'wholesale-gtb-excess-retail': {},
        'wholesale-gtb-excess-retail-insured': {},
        'wholesale-gtb-excess-retail-uninsured': {},
        'wholesale-gtb-excess-bank': {},
        'wholesale-gtb-excess-broker': {},
        'wholesale-gtb-excess-ia': {},
        'wholesale-gtb-excess-pension': {},
        'wholesale-gtb-excess-pse': {},
        'wholesale-gtb-excess-nonfin': {},
        'pwm-cds': processCounterparties({
          TOTAL: { previous: 5000, current: 4500, variance: -500 },
          RETAIL: { current: 5000, variance: -500 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 4500, variance: -500 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'pwm-term': processCounterparties({
          TOTAL: { previous: 2000, current: 1800, variance: -200 },
          RETAIL: { current: 2000, variance: -200 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 1800, variance: -200 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'pwm-demand': processCounterparties({
          TOTAL: { previous: 4500, current: 4300, variance: -200 },
          RETAIL: { current: 4500, variance: -200 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 4300, variance: -200 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
        'pwm-savings': processCounterparties({
          TOTAL: { previous: 1500, current: 1200, variance: -300 },
          RETAIL: { current: 1500, variance: -300 },
          SME: { current: 0, variance: 0 },
          NON_FINANCIAL: { current: 0, variance: 0 },
          PENSION_FUNDS: { current: 0, variance: 0 },
          SOVEREIGNS: { current: 1200, variance: -300 },
          GSE_PSE: { current: 0, variance: 0 },
          BANK: { current: 0, variance: 0 },
          BROKER_DEALERS: { current: 0, variance: 0 },
          INVESTMENT_FUNDS: { current: 0, variance: 0 },
          OTHER_FINANCIAL: { current: 0, variance: 0 },
        }),
      }

      for (const item of dataStructure) {
        const isExpanded = expandedNodes.has(item.id)
        
        // Add parent row
        rows.push({
          nodeId: item.id,
          name: item.name,
          level: item.level,
          isExpanded,
          isLeaf: false,
          hasAlert: item.hasAlert,
          counterparties: item.counterparties,
        })

        // Add children if expanded (recursive)
        if (isExpanded && item.children) {
          const addChildren = (children: any[], parentLevel: number) => {
            for (const child of children) {
              const hasChildren = child.children && child.children.length > 0
              const isChildExpanded = hasChildren && expandedNodes.has(child.id)
              
              rows.push({
                nodeId: child.id,
                name: child.name,
                level: parentLevel + 1,
                isExpanded: isChildExpanded,
                isLeaf: !hasChildren,
                hasAlert: child.hasAlert,
                counterparties: childData[child.id] || {},
              })
              
              // Recursively add grandchildren if expanded
              if (isChildExpanded && child.children) {
                addChildren(child.children, parentLevel + 1)
              }
            }
          }
          addChildren(item.children, item.level)
        }
      }

      return rows
    }

    return buildRows()
  }, [expandedNodes])

  const getFR2052AData = useMemo((): FR2052AData[] => {
    const data: FR2052AData[] = [
      { pid: 'O.D.1', product: 'Transactional Accounts', amount1: 137199, amount2: 271, amount3: 37 },
      { pid: 'O.D.2', product: 'Non-Transactional Relationship Accounts', amount1: 0, amount2: 0, amount3: 0 },
      { pid: 'O.D.3', product: 'Non-Transactional Non-Relationship Accounts', amount1: 0, amount2: 0, amount3: 0 },
      { pid: 'O.D.4', product: 'Operational Account Balances', amount1: 0, amount2: 0, amount3: 0 },
      { pid: 'O.D.5', product: 'Excess Balances in Operational Accounts', amount1: 0, amount2: 0, amount3: 0 },
      { pid: 'O.D.6', product: 'Non-Operational Account Balances', amount1: 0, amount2: 0, amount3: 0 },
      { pid: 'O.D.7', product: 'Operational Escrow Accounts', amount1: 0, amount2: 0, amount3: 0 },
      { pid: 'O.D.8', product: 'Non-Reciprocal Brokered Deposits', amount1: -33, amount2: 0, amount3: 0 },
      { pid: 'O.D.10', product: 'Less Stable Affiliated Sweep Account Balances', amount1: -24, amount2: 0, amount3: 0 },
      { pid: 'O.D.11', product: 'Non-Affiliated Sweep Accounts', amount1: 0, amount2: 0, amount3: 0 },
      { pid: 'O.D.14', product: 'Other Third-Party Deposits', amount1: 0, amount2: 0, amount3: 0 },
      { pid: 'O.W.16', product: 'Wholesale CDs', amount1: 0, amount2: 0, amount3: 0 },
      { pid: 'S.L.4', product: 'Non-Structured Debt Maturing in Greater than 30-d', amount1: 0, amount2: 0, amount3: 0 },
    ]
    
    // Add Grand Total row with values from screenshot
    data.push({
      pid: '',
      product: 'Grand Total',
      amount1: 460962,
      amount2: 460962,
      amount3: 3551,
      isGrandTotal: true,
    })
    
    return data
  }, [])

  const rowData = useMemo(() => {
    switch (activeTab) {
      case 'Summary':
        return getSummaryRowData
      case 'FR2052A':
        return getFR2052AData
      case 'US LCR':
        // Use Summary data structure for left column, add US LCR specific columns with data from screenshot
        const usLcrDataMap: Record<string, any> = {
          'personal': {
            counterparty: '',
            keyFactor: '',
            lcrWeights: '',
            ruleText: '',
            notionalPrev: 22400,
            notionalCurr: 16800,
            notionalVar: 5600,
            ncoPrev: 22400,
            ncoCurr: 16800,
            ncoVar: 5600,
          },
          'personal-demand': {
            counterparty: 'N/A',
            keyFactor: '',
            lcrWeights: '3%',
            ruleText: 'N/A',
            notionalPrev: 18500,
            notionalCurr: 18800,
            notionalVar: -300,
            ncoPrev: 18500,
            ncoCurr: 18800,
            ncoVar: -300,
          },
          'personal-cds': {
            counterparty: 'N/A',
            keyFactor: '',
            lcrWeights: '10%',
            ruleText: 'N/A',
            notionalPrev: 94200,
            notionalCurr: 93000,
            notionalVar: 1300,
            ncoPrev: 94200,
            ncoCurr: 93000,
            ncoVar: 1300,
          },
          'personal-savings': {
            counterparty: 'N/A',
            keyFactor: '',
            lcrWeights: '3%',
            ruleText: 'N/A',
            notionalPrev: 9500,
            notionalCurr: 8700,
            notionalVar: 800,
            ncoPrev: 9500,
            ncoCurr: 8700,
            ncoVar: 800,
          },
          'personal-third': {
            counterparty: 'N/A',
            keyFactor: '',
            lcrWeights: '10%',
            ruleText: 'N/A',
            notionalPrev: -5700,
            notionalCurr: -1100,
            notionalVar: -4700,
            ncoPrev: -5700,
            ncoCurr: -1100,
            ncoVar: -4700,
            hasAlert: true, // Red action icon
          },
          'non-personal': {
            counterparty: '',
            keyFactor: '',
            lcrWeights: '',
            ruleText: '',
            notionalPrev: 22400,
            notionalCurr: 22400,
            notionalVar: 22400,
            ncoPrev: 22400,
            ncoCurr: 22400,
            ncoVar: 22400,
          },
          'non-personal-sweep': {
            counterparty: 'N/A',
            keyFactor: 'N/A',
            lcrWeights: 'N/A',
            ruleText: 'N/A',
            notionalPrev: 18500,
            notionalCurr: 18500,
            notionalVar: 18500,
            ncoPrev: 18500,
            ncoCurr: 18500,
            ncoVar: 18500,
          },
          'non-personal-brokered': {
            counterparty: 'N/A',
            keyFactor: 'N/A',
            lcrWeights: 'N/A',
            ruleText: 'N/A',
            notionalPrev: 94200,
            notionalCurr: 94200,
            notionalVar: 94200,
            ncoPrev: 94200,
            ncoCurr: 94200,
            ncoVar: 94200,
          },
          'non-personal-banking': {
            counterparty: 'N/A',
            keyFactor: 'N/A',
            lcrWeights: 'N/A',
            ruleText: 'N/A',
            notionalPrev: 9500,
            notionalCurr: 9500,
            notionalVar: 9500,
            ncoPrev: 9500,
            ncoCurr: 9500,
            ncoVar: 9500,
          },
          'wholesale': {
            counterparty: '',
            keyFactor: '',
            lcrWeights: '',
            ruleText: '',
            notionalPrev: 8800,
            notionalCurr: 8800,
            notionalVar: 8800,
            ncoPrev: 8800,
            ncoCurr: 8800,
            ncoVar: 8800,
          },
          'wholesale-cds': {
            counterparty: 'N/A',
            keyFactor: 'N/A',
            lcrWeights: 'N/A',
            ruleText: 'N/A',
            notionalPrev: 22400,
            notionalCurr: 22400,
            notionalVar: 22400,
            ncoPrev: 22400,
            ncoCurr: 22400,
            ncoVar: 22400,
          },
          'wholesale-term': {
            counterparty: 'N/A',
            keyFactor: 'N/A',
            lcrWeights: 'N/A',
            ruleText: 'N/A',
            notionalPrev: 18500,
            notionalCurr: 18500,
            notionalVar: 18500,
            ncoPrev: 18500,
            ncoCurr: 18500,
            ncoVar: 18500,
          },
          'wholesale-gtb': {
            counterparty: '',
            keyFactor: '',
            lcrWeights: '',
            ruleText: '',
            notionalPrev: 94200,
            notionalCurr: 94200,
            notionalVar: 94200,
            ncoPrev: 94200,
            ncoCurr: 94200,
            ncoVar: 94200,
          },
          // GTB Operational sub-items
          'wholesale-gtb-operational': {
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
          },
          'wholesale-gtb-operational-retail': {
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
          },
          'wholesale-gtb-operational-retail-insured': {
            counterparty: 'Retail/SME',
            keyFactor: 'Insured',
            lcrWeights: '5%',
            ruleText: '12 CFR 249.32(h)(3)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-retail-uninsured': {
            counterparty: 'Retail/SME',
            keyFactor: 'Partial or Uninsured',
            lcrWeights: '25%',
            ruleText: '12 CFR 249.32(h)(4)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-bank': {
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
          },
          'wholesale-gtb-operational-bank-insured': {
            counterparty: 'Bank',
            keyFactor: 'Insured',
            lcrWeights: '5%',
            ruleText: '12 CFR 249.32(h)(3)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-bank-uninsured': {
            counterparty: 'Bank',
            keyFactor: 'Partial or Uninsured',
            lcrWeights: '25%',
            ruleText: '12 CFR 249.32(h)(4)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-broker': {
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
          },
          'wholesale-gtb-operational-broker-insured': {
            counterparty: 'Broker Dealers',
            keyFactor: 'Insured',
            lcrWeights: '5%',
            ruleText: '12 CFR 249.32(h)(3)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-broker-uninsured': {
            counterparty: 'Broker Dealers',
            keyFactor: 'Partial or Uninsured',
            lcrWeights: '25%',
            ruleText: '12 CFR 249.32(h)(4)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-ia': {
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
          },
          'wholesale-gtb-operational-ia-insured': {
            counterparty: 'IA/FMUs/Funds',
            keyFactor: 'Insured',
            lcrWeights: '5%',
            ruleText: '12 CFR 249.32(h)(3)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-ia-uninsured': {
            counterparty: 'IA/FMUs/Funds',
            keyFactor: 'Partial or Uninsured',
            lcrWeights: '25%',
            ruleText: '12 CFR 249.32(h)(4)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-pension': {
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
          },
          'wholesale-gtb-operational-pension-insured': {
            counterparty: 'Pension Funds',
            keyFactor: 'Insured',
            lcrWeights: '5%',
            ruleText: '12 CFR 249.32(h)(3)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-pension-uninsured': {
            counterparty: 'Pension Funds',
            keyFactor: 'Partial or Uninsured',
            lcrWeights: '25%',
            ruleText: '12 CFR 249.32(h)(4)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-pse': {
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
          },
          'wholesale-gtb-operational-pse-insured': {
            counterparty: 'PSE/GSE/MDBs',
            keyFactor: 'Insured',
            lcrWeights: '5%',
            ruleText: '12 CFR 249.32(h)(3)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-operational-pse-uninsured': {
            counterparty: 'PSE/GSE/MDBs',
            keyFactor: 'Partial or Uninsured',
            lcrWeights: '25%',
            ruleText: '12 CFR 249.32(h)(4)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          // GTB Excess Balance sub-items
          'wholesale-gtb-excess': {
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
          },
          'wholesale-gtb-excess-retail': {
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
          },
          'wholesale-gtb-excess-retail-insured': {
            counterparty: 'Retail/SME',
            keyFactor: 'Insured',
            lcrWeights: '5%',
            ruleText: '12 CFR 249.32(h)(1)(i)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-excess-retail-uninsured': {
            counterparty: 'Retail/SME',
            keyFactor: 'Partial or Uninsured',
            lcrWeights: '25%',
            ruleText: '12 CFR 249.32(h)(1)(ii)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-excess-bank': {
            counterparty: 'Bank',
            keyFactor: '',
            lcrWeights: '100%',
            ruleText: '12 CFR 249.32(h)(2)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-excess-broker': {
            counterparty: 'Broker Dealers',
            keyFactor: '',
            lcrWeights: '100%',
            ruleText: '12 CFR 249.32(h)(2)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-excess-ia': {
            counterparty: 'IA/FMUs/Funds',
            keyFactor: '',
            lcrWeights: '100%',
            ruleText: '12 CFR 249.32(h)(2)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-excess-pension': {
            counterparty: 'Pension Funds',
            keyFactor: '',
            lcrWeights: '40%',
            ruleText: '12 CFR 249.32(h)(1)(ii)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-excess-pse': {
            counterparty: 'PSE/GSE/MDBs',
            keyFactor: '',
            lcrWeights: '20%',
            ruleText: '12 CFR 249.32(h)(1)(i)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'wholesale-gtb-excess-nonfin': {
            counterparty: 'Non-Financial Corp',
            keyFactor: '',
            lcrWeights: '40%',
            ruleText: '12 CFR 249.32(h)(1)(ii)',
            notionalPrev: 0,
            notionalCurr: 0,
            notionalVar: 0,
            ncoPrev: 0,
            ncoCurr: 0,
            ncoVar: 0,
          },
          'pwm': {
            counterparty: '',
            keyFactor: '',
            lcrWeights: '',
            ruleText: '',
            notionalPrev: 22400,
            notionalCurr: 16800,
            notionalVar: 5600,
            ncoPrev: 22400,
            ncoCurr: 16800,
            ncoVar: 5600,
          },
          'pwm-cds': {
            counterparty: 'N/A',
            keyFactor: 'N/A',
            lcrWeights: 'N/A',
            ruleText: 'N/A',
            notionalPrev: 18500,
            notionalCurr: 18800,
            notionalVar: -300,
            ncoPrev: 18500,
            ncoCurr: 18800,
            ncoVar: -300,
          },
          'pwm-term': {
            counterparty: 'N/A',
            keyFactor: 'N/A',
            lcrWeights: 'N/A',
            ruleText: 'N/A',
            notionalPrev: 94200,
            notionalCurr: 93000,
            notionalVar: 1300,
            ncoPrev: 94200,
            ncoCurr: 93000,
            ncoVar: 1300,
          },
          'pwm-demand': {
            counterparty: 'N/A',
            keyFactor: 'N/A',
            lcrWeights: 'N/A',
            ruleText: 'N/A',
            notionalPrev: 9500,
            notionalCurr: 8700,
            notionalVar: 800,
            ncoPrev: 9500,
            ncoCurr: 8700,
            ncoVar: 800,
          },
          'pwm-savings': {
            counterparty: 'N/A',
            keyFactor: 'N/A',
            lcrWeights: 'N/A',
            ruleText: 'N/A',
            notionalPrev: -5700,
            notionalCurr: -1100,
            notionalVar: -4700,
            ncoPrev: -5700,
            ncoCurr: -1100,
            ncoVar: -4700,
          },
        }
        
        return getSummaryRowData.map((row) => {
          const usLcrData = usLcrDataMap[row.nodeId] || {
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
          return {
            ...row,
            ...usLcrData,
          }
        })
      default:
        return products
    }
  }, [activeTab, expandedNodes, products, getSummaryRowData, getFR2052AData])

  return (
    <div className="deposits-container">
      <div className="page-header">
          <div className="page-title">
            <FolderOutlined className="page-icon" />
            <div className="title-breadcrumb">
              <a 
                href="#" 
                className="breadcrumb-link"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/product')
                }}
              >
                Products
              </a>
              <span className="breadcrumb-separator">-</span>
              <span className="breadcrumb-current">Deposit</span>
            </div>
          </div>
        </div>
      
      <QueryPanel onQuery={handleQuery} initialValues={queryParams} />
      
      <Card>
        {!isFormComplete ? (
          <div className="deposits-empty-state">
            <InfoCircleOutlined className="empty-state-icon" />
            <div className="empty-state-text">
              Please select Region, Segment, and Date to view analytics
            </div>
          </div>
        ) : (
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={tabs.map((tab) => ({
              key: tab,
              label: tab,
              children: (
                <>
                  <div className="ag-theme-material" style={{ width: '100%' }}>
                    <AgGridReact
                      columnDefs={getColumnDefs()}
                      rowData={rowData}
                      defaultColDef={defaultColDef}
                      animateRows={true}
                      rowSelection="single"
                      suppressNoRowsOverlay={false}
                      domLayout="autoHeight"
                      onRowClicked={(event) => {
                        // Check if click was on name cell (first column) - if so, don't open panel (it's for expansion)
                        const target = event.event?.target as HTMLElement
                        if (target && target.closest('[col-id="name"]')) {
                          return
                        }
                        if (event.data) {
                          handleCommentary(event.data)
                        }
                      }}
                    />
                  </div>
                </>
              )
            }))}
          />
        )}
      </Card>

      <CommentaryDrawer
        isOpen={commentaryOpen}
        historyComments={historyComments}
        productName={selectedProduct?.product || selectedProduct?.name || 'Product'}
        onClose={() => setCommentaryOpen(false)}
        onSave={handleSaveCommentary}
      />
    </div>
  )
}

export default Deposits
