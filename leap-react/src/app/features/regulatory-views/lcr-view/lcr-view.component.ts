import { Component, OnInit } from '@angular/core';

interface LCRMetric {
  label: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning';
}

@Component({
  selector: 'app-lcr-view',
  templateUrl: './lcr-view.component.html',
  styleUrls: ['./lcr-view.component.scss']
})
export class LcrViewComponent implements OnInit {
  metrics: LCRMetric[] = [
    { label: 'HQLA (High Quality Liquid Assets)', value: 5250000000, unit: '$', status: 'normal' },
    { label: 'NCO (Net Cash Outflow)', value: 4100000000, unit: '$', status: 'normal' },
    { label: 'LCR Ratio', value: 128, unit: '%', status: 'normal' }
  ];

  displayedColumns: string[] = ['region', 'product', 'hqla', 'nco', 'lcrRatio'];
  dataSource = [
    { region: 'Americas', product: 'Deposits', hqla: 2500000000, nco: 1950000000, lcrRatio: 128 },
    { region: 'Americas', product: 'Securities', hqla: 1800000000, nco: 1400000000, lcrRatio: 129 },
    { region: 'EMEA', product: 'Deposits', hqla: 950000000, nco: 750000000, lcrRatio: 127 },
    { region: 'Total', product: 'All Products', hqla: 5250000000, nco: 4100000000, lcrRatio: 128 }
  ];

  ngOnInit(): void {}

  isLowRatio(ratio: number): boolean {
    return ratio < 100;
  }

  isTotalRow(element: any): boolean {
    return element.region === 'Total';
  }
}
