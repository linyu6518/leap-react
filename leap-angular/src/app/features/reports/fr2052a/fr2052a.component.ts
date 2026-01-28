import { Component, OnInit } from '@angular/core';

interface ReportLine {
  lineNumber: string;
  description: string;
  unweightedAmount: number;
  weightedAmount?: number;
  haircut?: number;
  rate?: number;
  notes?: string;
}

interface SectionTotal {
  label: string;
  unweighted: number;
  weighted: number;
}

@Component({
  selector: 'app-fr2052a',
  templateUrl: './fr2052a.component.html',
  styleUrls: ['./fr2052a.component.scss']
})
export class Fr2052aComponent implements OnInit {
  reportDate = new Date();

  // Display columns for different sections
  hqlaColumns: string[] = ['lineNumber', 'description', 'unweightedAmount', 'haircut', 'weightedAmount', 'notes'];
  outflowColumns: string[] = ['lineNumber', 'description', 'unweightedAmount', 'rate', 'weightedAmount'];
  inflowColumns: string[] = ['lineNumber', 'description', 'unweightedAmount', 'rate', 'weightedAmount'];

  // HQLA Data
  level1Assets: ReportLine[] = [];
  level2aAssets: ReportLine[] = [];
  level2bAssets: ReportLine[] = [];

  // Cash Outflows Data
  retailDeposits: ReportLine[] = [];
  unsecuredWholesale: ReportLine[] = [];
  securedFunding: ReportLine[] = [];
  additionalRequirements: ReportLine[] = [];
  otherContractualFunding: ReportLine[] = [];
  otherContingentFunding: ReportLine[] = [];

  // Cash Inflows Data
  securedLending: ReportLine[] = [];
  inflowsFromCounterparties: ReportLine[] = [];
  otherCashInflows: ReportLine[] = [];

  // Totals and Ratios
  totalLevel1: SectionTotal = { label: 'Total Level 1 Assets', unweighted: 0, weighted: 0 };
  totalLevel2A: SectionTotal = { label: 'Total Level 2A Assets', unweighted: 0, weighted: 0 };
  totalLevel2B: SectionTotal = { label: 'Total Level 2B Assets', unweighted: 0, weighted: 0 };
  adjustedLevel2: number = 0;
  totalHQLA: number = 0;

  totalRetailOutflows: SectionTotal = { label: 'Total Retail Deposits', unweighted: 0, weighted: 0 };
  totalUnsecuredWholesale: SectionTotal = { label: 'Total Unsecured Wholesale', unweighted: 0, weighted: 0 };
  totalSecuredFunding: SectionTotal = { label: 'Total Secured Funding', unweighted: 0, weighted: 0 };
  totalAdditionalReq: SectionTotal = { label: 'Total Additional Requirements', unweighted: 0, weighted: 0 };
  totalOtherContractualFunding: SectionTotal = { label: 'Total Other Contractual Funding', unweighted: 0, weighted: 0 };
  totalOtherContingentFunding: SectionTotal = { label: 'Total Other Contingent Funding', unweighted: 0, weighted: 0 };
  totalOutflows: number = 0;

  totalSecuredLending: SectionTotal = { label: 'Total Secured Lending', unweighted: 0, weighted: 0 };
  totalInflowsFromCounterparties: SectionTotal = { label: 'Total Inflows from Counterparties', unweighted: 0, weighted: 0 };
  totalOtherInflows: SectionTotal = { label: 'Total Other Inflows', unweighted: 0, weighted: 0 };
  totalInflows: number = 0;
  cappedInflows: number = 0;

  netCashOutflows: number = 0;
  lcrRatio: number = 0;
  excess: number = 0;

  ngOnInit(): void {
    this.loadMockData();
    this.calculateTotals();
  }

