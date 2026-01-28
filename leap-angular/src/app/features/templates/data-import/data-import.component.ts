import { Component } from '@angular/core';

interface ImportHistory {
  fileName: string;
  importDate: Date;
  recordsCount: number;
  status: 'success' | 'failed' | 'partial';
  importedBy: string;
}

@Component({
  selector: 'app-data-import',
  templateUrl: './data-import.component.html',
  styleUrls: ['./data-import.component.scss']
})
export class DataImportComponent {
  displayedColumns: string[] = ['fileName', 'importDate', 'recordsCount', 'status', 'importedBy', 'actions'];
  selectedFile: File | null = null;
  selectedTemplate = '';

  importHistory: ImportHistory[] = [
    {
      fileName: 'deposits_data_2024_01_15.xlsx',
      importDate: new Date('2024-01-15'),
      recordsCount: 1250,
      status: 'success',
      importedBy: 'John Doe'
    },
    {
      fileName: 'loan_commitments_2024_01_14.csv',
      importDate: new Date('2024-01-14'),
      recordsCount: 890,
      status: 'success',
      importedBy: 'Jane Smith'
    },
    {
      fileName: 'buyback_data_2024_01_13.xlsx',
      importDate: new Date('2024-01-13'),
      recordsCount: 456,
      status: 'partial',
      importedBy: 'Mike Johnson'
    },
    {
      fileName: 'invalid_format_2024_01_12.txt',
      importDate: new Date('2024-01-12'),
      recordsCount: 0,
      status: 'failed',
      importedBy: 'Sarah Williams'
    }
  ];

  templates = [
    'Deposits',
    'Loan Commitments',
    'BuyBack',
    'Cash Flows',
    'Securities'
  ];

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('Selected file:', file.name);
    }
  }

  downloadTemplate(): void {
    if (this.selectedTemplate) {
      console.log('Downloading template:', this.selectedTemplate);
      alert(`Downloading ${this.selectedTemplate} template...`);
    } else {
      alert('Please select a template first');
    }
  }

  uploadFile(): void {
    if (this.selectedFile && this.selectedTemplate) {
      console.log('Uploading file:', this.selectedFile.name, 'for template:', this.selectedTemplate);
      alert(`Uploading ${this.selectedFile.name} for ${this.selectedTemplate}...`);

      // Mock: Add to history
      this.importHistory.unshift({
        fileName: this.selectedFile.name,
        importDate: new Date(),
        recordsCount: Math.floor(Math.random() * 1000) + 100,
        status: 'success',
        importedBy: 'Current User'
      });

      this.selectedFile = null;
      this.selectedTemplate = '';
    } else {
      alert('Please select both a template and a file');
    }
  }

  viewDetails(record: ImportHistory): void {
    console.log('Viewing details for:', record.fileName);
    alert(`Import Details:\n\nFile: ${record.fileName}\nRecords: ${record.recordsCount}\nStatus: ${record.status}`);
  }

  deleteRecord(record: ImportHistory): void {
    const index = this.importHistory.indexOf(record);
    if (index > -1 && confirm(`Delete import record for ${record.fileName}?`)) {
      this.importHistory.splice(index, 1);
      this.importHistory = [...this.importHistory];
    }
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
