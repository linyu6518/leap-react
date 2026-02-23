import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ColDef, ColGroupDef, CellClassParams, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { QueryParams } from '@shared/components/query-panel/query-panel.component';
import { Commentary } from '@shared/components/commentary-drawer/commentary-drawer.component';

interface FR2052AData {
  pid: string;
  product: string;
  amount1: number;
  amount2: number;
  amount3: number;
  isGrandTotal?: boolean;
}

interface USLCRData {
  counterparty: string;
  keyFactor: string;
  lcrWeights: string;
  ruleText: string;
  notionalPrev: number;
  notionalCurr: number;
  notionalVar: number;
  ncoPrev: number;
  ncoCurr: number;
  ncoVar: number;
  isHeader?: boolean;
  hasIcon?: 'plus' | 'minus';
  indentLevel?: number;
  isFirstRow?: boolean; // Flag to identify first row
}

// Normalized data schema for regulatory financial dashboard
interface DepositNode {
  id: string;
  name: string;
  parentId: string | null;
  level: number; // 0 = root, 1 = category, 2 = subcategory, etc.
  isLeaf: boolean;
  children?: string[]; // child node IDs
}

interface CounterpartyValue {
  counterparty: CounterpartyType;
  previous: number;
  current: number;
}

interface DepositData {
  nodeId: string;
  values: CounterpartyValue[];
}

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
  | 'OTHER_FINANCIAL';

// Display model for tree table
interface SummaryRowData {
  nodeId: string;
  name: string;
  level: number;
  isExpanded: boolean;
  isLeaf: boolean;
  // Computed values for each counterparty
  counterparties: {
    [key in CounterpartyType]?: {
      previous: number;
      current: number;
      variance: number;
      trend: 'UP' | 'DOWN' | 'FLAT';
    };
  };
}

@Component({
  selector: 'app-deposits',
  templateUrl: './deposits.component.html',
  styleUrls: ['./deposits.component.scss']
})
export class DepositsComponent implements OnInit {
  activeTab = 'Summary';
  tabs = ['Summary', 'FR2052A', 'US LCR', 'Enterprise LCR', 'US NSFR', 'Enterprise NSFR', 'ILST'];
  
  queryInitialValues: Partial<QueryParams> = {};
  rowData: (FR2052AData | USLCRData | SummaryRowData)[] = [];
  columnDefs: (ColDef | ColGroupDef)[] = [];
  fr2052aData: FR2052AData[] = [];
  usLcrData: USLCRData[] = [];
  