  private loadMockData(): void {
    // ==================== HQLA - Level 1 Assets ====================
    this.level1Assets = [
      {
        lineNumber: '1',
        description: 'Currency and coin',
        unweightedAmount: 8500000000,
        haircut: 0,
        weightedAmount: 8500000000,
        notes: 'Physical cash in vaults'
      },
      {
        lineNumber: '2',
        description: 'Reserve balances at Federal Reserve',
        unweightedAmount: 42000000000,
        haircut: 0,
        weightedAmount: 42000000000,
        notes: 'Required + excess reserves'
      },
      {
        lineNumber: '3',
        description: 'US Treasury securities (0-3 years)',
        unweightedAmount: 65000000000,
        haircut: 0,
        weightedAmount: 65000000000,
        notes: 'Short-term Treasury bills'
      },
      {
        lineNumber: '4',
        description: 'US Treasury securities (>3 years)',
        unweightedAmount: 38000000000,
        haircut: 0,
        weightedAmount: 38000000000,
        notes: 'Long-term Treasury bonds'
      },
      {
        lineNumber: '5',
        description: 'Federal Reserve reverse repo',
        unweightedAmount: 15000000000,
        haircut: 0,
        weightedAmount: 15000000000,
        notes: 'Overnight RRP program'
      }
    ];

    // ==================== HQLA - Level 2A Assets ====================
    this.level2aAssets = [
      {
        lineNumber: '10',
        description: 'GSE (Fannie Mae/Freddie Mac) MBS',
        unweightedAmount: 28000000000,
        haircut: 15,
        weightedAmount: 23800000000,
        notes: 'Agency mortgage-backed securities'
      },
      {
        lineNumber: '11',
        description: 'GSE debt obligations',
        unweightedAmount: 16000000000,
        haircut: 15,
        weightedAmount: 13600000000,
        notes: 'Fannie/Freddie senior debt'
      },
      {
        lineNumber: '12',
        description: 'US government agency securities',
        unweightedAmount: 12000000000,
        haircut: 15,
        weightedAmount: 10200000000,
        notes: 'FHLB, FFCB obligations'
      }
    ];

    // ==================== HQLA - Level 2B Assets ====================
    this.level2bAssets = [
      {
        lineNumber: '20',
        description: 'Corporate debt securities (AA- or higher)',
        unweightedAmount: 9500000000,
        haircut: 50,
        weightedAmount: 4750000000,
        notes: 'Investment grade corporate bonds'
      },
      {
        lineNumber: '21',
        description: 'Publicly traded common equity (Russell 1000)',
        unweightedAmount: 6000000000,
        haircut: 50,
        weightedAmount: 3000000000,
        notes: 'Large-cap equities'
      },
      {
        lineNumber: '22',
        description: 'Municipal securities (revenue bonds)',
        unweightedAmount: 4500000000,
        haircut: 50,
        weightedAmount: 2250000000,
        notes: 'General obligation bonds'
      }
    ];

    // ==================== Cash Outflows - Retail Deposits ====================
    this.retailDeposits = [
      {
        lineNumber: '30',
        description: 'Stable retail deposits (FDIC insured)',
        unweightedAmount: 125000000000,
        rate: 3,
        weightedAmount: 3750000000
      },
      {
        lineNumber: '31',
        description: 'Less stable retail deposits',
        unweightedAmount: 68000000000,
        rate: 10,
        weightedAmount: 6800000000
      },
      {
        lineNumber: '32',
        description: 'Retail term deposits maturing ≤30 days',
        unweightedAmount: 22000000000,
        rate: 100,
        weightedAmount: 22000000000
      }
    ];

    // ==================== Cash Outflows - Unsecured Wholesale ====================
    this.unsecuredWholesale = [
      {
        lineNumber: '40',
        description: 'Operational deposits from financial institutions',
        unweightedAmount: 35000000000,
        rate: 25,
        weightedAmount: 8750000000
      },
      {
        lineNumber: '41',
        description: 'Non-operational deposits from financial institutions',
        unweightedAmount: 48000000000,
        rate: 100,
        weightedAmount: 48000000000
      },
      {
        lineNumber: '42',
        description: 'Unsecured wholesale funding from non-financial corporates',
        unweightedAmount: 32000000000,
        rate: 40,
        weightedAmount: 12800000000
      },
      {
        lineNumber: '43',
        description: 'Unsecured wholesale funding from sovereigns/central banks',
        unweightedAmount: 18000000000,
        rate: 25,
        weightedAmount: 4500000000
      }
    ];

    // ==================== Cash Outflows - Secured Funding ====================
    this.securedFunding = [
      {
        lineNumber: '50',
        description: 'Secured funding backed by Level 1 HQLA',
        unweightedAmount: 42000000000,
        rate: 0,
        weightedAmount: 0
      },
      {
        lineNumber: '51',
        description: 'Secured funding backed by Level 2A HQLA',
        unweightedAmount: 28000000000,
        rate: 15,
        weightedAmount: 4200000000
      },
      {
        lineNumber: '52',
        description: 'Secured funding backed by non-HQLA assets',
        unweightedAmount: 35000000000,
        rate: 100,
        weightedAmount: 35000000000
      },
      {
        lineNumber: '53',
        description: 'Fed funds purchased',
        unweightedAmount: 15000000000,
        rate: 100,
        weightedAmount: 15000000000
      }
    ];

    // ==================== Cash Outflows - Additional Requirements ====================
    this.additionalRequirements = [
      {
        lineNumber: '60',
        description: 'Derivatives collateral outflows',
        unweightedAmount: 28000000000,
        rate: 100,
        weightedAmount: 28000000000
      },
      {
        lineNumber: '61',
        description: 'Potential valuation changes on posted collateral',
        unweightedAmount: 12000000000,
        rate: 20,
        weightedAmount: 2400000000
      },
      {
        lineNumber: '62',
        description: 'Loss of funding on asset-backed securities',
        unweightedAmount: 8000000000,
        rate: 100,
        weightedAmount: 8000000000
      },
      {
        lineNumber: '63',
        description: 'Loss of funding on covered bonds',
        unweightedAmount: 5000000000,
        rate: 100,
        weightedAmount: 5000000000
      }
    ];

    // ==================== Other Contractual Funding Obligations ====================
    this.otherContractualFunding = [
      {
        lineNumber: '70',
        description: 'FHLB advances maturing',
        unweightedAmount: 18000000000,
        rate: 100,
        weightedAmount: 18000000000
      },
      {
        lineNumber: '71',
        description: 'Other debt maturing',
        unweightedAmount: 12000000000,
        rate: 100,
        weightedAmount: 12000000000
      },
      {
        lineNumber: '72',
        description: 'Contractual lending obligations',
        unweightedAmount: 6000000000,
        rate: 100,
        weightedAmount: 6000000000
      }
    ];

    // ==================== Other Contingent Funding Obligations ====================
    this.otherContingentFunding = [
      {
        lineNumber: '80',
        description: 'Committed credit and liquidity facilities - retail',
        unweightedAmount: 85000000000,
        rate: 5,
        weightedAmount: 4250000000
      },
      {
        lineNumber: '81',
        description: 'Committed credit and liquidity facilities - corporate',
        unweightedAmount: 125000000000,
        rate: 10,
        weightedAmount: 12500000000
      },
      {
        lineNumber: '82',
        description: 'Committed liquidity facilities to financial institutions',
        unweightedAmount: 42000000000,
        rate: 40,
        weightedAmount: 16800000000
      },
      {
        lineNumber: '83',
        description: 'Unconditionally revocable credit/liquidity facilities',
        unweightedAmount: 65000000000,
        rate: 0,
        weightedAmount: 0
      },
      {
        lineNumber: '84',
        description: 'Non-contractual obligations',
        unweightedAmount: 35000000000,
        rate: 3,
        weightedAmount: 1050000000
      }
    ];

    // ==================== Cash Inflows - Secured Lending ====================
    this.securedLending = [
      {
        lineNumber: '90',
        description: 'Reverse repo backed by Level 1 HQLA',
        unweightedAmount: 48000000000,
        rate: 0,
        weightedAmount: 0
      },
      {
        lineNumber: '91',
        description: 'Reverse repo backed by Level 2A HQLA',
        unweightedAmount: 32000000000,
        rate: 15,
        weightedAmount: 4800000000
      },
      {
        lineNumber: '92',
        description: 'Reverse repo backed by non-HQLA',
        unweightedAmount: 25000000000,
        rate: 50,
        weightedAmount: 12500000000
      },
      {
        lineNumber: '93',
        description: 'Margin loans',
        unweightedAmount: 18000000000,
        rate: 50,
        weightedAmount: 9000000000
      }
    ];

    // ==================== Cash Inflows from Counterparties ====================
    this.inflowsFromCounterparties = [
      {
        lineNumber: '100',
        description: 'Inflows from retail customers',
        unweightedAmount: 42000000000,
        rate: 50,
        weightedAmount: 21000000000
      },
      {
        lineNumber: '101',
        description: 'Inflows from financial institutions',
        unweightedAmount: 35000000000,
        rate: 100,
        weightedAmount: 35000000000
      },
      {
        lineNumber: '102',
        description: 'Inflows from non-financial corporates',
        unweightedAmount: 28000000000,
        rate: 50,
        weightedAmount: 14000000000
      },
      {
        lineNumber: '103',
        description: 'Inflows from central banks/sovereigns',
        unweightedAmount: 15000000000,
        rate: 100,
        weightedAmount: 15000000000
      }
    ];

    // ==================== Other Cash Inflows ====================
    this.otherCashInflows = [
      {
        lineNumber: '110',
        description: 'Net derivative receivables',
        unweightedAmount: 22000000000,
        rate: 100,
        weightedAmount: 22000000000
      },
      {
        lineNumber: '111',
        description: 'Maturing investment-grade securities',
        unweightedAmount: 18000000000,
        rate: 100,
        weightedAmount: 18000000000
      },
      {
        lineNumber: '112',
        description: 'Operational deposits at other banks',
        unweightedAmount: 8000000000,
        rate: 0,
        weightedAmount: 0
      },
      {
        lineNumber: '113',
        description: 'Other contractual inflows',
        unweightedAmount: 12000000000,
        rate: 100,
        weightedAmount: 12000000000
      }
    ];
  }

