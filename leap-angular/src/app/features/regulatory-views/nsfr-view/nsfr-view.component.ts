import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef, ColGroupDef, CellClassParams, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { QueryParams } from '@shared/components/query-panel/query-panel.component';

interface NSFRRowData {
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
  selector: 'app-nsfr-view',
  templateUrl: './nsfr-view.component.html',
  styleUrls: ['./nsfr-view.component.scss']
})
export class NsfrViewComponent implements OnInit {
  queryInitialValues: Partial<QueryParams> = {};
  rowData: NSFRRowData[] = [];
  columnDefs: (ColDef | ColGroupDef)[] = [];
  
  // Metric cards data
  asf = { value: 8750, change: 0, trend: 'up' };
  rsf = { value: 7200, change: 0, trend: 'up' };
  nsfrRatio = { value: 121.5, change: 0.5, trend: 'up' };

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
    this.router.navigate(['/regulatory/nsfr'], {
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
    this.router.navigate(['/regulatory/nsfr']);
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
              const row = params.data as NSFRRowData;
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
              const row = params.data as NSFRRowData;
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
              const row = params.data as NSFRRowData;
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
          'header-row-cell': (params: CellClassParams) => !(params.data as NSFRRowData)?.isLeaf
        },
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.data) return '';
          const rowData = params.data as NSFRRowData;
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
          const rowData = params.data as NSFRRowData;
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
    // Mock NSFR data
    this.rowData = [
      {
        nodeId: 'nsfr-ratio',
        name: 'NSFR Ratio',
        level: 0,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 120.0, current: 121.5, variance: 1.5 },
        cadRetail: { prior: 118.0, current: 120.0, variance: 2.0 },
        wholesale: { prior: 125.0, current: 123.0, variance: -2.0 },
        usRetail: { prior: 122.0, current: 122.5, variance: 0.5 }
      },
      {
        nodeId: 'asf',
        name: 'ASF (Available Stable Funding)',
        level: 0,
        isExpanded: true,
        isLeaf: false,
        enterprise: { prior: 8500, current: 8750, variance: 250 },
        cadRetail: { prior: 3500, current: 3600, variance: 100 },
        wholesale: { prior: 3000, current: 3100, variance: 100 },
        usRetail: { prior: 2000, current: 2050, variance: 50 }
      },
      {
        nodeId: 'retail-deposits',
        name: 'Retail Deposits',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 3500, current: 3600, variance: 100 },
        cadRetail: { prior: 2000, current: 2100, variance: 100 },
        wholesale: { prior: 1000, current: 1000, variance: 0 },
        usRetail: { prior: 500, current: 500, variance: 0 }
      },
      {
        nodeId: 'corporate-lending',
        name: 'Corporate Lending',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 2800, current: 2900, variance: 100 },
        cadRetail: { prior: 1000, current: 1000, variance: 0 },
        wholesale: { prior: 1200, current: 1300, variance: 100 },
        usRetail: { prior: 600, current: 600, variance: 0 }
      },
      {
        nodeId: 'trading-assets',
        name: 'Trading Assets',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 950, current: 1000, variance: 50 },
        cadRetail: { prior: 500, current: 500, variance: 0 },
        wholesale: { prior: 800, current: 800, variance: 0 },
        usRetail: { prior: 900, current: 950, variance: 50 }
      },
      {
        nodeId: 'rsf',
        name: 'RSF (Required Stable Funding)',
        level: 0,
        isExpanded: true,
        isLeaf: false,
        enterprise: { prior: 7000, current: 7200, variance: 200 },
        cadRetail: { prior: 3000, current: 3000, variance: 0 },
        wholesale: { prior: 2400, current: 2520, variance: 120 },
        usRetail: { prior: 1600, current: 1680, variance: 80 }
      },
      {
        nodeId: 'retail-deposits-rsf',
        name: 'Retail Deposits',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 2800, current: 2880, variance: 80 },
        cadRetail: { prior: 1200, current: 1200, variance: 0 },
        wholesale: { prior: 800, current: 840, variance: 40 },
        usRetail: { prior: 800, current: 840, variance: 40 }
      },
      {
        nodeId: 'corporate-lending-rsf',
        name: 'Corporate Lending',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 2400, current: 2400, variance: 0 },
        cadRetail: { prior: 1000, current: 1000, variance: 0 },
        wholesale: { prior: 1000, current: 1000, variance: 0 },
        usRetail: { prior: 400, current: 400, variance: 0 }
      },
      {
        nodeId: 'trading-assets-rsf',
        name: 'Trading Assets',
        level: 1,
        isExpanded: false,
        isLeaf: true,
        enterprise: { prior: 800, current: 840, variance: 40 },
        cadRetail: { prior: 400, current: 400, variance: 0 },
        wholesale: { prior: 300, current: 340, variance: 40 },
        usRetail: { prior: 200, current: 200, variance: 0 }
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
    const displayedRows: NSFRRowData[] = [];
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
