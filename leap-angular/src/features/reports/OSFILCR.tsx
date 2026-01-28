import { Card, Table, Button } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import { exportService } from '@services/exportService'

function OSFILCR() {
  const columns = [
    { title: 'Metric', dataIndex: 'metric', key: 'metric' },
    { title: 'Value', dataIndex: 'value', key: 'value', render: (v: number) => `$${v?.toLocaleString()}` },
    { title: 'Ratio', dataIndex: 'ratio', key: 'ratio', render: (v: number) => `${v}%` },
  ]

  const mockData = [
    { metric: 'High Quality Liquid Assets', value: 5250000000, ratio: 128 },
    { metric: 'Net Cash Outflows', value: 4100000000, ratio: 100 },
  ]

  return (
    <Card
      title="OSFI LCR Report"
      extra={<Button icon={<ExportOutlined />} onClick={() => exportService.exportToCSV(mockData, 'osfi-lcr-report.csv')}>Export</Button>}
    >
      <Table columns={columns} dataSource={mockData} rowKey="metric" />
    </Card>
  )
}

export default OSFILCR
