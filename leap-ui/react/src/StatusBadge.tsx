import React from 'react'
import { Tag } from 'antd'
import {
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import './StatusBadge.scss'

export type LeapStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'escalated'

export interface StatusBadgeProps {
  status: LeapStatus
}

const statusMap: Record<LeapStatus, { label: string; icon: React.ReactNode; color: string }> = {
  draft: { label: 'Draft', icon: <EditOutlined />, color: 'default' },
  pending: { label: 'Pending Review', icon: <ClockCircleOutlined />, color: 'processing' },
  approved: { label: 'Approved', icon: <CheckCircleOutlined />, color: 'success' },
  rejected: { label: 'Rejected', icon: <CloseCircleOutlined />, color: 'error' },
  escalated: { label: 'Escalated', icon: <RiseOutlined />, color: 'warning' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status] ?? statusMap.draft
  return (
    <Tag icon={config.icon} color={config.color} className={`leap-status-badge leap-status-badge-${status}`}>
      {config.label}
    </Tag>
  )
}

export default StatusBadge
