import { Component, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
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
  status: WorkflowStatus;
  createdAt: Date;
  createdBy: string;
}

@Component({
  selector: 'app-maker-review',
  templateUrl: './maker-review.component.html',
  styleUrls: ['./maker-review.component.scss']
})
export class MakerReviewComponent implements OnInit {
  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'productName', headerName: 'Product', width: 200 },
    { field: 'region', headerName: 'Region', width: 120 },
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
      valueFormatter: params => params.value ? '$' + params.value.toLocaleString() : 'N/A'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      cellRenderer: (params: any) => {
        const statusMap: Record<WorkflowStatus, string> = {
          draft: 'Draft',
          pending: 'Pending Review',
          approved: 'Approved',
          rejected: 'Rejected',
          escalated: 'Escalated'
        };
        const status = params.value as WorkflowStatus;
        return `<span class="status-${params.value}">${statusMap[status] || 'Unknown'}</span>`;
      }
    },
    {
      headerName: 'Actions',
      width: 250,
      cellRenderer: (params: any) => {
        if (params.data.status === 'draft') {
          return `
            <button class="action-btn adjust-btn" data-action="adjust" data-id="${params.data.id}">
              Adjust
            </button>
            <button class="action-btn comment-btn" data-action="comment" data-id="${params.data.id}">
              Comment
            </button>
          `;
        }
        return 'N/A';
      },
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        const action = target.getAttribute('data-action');
        const id = target.getAttribute('data-id');

        if (action === 'adjust') {
          this.openAdjustDialog(params.data);
        } else if (action === 'comment') {
          this.openCommentary(params.data);
        }
      }
    }
  ];

  rowData: WorkflowItem[] = [];
  selectedItem: WorkflowItem | null = null;
  commentaryOpen = false;
  historyComments: Commentary[] = [];

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true
  };

  // Adjustment Dialog
  showAdjustDialog = false;
  adjustmentValue: number = 0;
  adjustmentReason: string = '';

  constructor(
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadWorkflowItems();
  }

  private loadWorkflowItems(): void {
    // 模拟工作流数据
    this.rowData = Array.from({ length: 20 }, (_, i) => ({
      id: `WF-${1000 + i}`,
      productName: `Product ${String.fromCharCode(65 + (i % 5))}`,
      region: ['Americas', 'EMEA', 'APAC'][i % 3],
      currentValue: Math.floor(Math.random() * 2000000) + 500000,
      adjustedValue: i % 3 === 0 ? Math.floor(Math.random() * 2000000) + 500000 : undefined,
      adjustmentReason: i % 3 === 0 ? 'Corrected calculation error' : undefined,
      status: (i % 2 === 0 ? 'draft' : 'pending') as WorkflowStatus,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      createdBy: 'current.user@bank.com'
    }));
  }

  openAdjustDialog(item: WorkflowItem): void {
    this.selectedItem = item;
    this.adjustmentValue = item.adjustedValue || item.currentValue;
    this.adjustmentReason = item.adjustmentReason || '';
    this.showAdjustDialog = true;
  }

  closeAdjustDialog(): void {
    this.showAdjustDialog = false;
    this.selectedItem = null;
    this.adjustmentValue = 0;
    this.adjustmentReason = '';
  }

  saveAdjustment(): void {
    if (!this.selectedItem) return;

    if (!this.adjustmentReason.trim()) {
      this.notificationService.error('Please provide a reason for adjustment');
      return;
    }

    this.selectedItem.adjustedValue = this.adjustmentValue;
    this.selectedItem.adjustmentReason = this.adjustmentReason;

    this.notificationService.success('Adjustment saved successfully');
    this.closeAdjustDialog();
    this.loadWorkflowItems(); // Refresh data
  }

  openCommentary(item: WorkflowItem): void {
    this.selectedItem = item;
    this.historyComments = [
      {
        id: 1,
        user: 'John Doe',
        timestamp: new Date(Date.now() - 86400000),
        content: 'Initial review completed - awaiting adjustment.'
      }
    ];
    this.commentaryOpen = true;
  }

  closeCommentary(): void {
    this.commentaryOpen = false;
    this.selectedItem = null;
  }

  saveCommentary(content: string): void {
    console.log('Save commentary:', content, 'for item:', this.selectedItem);
    this.notificationService.success('Commentary saved');
    this.commentaryOpen = false;
  }

  submitForReview(): void {
    const draftItems = this.rowData.filter(item => item.status === 'draft');

    if (draftItems.length === 0) {
      this.notificationService.warning('No draft items to submit');
      return;
    }

    // Update status to pending
    draftItems.forEach(item => {
      item.status = 'pending';
    });

    this.notificationService.success(`${draftItems.length} item(s) submitted for review`);
    this.loadWorkflowItems(); // Refresh data
  }

  onGridReady(params: any): void {
    params.api.sizeColumnsToFit();
  }
}
