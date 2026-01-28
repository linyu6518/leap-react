import { Component, Input } from '@angular/core';

export type WorkflowStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'escalated';

interface StatusConfig {
  label: string;
  icon: string;
  class: string;
}

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() status: WorkflowStatus = 'draft';

  private readonly statusMap: Record<WorkflowStatus, StatusConfig> = {
    draft: { label: 'Draft', icon: 'edit', class: 'draft' },
    pending: { label: 'Pending Review', icon: 'schedule', class: 'pending' },
    approved: { label: 'Approved', icon: 'check_circle', class: 'approved' },
    rejected: { label: 'Rejected', icon: 'cancel', class: 'rejected' },
    escalated: { label: 'Escalated', icon: 'trending_up', class: 'escalated' }
  };

  get config(): StatusConfig {
    return this.statusMap[this.status] || this.statusMap.draft;
  }
}
