import { Component, OnInit } from '@angular/core';

interface ReportLine {
  lineNumber: string;
  description: string;
  amount: number;
}

@Component({
  selector: 'app-osfi-lcr',
  templateUrl: './osfi-lcr.component.html',
  styleUrls: ['./osfi-lcr.component.scss']
})
export class OsfiLcrComponent implements OnInit {
  reportDate = new Date();
  displayedColumns: string[] = ['lineNumber', 'description', 'amount'];

  hqlaData: ReportLine[] = [];
  outflowsData: ReportLine[] = [];
  inflowsData: ReportLine[] = [];

  totalHQLA = 0;
  totalOutflows = 0;
  totalInflows = 0;
  lcrRatio = 0;

  ngOnInit(): void {
    this.loadMockData();
  }

  private loadMockData(): void {
    // HQLA - OSFI Definition
    this.hqlaData = [
      { lineNumber: '1', description: 'Level 1 Assets - Cash and Bank of Canada Reserves', amount: 30000000000 },
      { lineNumber: '2', description: 'Level 1 Assets - Government of Canada Securities', amount: 42000000000 },
      { lineNumber: '3', description: 'Level 1 Assets - Provincial Securities', amount: 25000000000 },
      { lineNumber: '4', description: 'Level 2A Assets - Qualifying Marketable Securities', amount: 18000000000 },
      { lineNumber: '5', description: 'Level 2B Assets - Other Qualifying Assets', amount: 10000000000 }
    ];

    // Cash Outflows - OSFI Specific
    this.outflowsData = [
      { lineNumber: '10', description: 'Retail Deposits - Stable (CDIC Insured)', amount: 12000000000 },
      { lineNumber: '11', description: 'Retail Deposits - Less Stable', amount: 22000000000 },
      { lineNumber: '12', description: 'Unsecured Wholesale Funding', amount: 32000000000 },
      { lineNumber: '13', description: 'Secured Funding - REPO', amount: 18000000000 },
      { lineNumber: '14', description: 'Additional Requirements', amount: 15000000000 },
      { lineNumber: '15', description: 'Derivatives and Other Collateral', amount: 8000000000 }
    ];

    // Cash Inflows
    this.inflowsData = [
      { lineNumber: '20', description: 'Secured Lending - Reverse REPO', amount: 20000000000 },
      { lineNumber: '21', description: 'Credit and Liquidity Facilities', amount: 10000000000 },
      { lineNumber: '22', description: 'Other Contractual Inflows', amount: 8000000000 }
    ];

    this.totalHQLA = this.hqlaData.reduce((sum, item) => sum + item.amount, 0);
    this.totalOutflows = this.outflowsData.reduce((sum, item) => sum + item.amount, 0);
    this.totalInflows = this.inflowsData.reduce((sum, item) => sum + item.amount, 0);

    // OSFI LCR = HQLA / Net Cash Outflows (with 75% inflow cap)
    const netOutflows = this.totalOutflows - (this.totalInflows * 0.75);
    this.lcrRatio = (this.totalHQLA / netOutflows) * 100;
  }

  exportToExcel(): void {
    console.log('Exporting OSFI LCR to Excel...');
    alert('OSFI LCR report exported to Excel');
  }

  exportToPDF(): void {
    console.log('Exporting OSFI LCR to PDF...');
    alert('OSFI LCR report exported to PDF');
  }
}
