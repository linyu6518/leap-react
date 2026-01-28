import { Card, Table, Button } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import { exportService } from '@services/exportService'

function AppendixVI() {
  const columns = [
    { title: 'Item', dataIndex: 'item', key: 'item' },
    { title: 'Value', dataIndex: 'value', key: 'value', render: (v: number) => `$${v?.toLocaleString()}` },
  ]

  const mockData = [
    { item: 'Total Assets', value: 15000000000 },
    { item: 'Total Liabilities', value: 12000000000 },
    { item: 'Equity', value: 3000000000 },
  ]

  return (
    <Card
      title="Appendix VI Report"
      extra={<Button icon={<ExportOutlined />} onClick={() => exportService.exportToCSV(mockData, 'appendix-vi-report.csv')}>Export</Button>}
    >
      <Table columns={columns} dataSource={mockData} rowKey="item" />
    </Card>
  )
}

export default AppendixVI
