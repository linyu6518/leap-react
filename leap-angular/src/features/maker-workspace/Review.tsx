import { Card, Table, Button, Space } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import StatusBadge from '@components/shared/StatusBadge'

function Review() {

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
            Submit
          </Button>
          <Button icon={<CloseOutlined />} size="small">
            Cancel
          </Button>
        </Space>
      ),
    },
  ]

  const mockData = [
    {
      id: 1,
      title: 'Deposits Review Q1 2024',
      status: 'draft',
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
    <Card title="Maker Review Workspace">
      <Table columns={columns} dataSource={mockData} rowKey="id" />
    </Card>
  )
}

export default Review
