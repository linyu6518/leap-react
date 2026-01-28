import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef, ColGroupDef, CellClassParams, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { QueryParams } from '@shared/components/query-panel/query-panel.component';

interface NCCFRowData {
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
  selector: 'app-nccf-view',
  templateUrl: './nccf-view.component.html',
  styleUrls: ['./nccf-view.component.scss']
})
export class NccfViewComponent implements OnInit {
  queryInitialValues: Partial<QueryParams> = {};
  rowData: NCCFRowData[] = [];
  columnDefs: (ColDef | ColGroupDef)[] = [];
  
  // Metric cards data
  netCashOutflow = { value: 2150, change: 0, trend: 'down' };
  liquidityBuffer = { value: 3200, change: 0, trend: 'up' };
  coverageRatio = { value: 149, change: 3.4, trend: 'up' };

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
    this.router.navigate(['/regulatory/nccf'], {
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
    this.router.navigate(['/regulatory/nccf']);
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
              const row = params.data as NCCFRowData;
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
              const row = params.data as NCCFRowData;
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
              const row = params.data as NCCFRowData;
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
          'header-row-cell': (params: CellClassParams) => !(params.data as NCCFRowData)?.isLeaf
        },
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.data) return '';
          const rowData = params.data as NCCFRowData;
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
          const rowData = params.data as NCCFRowData;
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
    // Mock NCCF data
    this.rowData = [
      {
        nodeId: 'coverage-ratio',
        name: 'Coverage Ratio',
        level: 0,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 145.0, current: 149.0, variance: 4.0 },
        cadRetail: { prior: 150.0, current: 152.0, variance: 2.0 },
        wholesale: { prior: 140.0, current: 145.0, variance: 5.0 },
        usRetail: { prior: 148.0, current: 150.0, variance: 2.0 }
      },
      {
        nodeId: 'net-cash-outflow',
        name: 'Net Cash Capital Outflow',
        level: 0,
        isExpanded: true,
        isLeaf: false,
        enterprise: { prior: 2080, current: 2150, variance: 70 },
        cadRetail: { prior: 900, current: 950, variance: 50 },
        wholesale: { prior: 800, current: 850, variance: 50 },
        usRetail: { prior: 380, current: 350, variance: -30 }
      },
      {
        nodeId: 'expected-outflows',
        name: 'Expected Cash Outflows',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 2080, current: 2150, variance: 70 },
        cadRetail: { prior: 900, current: 950, variance: 50 },
        wholesale: { prior: 800, current: 850, variance: 50 },
        usRetail: { prior: 380, current: 350, variance: -30 }
      },
      {
        nodeId: 'expected-inflows',
        name: 'Expected Cash Inflows',
        level: 0,
        isExpanded: true,
        isLeaf: false,
        enterprise: { prior: 1920, current: 1850, variance: -70 },
        cadRetail: { prior: 850, current: 800, variance: -50 },
        wholesale: { prior: 750, current: 700, variance: -50 },
        usRetail: { prior: 320, current: 350, variance: 30 }
      },
      {
        nodeId: 'retail-inflows',
        name: 'Retail Inflows',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 1200, current: 1150, variance: -50 },
        cadRetail: { prior: 600, current: 550, variance: -50 },
        wholesale: { prior: 400, current: 400, variance: 0 },
        usRetail: { prior: 200, current: 200, variance: 0 }
      },
      {
        nodeId: 'corporate-inflows',
        name: 'Corporate Inflows',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 720, current: 700, variance: -20 },
        cadRetail: { prior: 250, current: 250, variance: 0 },
        wholesale: { prior: 350, current: 300, variance: -50 },
        usRetail: { prior: 120, current: 150, variance: 30 }
      },
      {
        nodeId: 'liquidity-buffer',
        name: 'Available Liquidity Buffer',
        level: 0,
        isExpanded: true,
        isLeaf: false,
        enterprise: { prior: 3100, current: 3200, variance: 100 },
        cadRetail: { prior: 1400, current: 1450, variance: 50 },
        wholesale: { prior: 1100, current: 1150, variance: 50 },
        usRetail: { prior: 600, current: 600, variance: 0 }
      },
      {
        nodeId: 'cash-reserves',
        name: 'Cash Reserves',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 1500, current: 1600, variance: 100 },
        cadRetail: { prior: 700, current: 750, variance: 50 },
        wholesale: { prior: 500, current: 550, variance: 50 },
        usRetail: { prior: 300, current: 300, variance: 0 }
      },
      {
        nodeId: 'marketable-securities',
        name: 'Marketable Securities',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 1600, current: 1600, variance: 0 },
        cadRetail: { prior: 700, current: 700, variance: 0 },
        wholesale: { prior: 600, current: 600, variance: 0 },
        usRetail: { prior: 300, current: 300, variance: 0 }
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
    const displayedRows: NCCFRowData[] = [];
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
