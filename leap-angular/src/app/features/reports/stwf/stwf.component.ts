import { Component, OnInit } from '@angular/core';

interface ReportLine {
  lineNumber: string;
  description: string;
  amount: number;
}

@Component({
  selector: 'app-stwf',
  templateUrl: './stwf.component.html',
  styleUrls: ['./stwf.component.scss']
})
export class StwfComponent implements OnInit {
  reportDate = new Date();
  displayedColumns: string[] = ['lineNumber', 'description', 'amount'];

  wholesaleFundingData: ReportLine[] = [];
  concentrationData: ReportLine[] = [];

  totalWholesaleFunding = 0;
  totalConcentration = 0;
  stwfRatio = 0;

  ngOnInit(): void {
    this.loadMockData();
  }

  private loadMockData(): void {
    // Short-Term Wholesale Funding
    this.wholesaleFundingData = [
      { lineNumber: '1', description: 'Federal Funds Purchased', amount: 18000000000 },
      { lineNumber: '2', description: 'Securities Sold Under Repurchase Agreements', amount: 32000000000 },
      { lineNumber: '3', description: 'Commercial Paper', amount: 15000000000 },
      { lineNumber: '4', description: 'Eurodollar Deposits', amount: 22000000000 },
      { lineNumber: '5', description: 'Brokered Deposits (< 30 days)', amount: 12000000000 },
      { lineNumber: '6', description: 'Other Short-Term Borrowings', amount: 8000000000 }
    ];

    // Concentration by Counterparty
    this.concentrationData = [
      { lineNumber: '10', description: 'Top 10 Counterparties', amount: 45000000000 },
      { lineNumber: '11', description: 'Next 15 Counterparties', amount: 28000000000 },
      { lineNumber: '12', description: 'Other Counterparties', amount: 34000000000 }
    ];

    this.totalWholesaleFunding = this.wholesaleFundingData.reduce((sum, item) => sum + item.amount, 0);
    this.totalConcentration = this.concentrationData.reduce((sum, item) => sum + item.amount, 0);

    // STWF ratio = STWF / Total Assets (mock calculation)
    const totalAssets = 850000000000; // $850B mock total assets
    this.stwfRatio = (this.totalWholesaleFunding / totalAssets) * 100;
  }

  exportToExcel(): void {
    console.log('Exporting STWF to Excel...');
    alert('STWF report exported to Excel');
  }

  exportToPDF(): void {
    console.log('Exporting STWF to PDF...');
    alert('STWF report exported to PDF');
  }
}
