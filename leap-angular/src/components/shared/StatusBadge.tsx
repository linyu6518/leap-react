import { Tag } from 'antd'
import {
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { WorkflowStatus } from '@store/slices/workflowSlice'
import './StatusBadge.scss'

interface StatusBadgeProps {
  status: WorkflowStatus
}

interface StatusConfig {
  label: string
  icon: React.ReactNode
  color: string
}

const statusMap: Record<WorkflowStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    icon: <EditOutlined />,
    color: 'default',
  },
  pending: {
    label: 'Pending Review',
    icon: <ClockCircleOutlined />,
    color: 'processing',
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircleOutlined />,
    color: 'success',
  },
  rejected: {
    label: 'Rejected',
    icon: <CloseCircleOutlined />,
    color: 'error',
  },
  escalated: {
    label: 'Escalated',
    icon: <RiseOutlined />,
    color: 'warning',
  },
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status] || statusMap.draft

  return (
    <Tag
      icon={config.icon}
      color={config.color}
      className={`status-badge ${status}`}
    >
      {config.label}
    </Tag>
  )
}

export default StatusBadge