  // Summary table data structures
  depositNodes: Map<string, DepositNode> = new Map();
  depositData: Map<string, DepositData> = new Map();
  summaryRowData: SummaryRowData[] = [];
  expandedNodes = new Set<string>();
  collapsedHeaders = new Set<string>(); // For US LCR
  
  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: false,
    floatingFilter: false
  };

  selectedProduct: any | null = null;
  commentaryOpen = false;
  historyComments: Commentary[] = [];
  gridApi: any;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // 初始化列定义
    this.initSummaryColumns();
    // 加载 Summary 数据
    this.loadSummaryData();
    // 加载 FR2052A 数据
    this.loadFR2052AData();
    // 加载 US LCR 数据
    this.loadUSLCRData();
    // 更新显示的数据
    this.updateSummaryDisplayedData();
    
    // 监听路由参数变化
    this.route.queryParams.subscribe(params => {
      this.queryInitialValues = {
        region: params['region'] || '',
        segment: params['segment'] || '',
        prior: params['prior'] ? new Date(params['prior']) : null,
        current: params['current'] ? new Date(params['current']) : null
      };
    });
  }
  
  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'Summary') {
      this.initSummaryColumns();
      this.updateSummaryDisplayedData();
    } else if (tab === 'FR2052A') {
      this.initFR2052AColumns();
      this.rowData = [...this.fr2052aData];
    } else if (tab === 'US LCR') {
      this.initUSLCRColumns();
      this.updateUSLCRDisplayedData();
    } else {
      // 其他标签页暂时使用 Summary 的数据
      this.initSummaryColumns();
      this.updateSummaryDisplayedData();
    }
    
    // 如果表格已初始化，更新列定义和数据
    if (this.gridApi) {
      setTimeout(() => {
        this.gridApi.setColumnDefs(this.columnDefs);
        this.gridApi.setRowData(this.rowData || []);
      }, 0);
    }
  }

  private initUSLCRColumns(): void {
    // Helper function to create valueGetter for US LCR columns
    const createValueGetter = (field: string) => {
      return (params: any) => {
        const rowData = params.data as USLCRData;
        if (rowData?.isFirstRow) return null;
        return rowData?.[field as keyof USLCRData];
      };
    };

    this.columnDefs = [
      {
        field: 'counterparty',
        headerName: '',
        width: 300,
        pinned: 'left',
        lockPinned: true,
        headerClass: 'lcr-title-header',
        cellStyle: { textAlign: 'left' },
        cellClassRules: {
          'header-row-cell': (params: CellClassParams) => params.data?.isHeader
        },
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.data) return '';
          const rowData = params.data as USLCRData;
          // Hide first row content
          if (rowData.isFirstRow) {
            return '';
          }
          const indent = rowData.indentLevel || 0;
          const padding = indent * 20;
          const isCollapsed = this.collapsedHeaders.has(rowData.counterparty);
          const icon = rowData.isHeader 
            ? (isCollapsed ? 'add_box' : 'indeterminate_check_box')
            : '';
          const iconHtml = icon ? `<i class="material-icons" style="font-size: 15px; color: ${isCollapsed ? '#D0D0D0' : '#000000'}; margin-right: 8px; cursor: pointer;">${icon}</i>` : '';
          const displayValue = rowData.counterparty || params.value || 'N/A';
          return `<div style="display: flex; align-items: center; padding-left: ${padding}px;">
                    ${iconHtml}
                    <span>${displayValue}</span>
                  </div>`;
        },
        onCellClicked: (params) => {
          const rowData = params.data as USLCRData;
          if (rowData?.isHeader && !rowData.isFirstRow) {
            this.toggleUSLCRHeader(rowData.counterparty);
          }
        }
      },
      {
        headerName: 'Amount (in Millions CAD)',
        children: [
          {
            field: 'keyFactor',
            headerName: 'Key Factor',
            width: 200,
            cellStyle: { textAlign: 'left' },
            valueGetter: createValueGetter('keyFactor'),
            valueFormatter: (params: ValueFormatterParams) => {
              if ((params.data as USLCRData)?.isFirstRow) return '';
              return params.value || 'N/A';
            }
          },
          {
            field: 'lcrWeights',
            headerName: 'LCR Weights',
            width: 120,
            cellStyle: { textAlign: 'left' },
            valueGetter: createValueGetter('lcrWeights'),
            valueFormatter: (params: ValueFormatterParams) => {
              if ((params.data as USLCRData)?.isFirstRow) return '';
              return params.value || 'N/A';
            }
          },
          {
            field: 'ruleText',
            headerName: 'Rule Text',
            width: 250,
            cellStyle: { textAlign: 'left' },
            valueGetter: createValueGetter('ruleText'),
            valueFormatter: (params: ValueFormatterParams) => {
              if ((params.data as USLCRData)?.isFirstRow) return '';
              return params.value || 'N/A';
            }
          },
          {
            headerName: 'Notional',
            headerClass: 'segment-header-with-border',
            children: [
              {
                field: 'notionalPrev',
                headerName: 'Previous',
                width: 120,
                cellClass: 'segment-column-with-border',
                headerClass: 'segment-column-with-border',
                valueGetter: createValueGetter('notionalPrev'),
                valueFormatter: (params: ValueFormatterParams) => {
                  if ((params.data as USLCRData)?.isFirstRow) return '';
                  return this.formatNum(params);
                },
                cellStyle: { textAlign: 'right' }
              },
              {
                field: 'notionalCurr',
                headerName: 'Current',
                width: 120,
                valueGetter: createValueGetter('notionalCurr'),
                valueFormatter: (params: ValueFormatterParams) => {
                  if ((params.data as USLCRData)?.isFirstRow) return '';
                  return this.formatNum(params);
                },
                cellStyle: { textAlign: 'right' }
              },
              {
                field: 'notionalVar',
                headerName: 'Variance',
                width: 140,
                valueGetter: createValueGetter('notionalVar'),
                valueFormatter: (params: ValueFormatterParams) => {
                  if ((params.data as USLCRData)?.isFirstRow) return '';
                  return this.formatVariance(params);
                },
                cellStyle: { textAlign: 'right' },
                cellClassRules: {
                  'variance-up': (params: CellClassParams) => params.value > 0,
                  'variance-down': (params: CellClassParams) => params.value < 0
                }
              },
              {
                headerName: 'Action',
                width: 80,
                cellRenderer: (params: ICellRendererParams) => {
                  if ((params.data as USLCRData)?.isFirstRow) return '';
                  return `<div style="display: flex; align-items: center; justify-content: center; height: 100%;">
                           <i class="material-icons" style="color: #96A496; cursor: pointer; font-size: 18px;">chat_bubble_outline</i>
                         </div>`;
                }
              }
            ]
          },
          {
            headerName: 'NCO',
            headerClass: 'segment-header-with-border',
            children: [
              {
                field: 'ncoPrev',
                headerName: 'Previous',
                width: 120,
                cellClass: 'segment-column-with-border',
                headerClass: 'segment-column-with-border',
                valueGetter: createValueGetter('ncoPrev'),
                valueFormatter: (params: ValueFormatterParams) => {
                  if ((params.data as USLCRData)?.isFirstRow) return '';
                  return this.formatNum(params);
                },
                cellStyle: { textAlign: 'right' }
              },
              {
                field: 'ncoCurr',
                headerName: 'Current',
                width: 120,
                valueGetter: createValueGetter('ncoCurr'),
                valueFormatter: (params: ValueFormatterParams) => {
                  if ((params.data as USLCRData)?.isFirstRow) return '';
                  return this.formatNum(params);
                },
                cellStyle: { textAlign: 'right' }
              },
              {
                field: 'ncoVar',
                headerName: 'Variance',
                width: 140,
                valueGetter: createValueGetter('ncoVar'),
                valueFormatter: (params: ValueFormatterParams) => {
                  if ((params.data as USLCRData)?.isFirstRow) return '';
                  return this.formatVariance(params);
                },
                cellStyle: { textAlign: 'right' },
                cellClassRules: {
                  'variance-up': (params: CellClassParams) => params.value > 0,
                  'variance-down': (params: CellClassParams) => params.value < 0
                }
              },
              {
                headerName: 'Action',
                width: 80,
                cellRenderer: (params: ICellRendererParams) => {
                  if ((params.data as USLCRData)?.isFirstRow) return '';
                  return `<div style="display: flex; align-items: center; justify-content: center; height: 100%;">
                           <i class="material-icons" style="color: #96A496; cursor: pointer; font-size: 18px;">chat_bubble_outline</i>
                         </div>`;
                }
              }
            ]
          }
        ]
      }
    ];
  }

  formatNum(params: ValueFormatterParams) {
    if (params.value === undefined || params.value === null || params.value === '') {
      return '';
    }
    const val = Number(params.value);
    if (isNaN(val)) {
      return '';
    }
    return (val < 0 ? '-' : '') + Math.abs(val).toLocaleString();
  }

  formatVariance(params: ValueFormatterParams): string {
    if (params.value === undefined || params.value === null || params.value === '') {
      return '';
    }
    const val = Number(params.value);
    if (isNaN(val)) {
      return '';
    }
    const formatted = Math.abs(val).toLocaleString();
    const arrow = val > 0 ? '↑' : val < 0 ? '↓' : '';
    return `${formatted}${arrow ? ' ' + arrow : ''}`;
  }

  private initSummaryColumns(): void {
    // Helper function to create valueGetter for counterparty columns
    const createValueGetter = (counterparty: CounterpartyType, field: 'previous' | 'current' | 'variance') => {
      return (params: any) => {
        const rowData = params.data as SummaryRowData;
        return rowData?.counterparties?.[counterparty]?.[field];
      };
    };

    // Create segment columns similar to LCR structure
    const createSegmentColumns = (segmentName: string, counterparty: CounterpartyType, addLeftBorder: boolean = false) => {
      const borderClass = addLeftBorder ? 'segment-column-with-border' : '';
      return {
        headerName: segmentName,
        headerClass: addLeftBorder ? 'segment-header-with-border' : '',
        children: [
          {
            headerName: 'Previous',
            width: 120,
            cellClass: borderClass,
            headerClass: borderClass,
            valueGetter: createValueGetter(counterparty, 'previous'),
            valueFormatter: (params: ValueFormatterParams) => this.formatNum(params),
            cellStyle: { textAlign: 'right' }
          },
          {
            headerName: 'Current',
            width: 120,
            valueGetter: createValueGetter(counterparty, 'current'),
            valueFormatter: (params: ValueFormatterParams) => this.formatNum(params),
            cellStyle: { textAlign: 'right' }
          },
          {
            headerName: 'Variance',
            width: 140,
            valueGetter: createValueGetter(counterparty, 'variance'),
            valueFormatter: (params: ValueFormatterParams) => this.formatVariance(params),
            cellStyle: { textAlign: 'right' },
            cellClassRules: {
              'variance-up': (params: CellClassParams) => {
                const rowData = params.data as SummaryRowData;
                return rowData?.counterparties?.[counterparty]?.trend === 'UP';
              },
              'variance-down': (params: CellClassParams) => {
                const rowData = params.data as SummaryRowData;
                return rowData?.counterparties?.[counterparty]?.trend === 'DOWN';
              }
            }
          },
          {
            headerName: 'Action',
            width: 80,
            cellRenderer: () => `<div style="display: flex; align-items: center; justify-content: center; height: 100%;">
                                   <i class="material-icons" style="color: #96A496; cursor: pointer; font-size: 18px;">chat_bubble_outline</i>
                                 </div>`
          }
        ]
      };
    };

    this.columnDefs = [
      {
        field: 'name',
        headerName: '',
        width: 300,
        pinned: 'left',
        lockPinned: true,
        headerClass: 'lcr-title-header',
        cellStyle: { textAlign: 'left' },
        cellClassRules: {
          'header-row-cell': (params: CellClassParams) => !(params.data as SummaryRowData)?.isLeaf
        },
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.data) return '';
          const rowData = params.data as SummaryRowData;
          const padding = rowData.level * 20;
          const icon = !rowData.isLeaf 
            ? (rowData.isExpanded ? 'indeterminate_check_box' : 'add_box')
            : '';
          const iconHtml = icon ? `<i class="material-icons" style="font-size: 15px; color: ${rowData.isExpanded ? '#000000' : '#D0D0D0'}; margin-right: 8px; cursor: pointer;">${icon}</i>` : '';
          return `<div style="display: flex; align-items: center; padding-left: ${padding}px;">
                    ${iconHtml}
                    <span>${rowData.name || 'N/A'}</span>
                  </div>`;
        },
        onCellClicked: (params) => {
          const rowData = params.data as SummaryRowData;
          if (!rowData.isLeaf) {
            this.toggleSummaryNode(rowData.nodeId);
          }
        }
      },
      createSegmentColumns('Total', 'TOTAL', false),
      createSegmentColumns('Retail', 'RETAIL', true),
      createSegmentColumns('SME', 'SME', true),
      createSegmentColumns('Non-Financial', 'NON_FINANCIAL', true),
      createSegmentColumns('Pension Funds', 'PENSION_FUNDS', true),
      createSegmentColumns('Soverigns', 'SOVEREIGNS', true),
      createSegmentColumns('GSE/PSEs', 'GSE_PSE', true),
      createSegmentColumns('Bank', 'BANK', true),
      createSegmentColumns('Broker Dealers/FMUs', 'BROKER_DEALERS', true),
      createSegmentColumns('Investment Firms/Funds', 'INVESTMENT_FUNDS', true),
      createSegmentColumns('Other Financial Entities', 'OTHER_FINANCIAL', true)
    ];
  }

  // Initialize normalized data structure
  private initializeSummaryData(): void {
    // 1. Define product hierarchy (tree structure)
    const nodes: DepositNode[] = [
      { id: 'root', name: 'Deposits', parentId: null, level: 0, isLeaf: false, children: ['personal', 'non-personal', 'wholesale', 'pwm'] },
      { id: 'personal', name: 'Personal', parentId: 'root', level: 1, isLeaf: false, children: ['personal-demand', 'personal-cds', 'personal-savings', 'personal-third'] },
      { id: 'personal-demand', name: 'Demand Deposits (Checking)', parentId: 'personal', level: 2, isLeaf: true },
      { id: 'personal-cds', name: 'CDs/Term Deposits/GIC', parentId: 'personal', level: 2, isLeaf: true },
      { id: 'personal-savings', name: 'Savings Accounts', parentId: 'personal', level: 2, isLeaf: true },
      { id: 'personal-third', name: 'Third Party Deposits', parentId: 'personal', level: 2, isLeaf: true },
      { id: 'non-personal', name: 'Non-Personal', parentId: 'root', level: 1, isLeaf: false, children: ['non-personal-sweep', 'non-personal-brokered', 'non-personal-business'] },
      { id: 'non-personal-sweep', name: 'Sweep Accounts', parentId: 'non-personal', level: 2, isLeaf: true },
      { id: 'non-personal-brokered', name: 'Brokered CDs', parentId: 'non-personal', level: 2, isLeaf: true },
      { id: 'non-personal-business', name: 'Business Banking', parentId: 'non-personal', level: 2, isLeaf: true },
      { id: 'wholesale', name: 'Wholesale Deposits', parentId: 'root', level: 1, isLeaf: false, children: ['wholesale-cds', 'wholesale-term', 'wholesale-gtb'] },
      { id: 'wholesale-cds', name: 'CDs', parentId: 'wholesale', level: 2, isLeaf: true },
      { id: 'wholesale-term', name: 'Term Deposits', parentId: 'wholesale', level: 2, isLeaf: true },
      { id: 'wholesale-gtb', name: 'GTB', parentId: 'wholesale', level: 2, isLeaf: true },
      { id: 'pwm', name: 'PWM Deposits', parentId: 'root', level: 1, isLeaf: false, children: ['pwm-cds', 'pwm-term', 'pwm-demand', 'pwm-savings'] },
      { id: 'pwm-cds', name: 'CDs', parentId: 'pwm', level: 2, isLeaf: true },
      { id: 'pwm-term', name: 'Term Deposits', parentId: 'pwm', level: 2, isLeaf: true },
      { id: 'pwm-demand', name: 'Demand Deposits', parentId: 'pwm', level: 2, isLeaf: true },
      { id: 'pwm-savings', name: 'Savings', parentId: 'pwm', level: 2, isLeaf: true }
    ];

    // Build node map
    nodes.forEach(node => this.depositNodes.set(node.id, node));

    // 2. Define leaf node data (only leaf nodes have actual values)
    const leafData: DepositData[] = [
      {
        nodeId: 'personal-demand',
        values: [
          { counterparty: 'TOTAL', previous: 18500, current: 18800 },
          { counterparty: 'RETAIL', previous: 18500, current: 18800 },
          { counterparty: 'SME', previous: 18500, current: 18800 },
          { counterparty: 'NON_FINANCIAL', previous: 18500, current: 18800 },
          { counterparty: 'PENSION_FUNDS', previous: 18500, current: 18800 },
          { counterparty: 'SOVEREIGNS', previous: 18500, current: 18800 },
          { counterparty: 'GSE_PSE', previous: 18500, current: 18800 },
          { counterparty: 'BANK', previous: 18500, current: 18800 },
          { counterparty: 'BROKER_DEALERS', previous: 18500, current: 18800 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 18500, current: 18800 },
          { counterparty: 'OTHER_FINANCIAL', previous: 18500, current: 18800 }
        ]
      },
      {
        nodeId: 'personal-cds',
        values: [
          { counterparty: 'TOTAL', previous: 94200, current: 93000 },
          { counterparty: 'RETAIL', previous: 94200, current: 93000 },
          { counterparty: 'SME', previous: 94200, current: 93000 },
          { counterparty: 'NON_FINANCIAL', previous: 94200, current: 93000 },
          { counterparty: 'PENSION_FUNDS', previous: 94200, current: 93000 },
          { counterparty: 'SOVEREIGNS', previous: 94200, current: 93000 },
          { counterparty: 'GSE_PSE', previous: 94200, current: 93000 },
          { counterparty: 'BANK', previous: 94200, current: 93000 },
          { counterparty: 'BROKER_DEALERS', previous: 94200, current: 93000 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 94200, current: 93000 },
          { counterparty: 'OTHER_FINANCIAL', previous: 94200, current: 93000 }
        ]
      },
      {
        nodeId: 'personal-savings',
        values: [
          { counterparty: 'TOTAL', previous: 9500, current: 8700 },
          { counterparty: 'RETAIL', previous: 9500, current: 8700 },
          { counterparty: 'SME', previous: 9500, current: 8700 },
          { counterparty: 'NON_FINANCIAL', previous: 9500, current: 8700 },
          { counterparty: 'PENSION_FUNDS', previous: 9500, current: 8700 },
          { counterparty: 'SOVEREIGNS', previous: 9500, current: 8700 },
          { counterparty: 'GSE_PSE', previous: 9500, current: 8700 },
          { counterparty: 'BANK', previous: 9500, current: 8700 },
          { counterparty: 'BROKER_DEALERS', previous: 9500, current: 8700 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 9500, current: 8700 },
          { counterparty: 'OTHER_FINANCIAL', previous: 9500, current: 8700 }
        ]
      },
      {
        nodeId: 'personal-third',
        values: [
          { counterparty: 'TOTAL', previous: -5700, current: -1100 },
          { counterparty: 'RETAIL', previous: -5700, current: -1100 },
          { counterparty: 'SME', previous: -5700, current: -1100 },
          { counterparty: 'NON_FINANCIAL', previous: -5700, current: -1100 },
          { counterparty: 'PENSION_FUNDS', previous: -5700, current: -1100 },
          { counterparty: 'SOVEREIGNS', previous: -5700, current: -1100 },
          { counterparty: 'GSE_PSE', previous: -5700, current: -1100 },
          { counterparty: 'BANK', previous: -5700, current: -1100 },
          { counterparty: 'BROKER_DEALERS', previous: -5700, current: -1100 },
          { counterparty: 'INVESTMENT_FUNDS', previous: -5700, current: -1100 },
          { counterparty: 'OTHER_FINANCIAL', previous: -5700, current: -1100 }
        ]
      },
      {
        nodeId: 'non-personal-sweep',
        values: [
          { counterparty: 'TOTAL', previous: 18500, current: 18500 },
          { counterparty: 'RETAIL', previous: 18500, current: 18500 },
          { counterparty: 'SME', previous: 18500, current: 18500 },
          { counterparty: 'NON_FINANCIAL', previous: 18500, current: 18500 },
          { counterparty: 'PENSION_FUNDS', previous: 18500, current: 18500 },
          { counterparty: 'SOVEREIGNS', previous: 18500, current: 18500 },
          { counterparty: 'GSE_PSE', previous: 18500, current: 18500 },
          { counterparty: 'BANK', previous: 18500, current: 18500 },
          { counterparty: 'BROKER_DEALERS', previous: 18500, current: 18500 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 18500, current: 18500 },
          { counterparty: 'OTHER_FINANCIAL', previous: 18500, current: 18500 }
        ]
      },
      {
        nodeId: 'non-personal-brokered',
        values: [
          { counterparty: 'TOTAL', previous: 94200, current: 94200 },
          { counterparty: 'RETAIL', previous: 94200, current: 94200 },
          { counterparty: 'SME', previous: 94200, current: 94200 },
          { counterparty: 'NON_FINANCIAL', previous: 94200, current: 94200 },
          { counterparty: 'PENSION_FUNDS', previous: 94200, current: 94200 },
          { counterparty: 'SOVEREIGNS', previous: 94200, current: 94200 },
          { counterparty: 'GSE_PSE', previous: 94200, current: 94200 },
          { counterparty: 'BANK', previous: 94200, current: 94200 },
          { counterparty: 'BROKER_DEALERS', previous: 94200, current: 94200 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 94200, current: 94200 },
          { counterparty: 'OTHER_FINANCIAL', previous: 94200, current: 94200 }
        ]
      },
      {
        nodeId: 'non-personal-business',
        values: [
          { counterparty: 'TOTAL', previous: 9500, current: 9500 },
          { counterparty: 'RETAIL', previous: 9500, current: 9500 },
          { counterparty: 'SME', previous: 9500, current: 9500 },
          { counterparty: 'NON_FINANCIAL', previous: 9500, current: 9500 },
          { counterparty: 'PENSION_FUNDS', previous: 9500, current: 9500 },
          { counterparty: 'SOVEREIGNS', previous: 9500, current: 9500 },
          { counterparty: 'GSE_PSE', previous: 9500, current: 9500 },
          { counterparty: 'BANK', previous: 9500, current: 9500 },
          { counterparty: 'BROKER_DEALERS', previous: 9500, current: 9500 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 9500, current: 9500 },
          { counterparty: 'OTHER_FINANCIAL', previous: 9500, current: 9500 }
        ]
      },
      {
        nodeId: 'wholesale-cds',
        values: [
          { counterparty: 'TOTAL', previous: 22400, current: 22400 },
          { counterparty: 'RETAIL', previous: 22400, current: 22400 },
          { counterparty: 'SME', previous: 22400, current: 22400 },
          { counterparty: 'NON_FINANCIAL', previous: 22400, current: 22400 },
          { counterparty: 'PENSION_FUNDS', previous: 22400, current: 22400 },
          { counterparty: 'SOVEREIGNS', previous: 22400, current: 22400 },
          { counterparty: 'GSE_PSE', previous: 22400, current: 22400 },
          { counterparty: 'BANK', previous: 22400, current: 22400 },
          { counterparty: 'BROKER_DEALERS', previous: 22400, current: 22400 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 22400, current: 22400 },
          { counterparty: 'OTHER_FINANCIAL', previous: 22400, current: 22400 }
        ]
      },
      {
        nodeId: 'wholesale-term',
        values: [
          { counterparty: 'TOTAL', previous: 18500, current: 18500 },
          { counterparty: 'RETAIL', previous: 18500, current: 18500 },
          { counterparty: 'SME', previous: 18500, current: 18500 },
          { counterparty: 'NON_FINANCIAL', previous: 18500, current: 18500 },
          { counterparty: 'PENSION_FUNDS', previous: 18500, current: 18500 },
          { counterparty: 'SOVEREIGNS', previous: 18500, current: 18500 },
          { counterparty: 'GSE_PSE', previous: 18500, current: 18500 },
          { counterparty: 'BANK', previous: 18500, current: 18500 },
          { counterparty: 'BROKER_DEALERS', previous: 18500, current: 18500 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 18500, current: 18500 },
          { counterparty: 'OTHER_FINANCIAL', previous: 18500, current: 18500 }
        ]
      },
      {
        nodeId: 'wholesale-gtb',
        values: [
          { counterparty: 'TOTAL', previous: 94200, current: 94200 },
          { counterparty: 'RETAIL', previous: 94200, current: 94200 },
          { counterparty: 'SME', previous: 94200, current: 94200 },
          { counterparty: 'NON_FINANCIAL', previous: 94200, current: 94200 },
          { counterparty: 'PENSION_FUNDS', previous: 94200, current: 94200 },
          { counterparty: 'SOVEREIGNS', previous: 94200, current: 94200 },
          { counterparty: 'GSE_PSE', previous: 94200, current: 94200 },
          { counterparty: 'BANK', previous: 94200, current: 94200 },
          { counterparty: 'BROKER_DEALERS', previous: 94200, current: 94200 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 94200, current: 94200 },
          { counterparty: 'OTHER_FINANCIAL', previous: 94200, current: 94200 }
        ]
      },
      {
        nodeId: 'pwm-cds',
        values: [
          { counterparty: 'TOTAL', previous: 18500, current: 18800 },
          { counterparty: 'RETAIL', previous: 18500, current: 18800 },
          { counterparty: 'SME', previous: 18500, current: 18800 },
          { counterparty: 'NON_FINANCIAL', previous: 18500, current: 18800 },
          { counterparty: 'PENSION_FUNDS', previous: 18500, current: 18800 },
          { counterparty: 'SOVEREIGNS', previous: 18500, current: 18800 },
          { counterparty: 'GSE_PSE', previous: 18500, current: 18800 },
          { counterparty: 'BANK', previous: 18500, current: 18800 },
          { counterparty: 'BROKER_DEALERS', previous: 18500, current: 18800 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 18500, current: 18800 },
          { counterparty: 'OTHER_FINANCIAL', previous: 18500, current: 18800 }
        ]
      },
      {
        nodeId: 'pwm-term',
        values: [
          { counterparty: 'TOTAL', previous: 94200, current: 93000 },
          { counterparty: 'RETAIL', previous: 94200, current: 93000 },
          { counterparty: 'SME', previous: 94200, current: 93000 },
          { counterparty: 'NON_FINANCIAL', previous: 94200, current: 93000 },
          { counterparty: 'PENSION_FUNDS', previous: 94200, current: 93000 },
          { counterparty: 'SOVEREIGNS', previous: 94200, current: 93000 },
          { counterparty: 'GSE_PSE', previous: 94200, current: 93000 },
          { counterparty: 'BANK', previous: 94200, current: 93000 },
          { counterparty: 'BROKER_DEALERS', previous: 94200, current: 93000 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 94200, current: 93000 },
          { counterparty: 'OTHER_FINANCIAL', previous: 94200, current: 93000 }
        ]
      },
      {
        nodeId: 'pwm-demand',
        values: [
          { counterparty: 'TOTAL', previous: 9500, current: 8700 },
          { counterparty: 'RETAIL', previous: 9500, current: 8700 },
          { counterparty: 'SME', previous: 9500, current: 8700 },
          { counterparty: 'NON_FINANCIAL', previous: 9500, current: 8700 },
          { counterparty: 'PENSION_FUNDS', previous: 9500, current: 8700 },
          { counterparty: 'SOVEREIGNS', previous: 9500, current: 8700 },
          { counterparty: 'GSE_PSE', previous: 9500, current: 8700 },
          { counterparty: 'BANK', previous: 9500, current: 8700 },
          { counterparty: 'BROKER_DEALERS', previous: 9500, current: 8700 },
          { counterparty: 'INVESTMENT_FUNDS', previous: 9500, current: 8700 },
          { counterparty: 'OTHER_FINANCIAL', previous: 9500, current: 8700 }
        ]
      },
      {
        nodeId: 'pwm-savings',
        values: [
          { counterparty: 'TOTAL', previous: -5700, current: -1100 },
          { counterparty: 'RETAIL', previous: -5700, current: -1100 },
          { counterparty: 'SME', previous: -5700, current: -1100 },
          { counterparty: 'NON_FINANCIAL', previous: -5700, current: -1100 },
          { counterparty: 'PENSION_FUNDS', previous: -5700, current: -1100 },
          { counterparty: 'SOVEREIGNS', previous: -5700, current: -1100 },
          { counterparty: 'GSE_PSE', previous: -5700, current: -1100 },
          { counterparty: 'BANK', previous: -5700, current: -1100 },
          { counterparty: 'BROKER_DEALERS', previous: -5700, current: -1100 },
          { counterparty: 'INVESTMENT_FUNDS', previous: -5700, current: -1100 },
          { counterparty: 'OTHER_FINANCIAL', previous: -5700, current: -1100 }
        ]
      }
    ];

    // Build data map
    leafData.forEach(data => this.depositData.set(data.nodeId, data));

    // 3. Calculate aggregated values for parent nodes
    this.calculateAggregations();

    // 4. Build display rows (default: all nodes expanded)
    this.expandedNodes.clear();
    // Expand all nodes by default
    nodes.forEach(node => {
      if (!node.isLeaf) {
        this.expandedNodes.add(node.id);
      }
    });
    this.buildSummaryRows();
  }

  // Calculate aggregated values for parent nodes
  private calculateAggregations(): void {
    const calculateNode = (nodeId: string): Map<CounterpartyType, { previous: number; current: number }> => {
      const node = this.depositNodes.get(nodeId);
      if (!node) return new Map();

      if (node.isLeaf) {
        // Leaf node: get values from data
        const data = this.depositData.get(nodeId);
        const result = new Map<CounterpartyType, { previous: number; current: number }>();
        if (data) {
          data.values.forEach(val => {
            result.set(val.counterparty, { previous: val.previous, current: val.current });
          });
        }
        return result;
      } else {
        // Parent node: aggregate from children
        const result = new Map<CounterpartyType, { previous: number; current: number }>();
        if (node.children) {
          node.children.forEach(childId => {
            const childValues = calculateNode(childId);
            childValues.forEach((val, counterparty) => {
              const existing = result.get(counterparty) || { previous: 0, current: 0 };
              result.set(counterparty, {
                previous: existing.previous + val.previous,
                current: existing.current + val.current
              });
            });
          });
        }
        // Store aggregated data for parent nodes
        const aggregatedData: DepositData = {
          nodeId,
          values: Array.from(result.entries()).map(([counterparty, val]) => ({
            counterparty,
            previous: val.previous,
            current: val.current
          }))
        };
        this.depositData.set(nodeId, aggregatedData);
        return result;
      }
    };

    // Calculate from root
    calculateNode('root');
  }

  // Build display rows from normalized data
  private buildSummaryRows(): void {
    const buildRows = (nodeId: string, parentExpanded: boolean = true): SummaryRowData[] => {
      const node = this.depositNodes.get(nodeId);
      if (!node) return [];

      const isExpanded = this.expandedNodes.has(nodeId);
      const shouldShow = parentExpanded;
      const rows: SummaryRowData[] = [];

      if (shouldShow) {
        const data = this.depositData.get(nodeId);
        const counterparties: SummaryRowData['counterparties'] = {};

        if (data) {
          data.values.forEach(val => {
            const variance = val.current - val.previous;
            let trend: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
            if (variance > 0) trend = 'UP';
            else if (variance < 0) trend = 'DOWN';

            counterparties[val.counterparty] = {
              previous: val.previous,
              current: val.current,
              variance,
              trend
            };
          });
        }

        rows.push({
          nodeId,
          name: node.name,
          level: node.level,
          isExpanded,
          isLeaf: node.isLeaf,
          counterparties
        });

        // Add children if expanded
        if (isExpanded && node.children) {
          node.children.forEach(childId => {
            rows.push(...buildRows(childId, true));
          });
        }
      }

      return rows;
    };

    this.summaryRowData = buildRows('root');
  }

  // Load summary data (wrapper for initialization)
  private loadSummaryData(): void {
    this.initializeSummaryData();
  }

  toggleSummaryNode(nodeId: string): void {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
    this.buildSummaryRows();
    this.updateSummaryDisplayedData();
  }

  private updateSummaryDisplayedData(): void {
    this.rowData = [...this.summaryRowData];
    if (this.gridApi) {
      setTimeout(() => {
        this.gridApi.setRowData(this.rowData);
      }, 0);
    }
  }

  onQuery(params: QueryParams): void {
    // 重新加载当前标签页的数据
    if (this.activeTab === 'Summary') {
      this.loadSummaryData();
      this.updateSummaryDisplayedData();
    } else if (this.activeTab === 'FR2052A') {
      this.loadFR2052AData();
      this.rowData = [...this.fr2052aData];
      if (this.gridApi) {
        this.gridApi.setRowData(this.rowData);
      }
    } else if (this.activeTab === 'US LCR') {
      this.loadUSLCRData();
      this.updateUSLCRDisplayedData();
    }
  }

  onReset(): void {
    // 重新加载当前标签页的数据
    if (this.activeTab === 'Summary') {
      this.loadSummaryData();
      this.updateSummaryDisplayedData();
    } else if (this.activeTab === 'FR2052A') {
      this.loadFR2052AData();
      this.rowData = [...this.fr2052aData];
      if (this.gridApi) {
        this.gridApi.setRowData(this.rowData);
      }
    } else if (this.activeTab === 'US LCR') {
      this.loadUSLCRData();
      this.updateUSLCRDisplayedData();
    }
  }

  private openCommentary(product: any): void {
    this.selectedProduct = product;
    this.commentaryOpen = true;
  }

  closeCommentary(): void {
    this.commentaryOpen = false;
  }

  saveCommentary(content: string): void {
    this.commentaryOpen = false;
  }

  onGridReady(params: any): void {
    this.gridApi = params.api;
    
    // 根据当前标签页设置数据和列定义
    if (this.activeTab === 'Summary') {
      this.initSummaryColumns();
      this.updateSummaryDisplayedData();
      params.api.setColumnDefs(this.columnDefs);
      params.api.setRowData(this.rowData);
    } else if (this.activeTab === 'FR2052A') {
      this.initFR2052AColumns();
      this.rowData = [...this.fr2052aData];
      params.api.setColumnDefs(this.columnDefs);
      params.api.setRowData(this.rowData);
    } else if (this.activeTab === 'US LCR') {
      this.initUSLCRColumns();
      this.updateUSLCRDisplayedData();
      params.api.setColumnDefs(this.columnDefs);
      params.api.setRowData(this.rowData);
    } else {
      // 其他标签页暂时使用 Summary 的数据
      this.initSummaryColumns();
      this.updateSummaryDisplayedData();
      params.api.setColumnDefs(this.columnDefs);
      params.api.setRowData(this.rowData);
    }
  }

  private initFR2052AColumns(): void {
    this.columnDefs = [
      {
        field: 'pid',
        headerName: 'Pid',
        width: 100,
        pinned: 'left',
        cellStyle: { textAlign: 'left' },
        cellClassRules: {
          'grand-total-row': (params: CellClassParams) => params.data?.isGrandTotal
        }
      },
      {
        field: 'product',
        headerName: 'Product',
        width: 400,
        pinned: 'left',
        cellStyle: { textAlign: 'left' },
        cellClassRules: {
          'grand-total-row': (params: CellClassParams) => params.data?.isGrandTotal
        }
      },
      {
        field: 'amount1',
        headerName: '6G Amount',
        width: 150,
        flex: 1,
        valueFormatter: (params: ValueFormatterParams) => this.formatCurrency(params),
        cellStyle: { textAlign: 'right' },
        cellClassRules: {
          'grand-total-row': (params: CellClassParams) => params.data?.isGrandTotal
        }
      },
      {
        field: 'amount2',
        headerName: '6G Amount',
        width: 150,
        flex: 1,
        valueFormatter: (params: ValueFormatterParams) => this.formatCurrency(params),
        cellStyle: { textAlign: 'right' },
        cellClassRules: {
          'grand-total-row': (params: CellClassParams) => params.data?.isGrandTotal
        }
      },
      {
        field: 'amount3',
        headerName: '6G Amount',
        width: 150,
        flex: 1,
        valueFormatter: (params: ValueFormatterParams) => this.formatCurrency(params),
        cellStyle: { textAlign: 'right' },
        cellClassRules: {
          'grand-total-row': (params: CellClassParams) => params.data?.isGrandTotal,
          'negative-amount': (params: CellClassParams) => params.value < 0
        }
      },
      {
        headerName: 'Action',
        width: 80,
        cellRenderer: () => `<div style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">
                               <i class="material-icons" style="color: #96A496; cursor: pointer; font-size: 18px;">more_vert</i>
                             </div>`,
        cellClassRules: {
          'grand-total-row': (params: CellClassParams) => params.data?.isGrandTotal
        }
      }
    ];
  }

  private loadFR2052AData(): void {
    this.fr2052aData = [
      { pid: 'O.D.1', product: 'Transactional Accounts', amount1: 137199, amount2: 137162, amount3: 37 },
      { pid: 'O.D.2', product: 'Non-Transactional Relationship Accounts', amount1: 271, amount2: 271, amount3: 178 },
      { pid: 'O.D.3', product: 'Non-Transactional Non-Relationship Accounts', amount1: 20487, amount2: 20564, amount3: 124 },
      { pid: 'O.D.4', product: 'Operational Account Balances', amount1: 23126, amount2: 23786, amount3: -33 },
      { pid: 'O.D.5', product: 'Excess Balances in Operational Accounts', amount1: 25104, amount2: 25058, amount3: 277 },
      { pid: 'O.D.6', product: 'Non-Operational Account Balances', amount1: 3558, amount2: 3458, amount3: 0 },
      { pid: 'O.D.7', product: 'Operational Escrow Accounts', amount1: 45799, amount2: 45833, amount3: 3 },
      { pid: 'O.D.8', product: 'Non-Reciprocal Brokered Deposits', amount1: 79891, amount2: 79054, amount3: -24 },
      { pid: 'O.D.10', product: 'Less Stable Affiliated Sweep Account Balances', amount1: 37745, amount2: 37842, amount3: 100 },
      { pid: 'O.D.11', product: 'Non-Affiliated Sweep Accounts', amount1: 45799, amount2: 45268, amount3: 50 },
      { pid: 'O.D.14', product: 'Other Third-Party Deposits', amount1: 0, amount2: 0, amount3: 0 },
      { pid: 'O.W.16', product: 'Wholesale CDs', amount1: 79891, amount2: 79272, amount3: 67 },
      { pid: 'S.L.4', product: 'Non-Structured Debt Maturing in Greater than 30-d', amount1: 37745, amount2: 37728, amount3: 33 },
      { pid: '', product: 'Grand Total', amount1: 460962, amount2: 460962, amount3: 3551, isGrandTotal: true }
    ];
  }

  formatCurrency(params: ValueFormatterParams): string {
    if (params.value === undefined || params.value === null) return '$0';
    const val = params.value;
    const sign = val < 0 ? '-' : '';
    return sign + '$' + Math.abs(val).toLocaleString();
  }

  private loadUSLCRData(): void {
    this.usLcrData = [
      // Personal
      { counterparty: 'Personal', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 22400, notionalCurr: 16800, notionalVar: 5600, ncoPrev: 22400, ncoCurr: 16800, ncoVar: 5600, isHeader: true, hasIcon: 'minus' },
      { counterparty: 'Demand Deposits (Checking)', keyFactor: 'N/A', lcrWeights: '3%', ruleText: 'N/A', notionalPrev: 18500, notionalCurr: 18800, notionalVar: -300, ncoPrev: 18500, ncoCurr: 18800, ncoVar: -300, indentLevel: 1 },
      { counterparty: 'CDs/Term Deposits/GIC', keyFactor: 'N/A', lcrWeights: '10%', ruleText: 'N/A', notionalPrev: 94200, notionalCurr: 93000, notionalVar: 1200, ncoPrev: 94200, ncoCurr: 93000, ncoVar: 1200, indentLevel: 1 },
      { counterparty: 'Savings Accounts', keyFactor: 'N/A', lcrWeights: '3%', ruleText: 'N/A', notionalPrev: 9500, notionalCurr: 8700, notionalVar: 800, ncoPrev: 9500, ncoCurr: 8700, ncoVar: 800, indentLevel: 1 },
      { counterparty: 'Third Party Deposits', keyFactor: 'N/A', lcrWeights: '10%', ruleText: 'N/A', notionalPrev: -5700, notionalCurr: -1100, notionalVar: -4600, ncoPrev: -5700, ncoCurr: -1100, ncoVar: -4600, indentLevel: 1 },
      
      // Non-Personal
      { counterparty: 'Non-Personal', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 45000, notionalCurr: 45200, notionalVar: -200, ncoPrev: 45000, ncoCurr: 45200, ncoVar: -200, isHeader: true, hasIcon: 'minus' },
      { counterparty: 'Sweep Accounts', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 18500, notionalCurr: 18500, notionalVar: 0, ncoPrev: 18500, ncoCurr: 18500, ncoVar: 0, indentLevel: 1 },
      { counterparty: 'Brokered CDs', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 94200, notionalCurr: 94200, notionalVar: 0, ncoPrev: 94200, ncoCurr: 94200, ncoVar: 0, indentLevel: 1 },
      { counterparty: 'Business Banking', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 12000, notionalCurr: 12500, notionalVar: -500, ncoPrev: 12000, ncoCurr: 12500, ncoVar: -500, indentLevel: 1 },
      
      // Wholesale Deposits
      { counterparty: 'Wholesale Deposits', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 8800, notionalCurr: 8800, notionalVar: 0, ncoPrev: 8800, ncoCurr: 8800, ncoVar: 0, isHeader: true, hasIcon: 'minus' },
      { counterparty: 'CDs', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 22400, notionalCurr: 22400, notionalVar: 0, ncoPrev: 22400, ncoCurr: 22400, ncoVar: 0, indentLevel: 1 },
      { counterparty: 'Term Deposits', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 18500, notionalCurr: 18500, notionalVar: 0, ncoPrev: 18500, ncoCurr: 18500, ncoVar: 0, indentLevel: 1 },
      { counterparty: 'GTB', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 94200, notionalCurr: 94200, notionalVar: 0, ncoPrev: 94200, ncoCurr: 94200, ncoVar: 0, indentLevel: 1 },
      
      // a. Operational
      { counterparty: 'a. Operational', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, isHeader: true, hasIcon: 'minus', indentLevel: 1 },
      { counterparty: 'Retail/SME', keyFactor: 'Insured', lcrWeights: '5%', ruleText: '12 CFR 249.32(h)(3)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Retail/SME', keyFactor: 'Partial or Uninsured', lcrWeights: '25%', ruleText: '12 CFR 249.32(h)(4)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Bank', keyFactor: 'Insured', lcrWeights: '5%', ruleText: '12 CFR 249.32(h)(3)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Bank', keyFactor: 'Partial or Uninsured', lcrWeights: '25%', ruleText: '12 CFR 249.32(h)(4)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Broker Dealers', keyFactor: 'Insured', lcrWeights: '5%', ruleText: '12 CFR 249.32(h)(3)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Broker Dealers', keyFactor: 'Partial or Uninsured', lcrWeights: '25%', ruleText: '12 CFR 249.32(h)(4)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'IA/FMUs/Funds', keyFactor: 'Insured', lcrWeights: '5%', ruleText: '12 CFR 249.32(h)(3)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'IA/FMUs/Funds', keyFactor: 'Partial or Uninsured', lcrWeights: '25%', ruleText: '12 CFR 249.32(h)(4)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Pension Funds', keyFactor: 'Insured', lcrWeights: '5%', ruleText: '12 CFR 249.32(h)(3)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Pension Funds', keyFactor: 'Partial or Uninsured', lcrWeights: '25%', ruleText: '12 CFR 249.32(h)(4)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'PSE/GSE/MDBs', keyFactor: 'Insured', lcrWeights: '5%', ruleText: '12 CFR 249.32(h)(3)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'PSE/GSE/MDBs', keyFactor: 'Partial or Uninsured', lcrWeights: '25%', ruleText: '12 CFR 249.32(h)(4)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      
      // B. Operational Excess Balance
      { counterparty: 'B. Operational Excess Balance', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, isHeader: true, hasIcon: 'minus', indentLevel: 1 },
      { counterparty: 'Retail/SME', keyFactor: 'Insured', lcrWeights: '5%', ruleText: '12 CFR 249.32(h)(1)(i)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Retail/SME', keyFactor: 'Partial or Uninsured', lcrWeights: '25%', ruleText: '12 CFR 249.32(h)(1)(ii)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Bank', keyFactor: 'N/A', lcrWeights: '100%', ruleText: '12 CFR 249.32(h)(2)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Broker Dealers', keyFactor: 'N/A', lcrWeights: '100%', ruleText: '12 CFR 249.32(h)(2)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'IA/FMUs/Funds', keyFactor: 'N/A', lcrWeights: '100%', ruleText: '12 CFR 249.32(h)(2)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Pension Funds', keyFactor: 'N/A', lcrWeights: '40%', ruleText: '12 CFR 249.32(h)(1)(ii)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'PSE/GSE/MDBs', keyFactor: 'N/A', lcrWeights: '20%', ruleText: '12 CFR 249.32(h)(1)(i)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      { counterparty: 'Non-Financial Corp', keyFactor: 'N/A', lcrWeights: '40%', ruleText: '12 CFR 249.32(h)(1)(ii)', notionalPrev: 0, notionalCurr: 0, notionalVar: 0, ncoPrev: 0, ncoCurr: 0, ncoVar: 0, indentLevel: 2 },
      
      // PWM Deposits
      { counterparty: 'PWM Deposits', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 15000, notionalCurr: 18500, notionalVar: -3500, ncoPrev: 15000, ncoCurr: 18500, ncoVar: -3500, isHeader: true, hasIcon: 'minus' },
      { counterparty: 'CDs', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 18500, notionalCurr: 18800, notionalVar: -300, ncoPrev: 18500, ncoCurr: 18800, ncoVar: -300, indentLevel: 1 },
      { counterparty: 'Term Deposits', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 94200, notionalCurr: 93000, notionalVar: 1200, ncoPrev: 94200, ncoCurr: 93000, ncoVar: 1200, indentLevel: 1 },
      { counterparty: 'Demand Deposits', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: 9500, notionalCurr: 8700, notionalVar: 800, ncoPrev: 9500, ncoCurr: 8700, ncoVar: 800, indentLevel: 1 },
      { counterparty: 'Savings', keyFactor: 'N/A', lcrWeights: 'N/A', ruleText: 'N/A', notionalPrev: -5700, notionalCurr: -1100, notionalVar: -4600, ncoPrev: -5700, ncoCurr: -1100, ncoVar: -4600, indentLevel: 1 }
    ];
  }

  toggleUSLCRHeader(counterparty: string): void {
    if (this.collapsedHeaders.has(counterparty)) {
      this.collapsedHeaders.delete(counterparty);
    } else {
      this.collapsedHeaders.add(counterparty);
    }
    this.updateUSLCRDisplayedData();
  }

  private updateUSLCRDisplayedData(): void {
    if (!this.usLcrData || this.usLcrData.length === 0) {
      this.rowData = [];
      if (this.gridApi) {
        this.gridApi.setRowData([]);
      }
      return;
    }
    
    const displayed: USLCRData[] = [];
    let currentHeaderCollapsed = false;

    this.usLcrData.forEach((row, index) => {
      // Skip the first row (index 0) completely
      if (index === 0) {
        return;
      }
      
      if (row.isHeader) {
        currentHeaderCollapsed = this.collapsedHeaders.has(row.counterparty);
        displayed.push({ ...row });
      } else if (!currentHeaderCollapsed) {
        displayed.push({ ...row });
      }
    });

    this.rowData = [...displayed];
    
    if (this.gridApi) {
      setTimeout(() => {
        this.gridApi.setRowData(this.rowData);
      }, 0);
    }
  }
}
