import { Component, OnInit } from '@angular/core';

interface ReportLine {
  lineNumber: string;
  description: string;
  amount: number;
}

@Component({
  selector: 'app-appendix-vi',
  templateUrl: './appendix-vi.component.html',
  styleUrls: ['./appendix-vi.component.scss']
})
export class AppendixViComponent implements OnInit {
  reportDate = new Date();
  displayedColumns: string[] = ['lineNumber', 'description', 'amount'];

  hqlaData: ReportLine[] = [];
  netOutflowsData: ReportLine[] = [];

  totalHQLA = 0;
  totalNetOutflows = 0;
  lmrRatio = 0;

  ngOnInit(): void {
    this.loadMockData();
  }

  private loadMockData(): void {
    // HQLA - Hong Kong Definition
    this.hqlaData = [
      { lineNumber: '1', description: 'Level 1 Assets - Cash and Central Bank Reserves', amount: 28000000000 },
      { lineNumber: '2', description: 'Level 1 Assets - Hong Kong Government Bonds', amount: 35000000000 },
      { lineNumber: '3', description: 'Level 1 Assets - Exchange Fund Bills/Notes', amount: 22000000000 },
      { lineNumber: '4', description: 'Level 2A Assets - Qualifying Marketable Securities', amount: 18000000000 },
      { lineNumber: '5', description: 'Level 2B Assets - Other Qualifying Assets', amount: 12000000000 }
    ];

    // Net Cash Outflows
    this.netOutflowsData = [
      { lineNumber: '10', description: 'Retail Deposits Outflow', amount: 8000000000 },
      { lineNumber: '11', description: 'Unsecured Wholesale Funding Outflow', amount: 25000000000 },
      { lineNumber: '12', description: 'Secured Funding Outflow', amount: 15000000000 },
      { lineNumber: '13', description: 'Additional Requirements', amount: 12000000000 },
      { lineNumber: '14', description: 'Less: Cash Inflows', amount: -18000000000 }
    ];

    this.totalHQLA = this.hqlaData.reduce((sum, item) => sum + item.amount, 0);
    this.totalNetOutflows = this.netOutflowsData.reduce((sum, item) => sum + item.amount, 0);

    // LMR (Liquidity Maintenance Ratio) = HQLA / Net Cash Outflows × 100%
    this.lmrRatio = (this.totalHQLA / this.totalNetOutflows) * 100;
  }

  exportToExcel(): void {
    console.log('Exporting Appendix VI to Excel...');
    alert('Appendix VI report exported to Excel');
  }

  exportToPDF(): void {
    console.log('Exporting Appendix VI to PDF...');
    alert('Appendix VI report exported to PDF');
  }
}
