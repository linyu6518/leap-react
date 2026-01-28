import { Component, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { QueryParams } from '@shared/components/query-panel/query-panel.component';
import { Commentary } from '@shared/components/commentary-drawer/commentary-drawer.component';

interface ProductData {
  region: string;
  product: string;
  subProduct: string;
  current: number;
  prev: number;
  variance: number;
  threshold: number;
  commentary: string;
  status: 'draft' | 'pending' | 'approved';
}

@Component({
  selector: 'app-buyback',
  templateUrl: './buyback.component.html',
  styleUrls: ['./buyback.component.scss']
})
export class BuybackComponent implements OnInit {
  columnDefs: ColDef[] = [
    { field: 'region', headerName: 'Region', width: 120, filter: 'agTextColumnFilter' },
    { field: 'product', headerName: 'Product', width: 200 },
    { field: 'subProduct', headerName: 'Sub-Product', width: 180 },
    {
      field: 'current',
      headerName: 'Current',
      width: 140,
      valueFormatter: params => '$' + params.value.toLocaleString(),
      type: 'numericColumn'
    },
    {
      field: 'prev',
      headerName: 'Prev',
      width: 140,
      valueFormatter: params => '$' + params.value.toLocaleString(),
      type: 'numericColumn'
    },
    {
      field: 'variance',
      headerName: 'Variance',
      width: 140,
      valueFormatter: params => {
        const value = params.value;
        const formatted = '$' + Math.abs(value).toLocaleString();
        return value >= 0 ? formatted : '(' + formatted + ')';
      },
      type: 'numericColumn',
      cellClassRules: {
        'variance-alert': params => Math.abs(params.value) > params.data.threshold
      }
    },
    {
      field: 'threshold',
      headerName: 'Threshold',
      width: 120,
      valueFormatter: params => '$' + params.value.toLocaleString()
    },
    {
      headerName: 'Commentary',
      width: 120,
      cellRenderer: () => '<button class="commentary-btn"><i class="material-icons">comment</i></button>',
      onCellClicked: params => this.openCommentary(params.data)
    }
  ];

  rowData: ProductData[] = [];
  selectedProduct: ProductData | null = null;
  commentaryOpen = false;
  historyComments: Commentary[] = [];

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true
  };

  ngOnInit(): void {
    this.loadMockData();
  }

  onQuery(params: QueryParams): void {
    console.log('Query params:', params);
    // 实际应用中会调用API
    this.loadMockData();
  }

  onReset(): void {
    this.loadMockData();
  }

  private loadMockData(): void {
    // 模拟BuyBack产品数据
    this.rowData = Array.from({ length: 40 }, (_, i) => {
      const current = Math.floor(Math.random() * 2000000) + 500000;
      const prev = Math.floor(Math.random() * 2000000) + 500000;
      return {
        region: ['Americas', 'EMEA', 'APAC'][i % 3],
        product: `BuyBack Agreement ${i + 1}`,
        subProduct: `Type ${String.fromCharCode(65 + (i % 4))}`,
        current,
        prev,
        variance: current - prev,
        threshold: 100000,
        commentary: '',
        status: ['draft', 'pending', 'approved'][i % 3] as any
      };
    });
  }

  private openCommentary(product: ProductData): void {
    this.selectedProduct = product;
    this.historyComments = [
      {
        id: 1,
        user: 'Jane Smith',
        timestamp: new Date(Date.now() - 172800000),
        content: 'BuyBack variance reviewed - counterparty exposure within limits.'
      },
      {
        id: 2,
        user: 'Mike Johnson',
        timestamp: new Date(Date.now() - 86400000),
        content: 'Collateral requirements updated per latest agreement.'
      }
    ];
    this.commentaryOpen = true;
  }

  closeCommentary(): void {
    this.commentaryOpen = false;
    this.selectedProduct = null;
  }

  saveCommentary(content: string): void {
    console.log('Save commentary:', content, 'for product:', this.selectedProduct);
    this.commentaryOpen = false;
  }

  onGridReady(params: any): void {
    params.api.sizeColumnsToFit();
  }
}
