import { Card, Table, Button } from 'antd'

function ThresholdSettings() {

  const columns = [
    { title: 'Product Type', dataIndex: 'productType', key: 'productType' },
    { title: 'Warning Threshold', dataIndex: 'warning', key: 'warning', render: (v: number) => `$${v?.toLocaleString()}` },
    { title: 'Critical Threshold', dataIndex: 'critical', key: 'critical', render: (v: number) => `$${v?.toLocaleString()}` },
    {
      title: 'Actions',
      key: 'actions',
      render: () => <Button type="link">Edit</Button>,
    },
  ]

  const mockData = [
    { productType: 'Deposits', warning: 50000, critical: 100000 },
    { productType: 'Loans', warning: 75000, critical: 150000 },
    { productType: 'Securities', warning: 100000, critical: 200000 },
  ]

  return (
    <Card title="Threshold Settings">
      <Table columns={columns} dataSource={mockData} rowKey="productType" />
    </Card>
  )
}

export default ThresholdSettings