  private calculateTotals(): void {
    // HQLA Calculations
    this.totalLevel1 = this.calculateSectionTotal(this.level1Assets);
    this.totalLevel2A = this.calculateSectionTotal(this.level2aAssets);
    this.totalLevel2B = this.calculateSectionTotal(this.level2bAssets);

    // Adjust Level 2 assets (cannot exceed 67% of Level 1 after haircuts)
    const level2Total = this.totalLevel2A.weighted + this.totalLevel2B.weighted;
    const level2Cap = this.totalLevel1.weighted * (2/3); // 67% of Level 1
    this.adjustedLevel2 = Math.min(level2Total, level2Cap);

    // Total HQLA
    this.totalHQLA = this.totalLevel1.weighted + this.adjustedLevel2;

    // Outflows Calculations
    this.totalRetailOutflows = this.calculateSectionTotal(this.retailDeposits);
    this.totalUnsecuredWholesale = this.calculateSectionTotal(this.unsecuredWholesale);
    this.totalSecuredFunding = this.calculateSectionTotal(this.securedFunding);
    this.totalAdditionalReq = this.calculateSectionTotal(this.additionalRequirements);
    this.totalOtherContractualFunding = this.calculateSectionTotal(this.otherContractualFunding);
    this.totalOtherContingentFunding = this.calculateSectionTotal(this.otherContingentFunding);

    this.totalOutflows =
      this.totalRetailOutflows.weighted +
      this.totalUnsecuredWholesale.weighted +
      this.totalSecuredFunding.weighted +
      this.totalAdditionalReq.weighted +
      this.totalOtherContractualFunding.weighted +
      this.totalOtherContingentFunding.weighted;

    // Inflows Calculations
    this.totalSecuredLending = this.calculateSectionTotal(this.securedLending);
    this.totalInflowsFromCounterparties = this.calculateSectionTotal(this.inflowsFromCounterparties);
    this.totalOtherInflows = this.calculateSectionTotal(this.otherCashInflows);

    this.totalInflows =
      this.totalSecuredLending.weighted +
      this.totalInflowsFromCounterparties.weighted +
      this.totalOtherInflows.weighted;

    // Inflows capped at 75% of outflows
    this.cappedInflows = Math.min(this.totalInflows, this.totalOutflows * 0.75);

    // Net Cash Outflows
    this.netCashOutflows = this.totalOutflows - this.cappedInflows;

    // LCR Ratio
    this.lcrRatio = (this.totalHQLA / this.netCashOutflows) * 100;

    // Excess HQLA
    this.excess = this.totalHQLA - this.netCashOutflows;
  }

  private calculateSectionTotal(data: ReportLine[]): SectionTotal {
    return {
      label: '',
      unweighted: data.reduce((sum, item) => sum + item.unweightedAmount, 0),
      weighted: data.reduce((sum, item) => sum + (item.weightedAmount || item.unweightedAmount), 0)
    };
  }

  exportToExcel(): void {
    console.log('Exporting detailed FR2052a to Excel...');
    alert('FR2052a Detailed Report exported to Excel');
  }

  exportToPDF(): void {
    console.log('Exporting detailed FR2052a to PDF...');
    alert('FR2052a Detailed Report exported to PDF');
  }

  printReport(): void {
    window.print();
  }
}
