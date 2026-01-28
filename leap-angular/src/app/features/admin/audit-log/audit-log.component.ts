import { Component, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { ExportService } from '@shared/services/export.service';
import { FormControl, FormGroup } from '@angular/forms';

interface AuditLogEntry {
  id: number;
  timestamp: Date;
  user: string;
  action: string;
  objectType: string;
  objectId: string;
  oldValue: string;
  newValue: string;
  ipAddress: string;
}

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss']
})
export class AuditLogComponent implements OnInit {
  columnDefs: ColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      valueFormatter: params => new Date(params.value).toLocaleString()
    },
    { field: 'user', headerName: 'User', width: 150, filter: 'agTextColumnFilter' },
    { field: 'action', headerName: 'Action', width: 120, filter: 'agSetColumnFilter' },
    { field: 'objectType', headerName: 'Object Type', width: 140 },
    { field: 'objectId', headerName: 'Object ID', width: 120 },
    { field: 'oldValue', headerName: 'Old Value', width: 200, wrapText: true, autoHeight: true },
    { field: 'newValue', headerName: 'New Value', width: 200, wrapText: true, autoHeight: true },
    { field: 'ipAddress', headerName: 'IP Address', width: 140 }
  ];

  rowData: AuditLogEntry[] = [];

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true
  };

  filterForm = new FormGroup({
    startDate: new FormControl(),
    endDate: new FormControl(),
    user: new FormControl(''),
    action: new FormControl('')
  });

  actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT'];

  constructor(private exportService: ExportService) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  private loadAuditLogs(): void {
    // 模拟审计日志数据
    this.rowData = Array.from({ length: 100 }, (_, i) => {
      const actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT'];
      const users = ['john.doe@bank.com', 'jane.smith@bank.com', 'mike.johnson@bank.com', 'sarah.williams@bank.com'];
      const objectTypes = ['Product', 'Commentary', 'Workflow', 'User', 'Role'];

      return {
        id: i + 1,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        user: users[i % users.length],
        action: actions[i % actions.length],
        objectType: objectTypes[i % objectTypes.length],
        objectId: `OBJ-${1000 + i}`,
        oldValue: this.generateOldValue(actions[i % actions.length]),
        newValue: this.generateNewValue(actions[i % actions.length]),
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private generateOldValue(action: string): string {
    if (action === 'CREATE' || action === 'LOGIN' || action === 'LOGOUT') {
      return 'N/A';
    }
    if (action === 'DELETE') {
      return '{"status": "active", "balance": 1000000}';
    }
    return '{"status": "pending", "balance": 950000}';
  }

  private generateNewValue(action: string): string {
    if (action === 'DELETE' || action === 'LOGIN' || action === 'LOGOUT') {
      return 'N/A';
    }
    if (action === 'CREATE') {
      return '{"status": "active", "balance": 1000000}';
    }
    return '{"status": "approved", "balance": 1050000}';
  }

  applyFilters(): void {
    const { startDate, endDate, user, action } = this.filterForm.value;

    // 在实际应用中,这里会调用API
    console.log('Applying filters:', { startDate, endDate, user, action });
    this.loadAuditLogs();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.loadAuditLogs();
  }

  exportToExcel(): void {
    this.exportService.exportToExcel(this.rowData, 'audit-log');
  }

  exportToCSV(): void {
    this.exportService.exportToCSV(this.rowData, 'audit-log');
  }

  onGridReady(params: any): void {
    params.api.sizeColumnsToFit();
  }
}
