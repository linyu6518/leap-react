import { Component, Input } from '@angular/core'

export type LeapStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'escalated'

@Component({
  selector: 'leap-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
})
export class StatusBadgeComponent {
  @Input() status: LeapStatus = 'draft'

  statusMap: Record<LeapStatus, { label: string; nzColor: string; icon: string }> = {
    draft: { label: 'Draft', nzColor: 'default', icon: 'edit' },
    pending: { label: 'Pending Review', nzColor: 'processing', icon: 'clock-circle' },
    approved: { label: 'Approved', nzColor: 'success', icon: 'check-circle' },
    rejected: { label: 'Rejected', nzColor: 'error', icon: 'close-circle' },
    escalated: { label: 'Escalated', nzColor: 'warning', icon: 'rise' },
  }

  get config() {
    return this.statusMap[this.status] ?? this.statusMap.draft
  }
}
