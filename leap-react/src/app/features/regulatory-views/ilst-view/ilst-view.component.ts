import { Component, OnInit } from '@angular/core';

interface ILSTMetric {
  label: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning';
}

@Component({
  selector: 'app-ilst-view',
  templateUrl: './ilst-view.component.html',
  styleUrls: ['./ilst-view.component.scss']
})
export class IlstViewComponent implements OnInit {
  metrics: ILSTMetric[] = [
    {
      label: 'Internal Liquidity Stress Test Score',
      value: 87,
      unit: 'score',
      status: 'normal'
    },
    {
      label: 'Stress Scenario Coverage',
      value: 145,
      unit: '%',
      status: 'normal'
    },
    {
      label: 'Survival Period (Days)',
      value: 35,
      unit: 'days',
      status: 'normal'
    }
  ];

  displayedColumns: string[] = ['scenario', 'outflow', 'buffer', 'coverage', 'days'];
  dataSource = [
    {
      scenario: 'Baseline Scenario',
      outflow: 1800000000,
      buffer: 3200000000,
      coverage: 178,
      days: 45
    },
    {
      scenario: 'Moderate Stress',
      outflow: 2400000000,
      buffer: 3200000000,
      coverage: 133,
      days: 35
    },
    {
      scenario: 'Severe Stress',
      outflow: 2900000000,
      buffer: 3200000000,
      coverage: 110,
      days: 28
    },
    {
      scenario: 'Extreme Stress',
      outflow: 3500000000,
      buffer: 3200000000,
      coverage: 91,
      days: 22
    }
  ];

  ngOnInit(): void {}

  isLowCoverage(coverage: number): boolean {
    return coverage < 100;
  }

  isWarningCoverage(coverage: number): boolean {
    return coverage >= 100 && coverage < 120;
  }
}
