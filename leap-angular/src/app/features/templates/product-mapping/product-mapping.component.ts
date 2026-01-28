import { Component, OnInit } from '@angular/core';

interface ProductMapping {
  id: number;
  internalProduct: string;
  regulatoryCategory: string;
  lcrTreatment: string;
  nsfrTreatment: string;
  outflowRate: number;
  active: boolean;
}

@Component({
  selector: 'app-product-mapping',
  templateUrl: './product-mapping.component.html',
  styleUrls: ['./product-mapping.component.scss']
})
export class ProductMappingComponent implements OnInit {
  displayedColumns: string[] = ['internalProduct', 'regulatoryCategory', 'lcrTreatment', 'nsfrTreatment', 'outflowRate', 'active', 'actions'];

  mappings: ProductMapping[] = [];
  editingRow: ProductMapping | null = null;

  lcrTreatments = [
    'Operational Deposits',
    'Stable Retail Deposits',
    'Less Stable Retail Deposits',
    'Unsecured Wholesale Funding',
    'Secured Funding'
  ];

  nsfrTreatments = [
    'Stable Funding - 100%',
    'Stable Funding - 95%',
    'Stable Funding - 90%',
    'Less Stable Funding - 50%',
    'No Stable Funding - 0%'
  ];

  regulatoryCategories = [
    'Retail Deposits',
    'Corporate Deposits',
    'Institutional Deposits',
    'Interbank Funding',
    'Secured Borrowing'
  ];

  ngOnInit(): void {
    this.loadMockData();
  }

  private loadMockData(): void {
    this.mappings = [
      {
        id: 1,
        internalProduct: 'Demand Deposits - Personal',
        regulatoryCategory: 'Retail Deposits',
        lcrTreatment: 'Stable Retail Deposits',
        nsfrTreatment: 'Stable Funding - 95%',
        outflowRate: 3,
        active: true
      },
      {
        id: 2,
        internalProduct: 'Savings Account - High Net Worth',
        regulatoryCategory: 'Retail Deposits',
        lcrTreatment: 'Less Stable Retail Deposits',
        nsfrTreatment: 'Stable Funding - 90%',
        outflowRate: 10,
        active: true
      },
      {
        id: 3,
        internalProduct: 'Corporate Checking',
        regulatoryCategory: 'Corporate Deposits',
        lcrTreatment: 'Operational Deposits',
        nsfrTreatment: 'Stable Funding - 100%',
        outflowRate: 5,
        active: true
      },
      {
        id: 4,
        internalProduct: 'Money Market Sweep',
        regulatoryCategory: 'Corporate Deposits',
        lcrTreatment: 'Unsecured Wholesale Funding',
        nsfrTreatment: 'Less Stable Funding - 50%',
        outflowRate: 40,
        active: true
      },
      {
        id: 5,
        internalProduct: 'Time Deposit - Institutional',
        regulatoryCategory: 'Institutional Deposits',
        lcrTreatment: 'Unsecured Wholesale Funding',
        nsfrTreatment: 'Stable Funding - 90%',
        outflowRate: 25,
        active: true
      },
      {
        id: 6,
        internalProduct: 'Federal Funds Purchased',
        regulatoryCategory: 'Interbank Funding',
        lcrTreatment: 'Unsecured Wholesale Funding',
        nsfrTreatment: 'No Stable Funding - 0%',
        outflowRate: 100,
        active: true
      },
      {
        id: 7,
        internalProduct: 'Repo - Treasury Collateral',
        regulatoryCategory: 'Secured Borrowing',
        lcrTreatment: 'Secured Funding',
        nsfrTreatment: 'No Stable Funding - 0%',
        outflowRate: 0,
        active: true
      },
      {
        id: 8,
        internalProduct: 'Legacy Product - Discontinued',
        regulatoryCategory: 'Retail Deposits',
        lcrTreatment: 'Stable Retail Deposits',
        nsfrTreatment: 'Stable Funding - 95%',
        outflowRate: 5,
        active: false
      }
    ];
  }

  editRow(mapping: ProductMapping): void {
    this.editingRow = { ...mapping };
  }

  saveRow(): void {
    if (this.editingRow) {
      const index = this.mappings.findIndex(m => m.id === this.editingRow!.id);
      if (index > -1) {
        this.mappings[index] = { ...this.editingRow };
        this.mappings = [...this.mappings];
      }
      this.editingRow = null;
    }
  }

  cancelEdit(): void {
    this.editingRow = null;
  }

  deleteMapping(mapping: ProductMapping): void {
    if (confirm(`Delete mapping for "${mapping.internalProduct}"?`)) {
      this.mappings = this.mappings.filter(m => m.id !== mapping.id);
    }
  }

  toggleActive(mapping: ProductMapping): void {
    mapping.active = !mapping.active;
    this.mappings = [...this.mappings];
  }

  isEditing(mapping: ProductMapping): boolean {
    return this.editingRow?.id === mapping.id;
  }

  addNewMapping(): void {
    const newMapping: ProductMapping = {
      id: Math.max(...this.mappings.map(m => m.id), 0) + 1,
      internalProduct: 'New Product',
      regulatoryCategory: this.regulatoryCategories[0],
      lcrTreatment: this.lcrTreatments[0],
      nsfrTreatment: this.nsfrTreatments[0],
      outflowRate: 0,
      active: true
    };
    this.mappings = [newMapping, ...this.mappings];
    this.editingRow = { ...newMapping };
  }

  exportMappings(): void {
    console.log('Exporting product mappings...');
    alert('Product mappings exported to Excel');
  }
}
