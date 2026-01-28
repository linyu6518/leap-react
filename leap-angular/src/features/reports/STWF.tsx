import { Card, Table, Button } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import { exportService } from '@services/exportService'

function STWF() {
  const columns = [
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `$${v?.toLocaleString()}` },
    { title: 'Status', dataIndex: 'status', key: 'status' },
  ]

  const mockData = [
    { category: 'Short-term Funding', amount: 2500000, status: 'Active' },
    { category: 'Medium-term Funding', amount: 1800000, status: 'Active' },
    { category: 'Long-term Funding', amount: 3200000, status: 'Active' },
  ]

  return (
    <Card
      title="STWF Report"
      extra={<Button icon={<ExportOutlined />} onClick={() => exportService.exportToCSV(mockData, 'stwf-report.csv')}>Export</Button>}
    >
      <Table columns={columns} dataSource={mockData} rowKey="category" />
    </Card>
  )
}

export default STWF
