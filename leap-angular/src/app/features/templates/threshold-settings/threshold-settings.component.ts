import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface ThresholdCategory {
  name: string;
  thresholds: Threshold[];
}

interface Threshold {
  id: number;
  metric: string;
  warningLevel: number;
  criticalLevel: number;
  unit: string;
  description: string;
}

@Component({
  selector: 'app-threshold-settings',
  templateUrl: './threshold-settings.component.html',
  styleUrls: ['./threshold-settings.component.scss']
})
export class ThresholdSettingsComponent implements OnInit {
  categories: ThresholdCategory[] = [];
  selectedCategory: string = '';
  editingThreshold: Threshold | null = null;
  thresholdForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.thresholdForm = this.fb.group({
      metric: ['', Validators.required],
      warningLevel: [0, [Validators.required, Validators.min(0)]],
      criticalLevel: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadMockData();
    if (this.categories.length > 0) {
      this.selectedCategory = this.categories[0].name;
    }
  }

  private loadMockData(): void {
    this.categories = [
      {
        name: 'Liquidity Ratios',
        thresholds: [
          {
            id: 1,
            metric: 'LCR (Liquidity Coverage Ratio)',
            warningLevel: 110,
            criticalLevel: 100,
            unit: '%',
            description: 'Minimum regulatory requirement is 100%'
          },
          {
            id: 2,
            metric: 'NSFR (Net Stable Funding Ratio)',
            warningLevel: 105,
            criticalLevel: 100,
            unit: '%',
            description: 'Minimum regulatory requirement is 100%'
          },
          {
            id: 3,
            metric: 'LMR (Liquidity Maintenance Ratio)',
            warningLevel: 30,
            criticalLevel: 25,
            unit: '%',
            description: 'Hong Kong regulatory requirement'
          }
        ]
      },
      {
        name: 'Product Variance',
        thresholds: [
          {
            id: 4,
            metric: 'Deposits - Daily Variance',
            warningLevel: 5000000000,
            criticalLevel: 10000000000,
            unit: 'USD',
            description: 'Day-over-day change threshold'
          },
          {
            id: 5,
            metric: 'Loan Commitments - Weekly Variance',
            warningLevel: 2000000000,
            criticalLevel: 5000000000,
            unit: 'USD',
            description: 'Week-over-week change threshold'
          },
          {
            id: 6,
            metric: 'Securities - Position Change',
            warningLevel: 3000000000,
            criticalLevel: 7000000000,
            unit: 'USD',
            description: 'Position change threshold'
          }
        ]
      },
      {
        name: 'Concentration Limits',
        thresholds: [
          {
            id: 7,
            metric: 'Single Counterparty Exposure',
            warningLevel: 8,
            criticalLevel: 10,
            unit: '% of Total Assets',
            description: 'Maximum exposure to single counterparty'
          },
          {
            id: 8,
            metric: 'Top 10 Depositors',
            warningLevel: 20,
            criticalLevel: 25,
            unit: '% of Total Deposits',
            description: 'Concentration in top depositors'
          },
          {
            id: 9,
            metric: 'Wholesale Funding Ratio',
            warningLevel: 25,
            criticalLevel: 30,
            unit: '% of Total Funding',
            description: 'Wholesale funding concentration'
          }
        ]
      }
    ];
  }

  getCurrentThresholds(): Threshold[] {
    const category = this.categories.find(c => c.name === this.selectedCategory);
    return category ? category.thresholds : [];
  }

  editThreshold(threshold: Threshold): void {
    this.editingThreshold = { ...threshold };
    this.thresholdForm.patchValue({
      metric: threshold.metric,
      warningLevel: threshold.warningLevel,
      criticalLevel: threshold.criticalLevel,
      unit: threshold.unit,
      description: threshold.description
    });
  }

  saveThreshold(): void {
    if (this.thresholdForm.valid && this.editingThreshold) {
      const category = this.categories.find(c => c.name === this.selectedCategory);
      if (category) {
        const index = category.thresholds.findIndex(t => t.id === this.editingThreshold!.id);
        if (index > -1) {
          category.thresholds[index] = {
            ...this.editingThreshold,
            ...this.thresholdForm.value
          };
        }
      }
      this.cancelEdit();
    }
  }

  cancelEdit(): void {
    this.editingThreshold = null;
    this.thresholdForm.reset();
  }

  resetToDefaults(): void {
    if (confirm('Reset all thresholds to default values? This cannot be undone.')) {
      this.loadMockData();
      alert('Thresholds reset to default values');
    }
  }

  exportSettings(): void {
    console.log('Exporting threshold settings...');
    alert('Threshold settings exported to JSON');
  }
}
