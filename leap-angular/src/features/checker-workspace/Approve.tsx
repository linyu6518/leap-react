import { Card, Table, Button, Space } from 'antd'
import { CheckOutlined, CloseOutlined, RiseOutlined } from '@ant-design/icons'
import StatusBadge from '@components/shared/StatusBadge'

function Approve() {
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status as any} />,
    },
    {
      title: 'Submitted By',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
    },
    {
      title: 'Submitted At',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="primary" icon={<CheckOutlined />} size="small">
            Approve
          </Button>
          <Button danger icon={<CloseOutlined />} size="small">
            Reject
          </Button>
          <Button icon={<RiseOutlined />} size="small">
            Escalate
          </Button>
        </Space>
      ),
    },
  ]

  const mockData = [
    {
      id: 1,
      title: 'Deposits Review Q1 2024',
      status: 'pending',
      submittedBy: 'maker1',
      submittedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'LCR Analysis Update',
      status: 'pending',
      submittedBy: 'maker1',
      submittedAt: new Date().toISOString(),
    },
  ]

  return (
    <Card title="Checker Approval Workspace">
      <Table columns={columns} dataSource={mockData} rowKey="id" />
    </Card>
  )
}

export default Approve
