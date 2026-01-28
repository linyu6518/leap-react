import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef, ColGroupDef, CellClassParams, ICellRendererParams, ValueFormatterParams, IHeaderParams } from 'ag-grid-community';
import { QueryParams } from '@shared/components/query-panel/query-panel.component';

interface LCRRowData {
  nodeId: string;
  name: string;
  level: number;
  isExpanded: boolean;
  isLeaf: boolean;
  // Values for each segment and date
  enterprise: {
    prior: number;
    current: number;
    variance: number;
  };
  cadRetail: {
    prior: number;
    current: number;
    variance: number;
  };
  wholesale: {
    prior: number;
    current: number;
    variance: number;
  };
  usRetail: {
    prior: number;
    current: number;
    variance: number;
  };
}

@Component({
  selector: 'app-lcr-detail',
  templateUrl: './lcr-detail.component.html',
  styleUrls: ['./lcr-detail.component.scss']
})
export class LcrDetailComponent implements OnInit {
  queryInitialValues: Partial<QueryParams> = {};
  rowData: LCRRowData[] = [];
  columnDefs: (ColDef | ColGroupDef)[] = [];
  
  // Metric cards data
  lcrRatio = { value: 128.2, change: -0.2, trend: 'down' };
  totalHQLA = { value: 33671, change: 0, trend: 'down' };
  totalNCO = { value: 12671, change: 0, trend: 'up' };

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: false,
    floatingFilter: false
  };

  gridApi: any;
  expandedNodes = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get query params
    this.route.queryParams.subscribe(params => {
      if (params['enterprise'] || params['region']) {
        this.queryInitialValues = {
          region: params['enterprise'] || params['region'] || null,
          segment: params['segment'] || null,
          prior: params['prior'] ? new Date(params['prior']) : null,
          current: params['current'] ? new Date(params['current']) : null
        };
      }
    });

    this.initColumns();
    this.loadData();
    // Initialize expanded nodes
    this.rowData.forEach(node => {
      if (node.isExpanded) {
        this.expandedNodes.add(node.nodeId);
      }
    });
    this.updateDisplayedRows();
  }

  onQuery(params: QueryParams): void {
    this.router.navigate(['/regulatory/lcr/detail'], {
      queryParams: {
        enterprise: params.region,
        segment: params.segment,
        prior: params.prior ? params.prior.toISOString() : '',
        current: params.current ? params.current.toISOString() : ''
      }
    });
    this.loadData();
  }

  onReset(): void {
    this.router.navigate(['/regulatory/lcr/detail']);
    this.queryInitialValues = {};
    this.loadData();
  }

  private initColumns(): void {
    const createSegmentColumns = (segmentName: string, fieldPrefix: string, addLeftBorder: boolean = false) => {
      const borderClass = addLeftBorder ? 'segment-column-with-border' : '';
      return {
        headerName: segmentName,
        headerClass: addLeftBorder ? 'segment-header-with-border' : '',
        children: [
          {
            field: `${fieldPrefix}Prior`,
            headerName: '31-Aug',
            width: 120,
            cellClass: borderClass,
            headerClass: borderClass,
            valueGetter: (params: any) => {
              const row = params.data as LCRRowData;
              if (fieldPrefix === 'enterprise') return row?.enterprise?.prior;
              if (fieldPrefix === 'cadRetail') return row?.cadRetail?.prior;
              if (fieldPrefix === 'wholesale') return row?.wholesale?.prior;
              if (fieldPrefix === 'usRetail') return row?.usRetail?.prior;
              return null;
            },
            valueFormatter: (params: ValueFormatterParams) => this.formatNum(params),
            cellStyle: { textAlign: 'right' }
          },
          {
            field: `${fieldPrefix}Current`,
            headerName: '29-Sep',
            width: 120,
            valueGetter: (params: any) => {
              const row = params.data as LCRRowData;
              if (fieldPrefix === 'enterprise') return row?.enterprise?.current;
              if (fieldPrefix === 'cadRetail') return row?.cadRetail?.current;
              if (fieldPrefix === 'wholesale') return row?.wholesale?.current;
              if (fieldPrefix === 'usRetail') return row?.usRetail?.current;
              return null;
            },
            valueFormatter: (params: ValueFormatterParams) => this.formatNum(params),
            cellStyle: { textAlign: 'right' }
          },
          {
            field: `${fieldPrefix}Variance`,
            headerName: 'Variance',
            width: 140,
            valueGetter: (params: any) => {
              const row = params.data as LCRRowData;
              if (fieldPrefix === 'enterprise') return row?.enterprise?.variance;
              if (fieldPrefix === 'cadRetail') return row?.cadRetail?.variance;
              if (fieldPrefix === 'wholesale') return row?.wholesale?.variance;
              if (fieldPrefix === 'usRetail') return row?.usRetail?.variance;
              return null;
            },
            valueFormatter: (params: ValueFormatterParams) => this.formatVariance(params),
            cellStyle: { textAlign: 'right' },
            cellClassRules: {
              'variance-up': (params: CellClassParams) => params.value > 0,
              'variance-down': (params: CellClassParams) => params.value < 0
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
          'header-row-cell': (params: CellClassParams) => !(params.data as LCRRowData)?.isLeaf,
          'summary-row': (params: CellClassParams) => {
            const row = params.data as LCRRowData;
            return row?.name === 'Net Cash Outflows' || row?.name === 'Surplus';
          }
        },
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.data) return '';
          const rowData = params.data as LCRRowData;
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
          const rowData = params.data as LCRRowData;
          if (!rowData.isLeaf) {
            this.toggleNode(rowData.nodeId);
          }
        }
      },
      createSegmentColumns('Enterprise', 'enterprise', false),
      createSegmentColumns('CAD Retail', 'cadRetail', true),
      createSegmentColumns('Wholesale', 'wholesale', true),
      createSegmentColumns('US Retail', 'usRetail', true)
    ];
  }

  private loadData(): void {
    // Mock data based on screenshot - complete all rows
    this.rowData = [
      {
        nodeId: 'lcr-ratio',
        name: 'LCR Ratio',
        level: 0,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 128.0, current: 128.2, variance: 0.2 },
        cadRetail: { prior: 120.0, current: 128.2, variance: 8.2 },
        wholesale: { prior: 140.0, current: 123.4, variance: -16.6 },
        usRetail: { prior: 130.0, current: 130.0, variance: 0 }
      },
      {
        nodeId: 'hqla',
        name: 'HQLA',
        level: 0,
        isExpanded: true,
        isLeaf: false,
        enterprise: { prior: 33000, current: 33671, variance: 671 },
        cadRetail: { prior: 15000, current: 15200, variance: 200 },
        wholesale: { prior: 12000, current: 12500, variance: 500 },
        usRetail: { prior: 6000, current: 5971, variance: -29 }
      },
      {
        nodeId: 'cash',
        name: 'Cash & Cash Equivalents',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 5000, current: 5100, variance: 100 },
        cadRetail: { prior: 2000, current: 2100, variance: 100 },
        wholesale: { prior: 2000, current: 2000, variance: 0 },
        usRetail: { prior: 1000, current: 1000, variance: 0 }
      },
      {
        nodeId: 'level1-nha',
        name: 'Level 1 - NHA MBS',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 15000, current: 14161, variance: -839 },
        cadRetail: { prior: 8000, current: 7500, variance: -500 },
        wholesale: { prior: 5000, current: 5000, variance: 0 },
        usRetail: { prior: 2000, current: 1661, variance: -339 }
      },
      {
        nodeId: 'level1-other',
        name: 'Level 1 - Other',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 8000, current: 8100, variance: 100 },
        cadRetail: { prior: 3000, current: 3100, variance: 100 },
        wholesale: { prior: 3000, current: 3000, variance: 0 },
        usRetail: { prior: 2000, current: 2000, variance: 0 }
      },
      {
        nodeId: 'level2a',
        name: 'Level 2a',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 3000, current: 3100, variance: 100 },
        cadRetail: { prior: 1000, current: 1100, variance: 100 },
        wholesale: { prior: 1000, current: 1000, variance: 0 },
        usRetail: { prior: 1000, current: 1000, variance: 0 }
      },
      {
        nodeId: 'level2b',
        name: 'Level 2b',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 2000, current: 2110, variance: 110 },
        cadRetail: { prior: 1000, current: 1500, variance: 500 },
        wholesale: { prior: 1000, current: 500, variance: -500 },
        usRetail: { prior: 0, current: 110, variance: 110 }
      },
      {
        nodeId: 'internal-funding',
        name: 'Internal Funding With TDS',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 0, current: 0, variance: 0 },
        cadRetail: { prior: 0, current: 0, variance: 0 },
        wholesale: { prior: 0, current: 0, variance: 0 },
        usRetail: { prior: 0, current: 0, variance: 0 }
      },
      {
        nodeId: 'nco',
        name: 'Net Cash Outflows',
        level: 0,
        isExpanded: true,
        isLeaf: false,
        enterprise: { prior: 25000, current: 26250, variance: 1250 },
        cadRetail: { prior: 12000, current: 11850, variance: -150 },
        wholesale: { prior: 10000, current: 10130, variance: 130 },
        usRetail: { prior: 3000, current: 4270, variance: 1270 }
      },
      {
        nodeId: 'deposits',
        name: 'Deposits',
        level: 1,
        isExpanded: true,
        isLeaf: false,
        enterprise: { prior: 49400, current: 49400, variance: 0 },
        cadRetail: { prior: 49400, current: 49400, variance: 0 },
        wholesale: { prior: 49400, current: 49400, variance: 0 },
        usRetail: { prior: 0, current: 0, variance: 0 }
      },
      {
        nodeId: 'withdrawal',
        name: 'Withdrawal',
        level: 2,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 15000, current: 15000, variance: 0 },
        cadRetail: { prior: 15000, current: 15000, variance: 0 },
        wholesale: { prior: 15000, current: 15000, variance: 0 },
        usRetail: { prior: 0, current: 0, variance: 0 }
      },
      {
        nodeId: 'buyback',
        name: 'BuyBack',
        level: 2,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 20000, current: 20000, variance: 0 },
        cadRetail: { prior: 20000, current: 20000, variance: 0 },
        wholesale: { prior: 20000, current: 20000, variance: 0 },
        usRetail: { prior: 0, current: 0, variance: 0 }
      },
      {
        nodeId: 'rollover',
        name: 'Rollover',
        level: 2,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 14400, current: 14400, variance: 0 },
        cadRetail: { prior: 14400, current: 14400, variance: 0 },
        wholesale: { prior: 14400, current: 14400, variance: 0 },
        usRetail: { prior: 0, current: 0, variance: 0 }
      },
      {
        nodeId: 'commitments',
        name: 'Commitments',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 5000, current: 5200, variance: 200 },
        cadRetail: { prior: 2000, current: 2100, variance: 100 },
        wholesale: { prior: 2000, current: 2100, variance: 100 },
        usRetail: { prior: 1000, current: 1000, variance: 0 }
      },
      {
        nodeId: 'loans',
        name: 'Loans',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 8000, current: 8200, variance: 200 },
        cadRetail: { prior: 3000, current: 3100, variance: 100 },
        wholesale: { prior: 4000, current: 4100, variance: 100 },
        usRetail: { prior: 1000, current: 1000, variance: 0 }
      },
      {
        nodeId: 'derivatives',
        name: 'Derivatives',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 3000, current: 3100, variance: 100 },
        cadRetail: { prior: 1000, current: 1100, variance: 100 },
        wholesale: { prior: 1500, current: 1500, variance: 0 },
        usRetail: { prior: 500, current: 500, variance: 0 }
      },
      {
        nodeId: 'unsecured',
        name: 'Unsecured',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 2000, current: 2100, variance: 100 },
        cadRetail: { prior: 800, current: 900, variance: 100 },
        wholesale: { prior: 1000, current: 1000, variance: 0 },
        usRetail: { prior: 200, current: 200, variance: 0 }
      },
      {
        nodeId: 'interaffiliate',
        name: 'Interaffiliate Funding',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 1000, current: 1050, variance: 50 },
        cadRetail: { prior: 400, current: 450, variance: 50 },
        wholesale: { prior: 500, current: 500, variance: 0 },
        usRetail: { prior: 100, current: 100, variance: 0 }
      },
      {
        nodeId: 'secured',
        name: 'Secured Funding',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 1500, current: 1600, variance: 100 },
        cadRetail: { prior: 600, current: 700, variance: 100 },
        wholesale: { prior: 700, current: 700, variance: 0 },
        usRetail: { prior: 200, current: 200, variance: 0 }
      },
      {
        nodeId: 'other-risks',
        name: 'Other Risks',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 500, current: 550, variance: 50 },
        cadRetail: { prior: 200, current: 250, variance: 50 },
        wholesale: { prior: 200, current: 200, variance: 0 },
        usRetail: { prior: 100, current: 100, variance: 0 }
      },
      {
        nodeId: 'prime-services',
        name: 'Prime Services',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 1000, current: 1000, variance: 0 },
        cadRetail: { prior: 0, current: 0, variance: 0 },
        wholesale: { prior: 1000, current: 1000, variance: 0 },
        usRetail: { prior: 0, current: 0, variance: 0 }
      },
      {
        nodeId: 'surplus',
        name: 'Surplus',
        level: 0,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 8000, current: 7421, variance: -579 },
        cadRetail: { prior: 3000, current: 3350, variance: 350 },
        wholesale: { prior: 2000, current: 2370, variance: 370 },
        usRetail: { prior: 3000, current: 1701, variance: -1299 }
      }
    ];
  }

  toggleNode(nodeId: string): void {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
    // Update row data
    const node = this.rowData.find(r => r.nodeId === nodeId);
    if (node) {
      node.isExpanded = this.expandedNodes.has(nodeId);
    }
    // Rebuild displayed rows based on expanded state
    this.updateDisplayedRows();
  }

  private updateDisplayedRows(): void {
    const displayedRows: LCRRowData[] = [];
    const parentExpandedStack: boolean[] = [true]; // Root level is always expanded
    
    for (let i = 0; i < this.rowData.length; i++) {
      const node = this.rowData[i];
      const currentLevel = node.level;
      
      // Update parent expanded stack
      while (parentExpandedStack.length > currentLevel + 1) {
        parentExpandedStack.pop();
      }
      
      // Check if parent is expanded (for non-root nodes)
      const parentExpanded = currentLevel === 0 || parentExpandedStack[currentLevel];
      
      if (parentExpanded) {
        const isExpanded = this.expandedNodes.has(node.nodeId);
        displayedRows.push({ ...node, isExpanded });
        
        // Update stack for next level
        if (currentLevel < parentExpandedStack.length) {
          parentExpandedStack[currentLevel + 1] = isExpanded && !node.isLeaf;
        } else {
          parentExpandedStack.push(isExpanded && !node.isLeaf);
        }
      }
    }
    
    if (this.gridApi) {
      this.gridApi.setRowData(displayedRows);
    }
  }

  formatNum(params: ValueFormatterParams): string {
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

  onGridReady(params: any): void {
    this.gridApi = params.api;
    // Update displayed rows after grid is ready
    setTimeout(() => {
      this.updateDisplayedRows();
    }, 0);
  }
}
