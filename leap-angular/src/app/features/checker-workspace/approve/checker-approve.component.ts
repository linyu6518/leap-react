import { Component, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { WorkflowStatus } from '@shared/components/status-badge/status-badge.component';
import { Commentary } from '@shared/components/commentary-drawer/commentary-drawer.component';
import { NotificationService } from '@shared/services/notification.service';

interface WorkflowItem {
  id: string;
  productName: string;
  region: string;
  currentValue: number;
  adjustedValue?: number;
  adjustmentReason?: string;
  variance: number;
  status: WorkflowStatus;
  createdAt: Date;
  createdBy: string;
}

@Component({
  selector: 'app-checker-approve',
  templateUrl: './checker-approve.component.html',
  styleUrls: ['./checker-approve.component.scss']
})
export class CheckerApproveComponent implements OnInit {
  columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 100,
      checkboxSelection: true,
      headerCheckboxSelection: true
    },
    { field: 'productName', headerName: 'Product', width: 200 },
    { field: 'region', headerName: 'Region', width: 120 },
    { field: 'createdBy', headerName: 'Maker', width: 180 },
    {
      field: 'currentValue',
      headerName: 'Current Value',
      width: 150,
      valueFormatter: params => '$' + params.value.toLocaleString()
    },
    {
      field: 'adjustedValue',
      headerName: 'Adjusted Value',
      width: 150,
      valueFormatter: params => params.value ? '$' + params.value.toLocaleString() : 'N/A',
      cellClassRules: {
        'adjusted-cell': params => !!params.value
      }
    },
    {
      field: 'variance',
      headerName: 'Variance',
      width: 140,
      valueFormatter: params => {
        const value = params.value;
        const formatted = '$' + Math.abs(value).toLocaleString();
        return value >= 0 ? '+' + formatted : '-' + formatted;
      },
      cellClassRules: {
        'variance-positive': params => params.value > 0,
        'variance-negative': params => params.value < 0
      }
    },
    {
      field: 'adjustmentReason',
      headerName: 'Reason',
      width: 250,
      wrapText: true,
      autoHeight: true
    },
    {
      headerName: 'Actions',
      width: 280,
      cellRenderer: (params: any) => `
        <button class="action-btn approve-btn" data-action="approve" data-id="${params.data.id}">
          Approve
        </button>
        <button class="action-btn reject-btn" data-action="reject" data-id="${params.data.id}">
          Reject
        </button>
        <button class="action-btn escalate-btn" data-action="escalate" data-id="${params.data.id}">
          Escalate
        </button>
      `,
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        const action = target.getAttribute('data-action');
        const id = target.getAttribute('data-id');

        if (action) {
          this.handleAction(action, params.data);
        }
      }
    }
  ];

  rowData: WorkflowItem[] = [];
  selectedItems: WorkflowItem[] = [];
  selectedItem: WorkflowItem | null = null;
  commentaryOpen = false;
  historyComments: Commentary[] = [];

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true
  };

  // Rejection Dialog
  showRejectDialog = false;
  rejectionReason: string = '';

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadPendingItems();
  }

  private loadPendingItems(): void {
    // 模拟待审批的工作流数据
    this.rowData = Array.from({ length: 15 }, (_, i) => {
      const currentValue = Math.floor(Math.random() * 2000000) + 500000;
      const adjustedValue = i % 2 === 0 ? Math.floor(Math.random() * 2000000) + 500000 : undefined;

      return {
        id: `WF-${1000 + i}`,
        productName: `Product ${String.fromCharCode(65 + (i % 5))}`,
        region: ['Americas', 'EMEA', 'APAC'][i % 3],
        currentValue,
        adjustedValue,
        adjustmentReason: adjustedValue ? 'Corrected calculation error based on updated methodology' : undefined,
        variance: adjustedValue ? adjustedValue - currentValue : 0,
        status: 'pending' as WorkflowStatus,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        createdBy: ['john.doe@bank.com', 'jane.smith@bank.com', 'mike.johnson@bank.com'][i % 3]
      };
    });
  }

  handleAction(action: string, item: WorkflowItem): void {
    this.selectedItem = item;

    switch (action) {
      case 'approve':
        this.approveItem(item);
        break;
      case 'reject':
        this.openRejectDialog(item);
        break;
      case 'escalate':
        this.escalateItem(item);
        break;
    }
  }

  approveItem(item: WorkflowItem): void {
    item.status = 'approved';
    this.notificationService.success(`Item ${item.id} approved successfully`);
    this.loadPendingItems();
  }

  openRejectDialog(item: WorkflowItem): void {
    this.selectedItem = item;
    this.rejectionReason = '';
    this.showRejectDialog = true;
  }

  closeRejectDialog(): void {
    this.showRejectDialog = false;
    this.selectedItem = null;
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.selectedItem) return;

    if (!this.rejectionReason.trim()) {
      this.notificationService.error('Please provide a reason for rejection');
      return;
    }

    this.selectedItem.status = 'rejected';
    this.notificationService.warning(`Item ${this.selectedItem.id} rejected`);
    this.closeRejectDialog();
    this.loadPendingItems();
  }

  escalateItem(item: WorkflowItem): void {
    item.status = 'escalated';
    this.notificationService.info(`Item ${item.id} escalated to senior management`);
    this.loadPendingItems();
  }

  approveBulk(): void {
    if (this.selectedItems.length === 0) {
      this.notificationService.warning('Please select items to approve');
      return;
    }

    this.selectedItems.forEach(item => {
      item.status = 'approved';
    });

    this.notificationService.success(`${this.selectedItems.length} item(s) approved`);
    this.selectedItems = [];
    this.loadPendingItems();
  }

  rejectBulk(): void {
    if (this.selectedItems.length === 0) {
      this.notificationService.warning('Please select items to reject');
      return;
    }

    // Open rejection dialog for bulk reject
    this.showRejectDialog = true;
  }

  viewCommentary(item: WorkflowItem): void {
    this.selectedItem = item;
    this.historyComments = [
      {
        id: 1,
        user: item.createdBy,
        timestamp: item.createdAt,
        content: item.adjustmentReason || 'No adjustment made'
      }
    ];
    this.commentaryOpen = true;
  }

  closeCommentary(): void {
    this.commentaryOpen = false;
    this.selectedItem = null;
  }

  onSelectionChanged(event: any): void {
    this.selectedItems = event.api.getSelectedRows();
  }

  onGridReady(params: any): void {
    params.api.sizeColumnsToFit();
  }
}
