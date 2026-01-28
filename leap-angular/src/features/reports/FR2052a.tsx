import { Card, Table, Button } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import { exportService } from '@services/exportService'

function FR2052a() {
  const columns = [
    {
      title: 'Product ID',
      dataIndex: 'pid',
      key: 'pid',
    },
    {
      title: 'Product Name',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: 'Amount 1',
      dataIndex: 'amount1',
      key: 'amount1',
      render: (value: number) => value ? `$${value.toLocaleString()}` : '-',
    },
    {
      title: 'Amount 2',
      dataIndex: 'amount2',
      key: 'amount2',
      render: (value: number) => value ? `$${value.toLocaleString()}` : '-',
    },
    {
      title: 'Amount 3',
      dataIndex: 'amount3',
      key: 'amount3',
      render: (value: number) => value ? `$${value.toLocaleString()}` : '-',
    },
  ]

  const mockData = [
    { pid: 'PID-1001', product: 'Retail Deposits', amount1: 5000000, amount2: 4800000, amount3: 200000 },
    { pid: 'PID-1002', product: 'Corporate Deposits', amount1: 8000000, amount2: 7500000, amount3: 500000 },
    { pid: 'PID-1003', product: 'Treasury Securities', amount1: 12000000, amount2: 11500000, amount3: 500000 },
  ]

  const handleExport = () => {
    exportService.exportToCSV(mockData, 'fr2052a-report.csv')
  }

  return (
    <Card
      title="FR2052a Report"
      extra={
        <Button icon={<ExportOutlined />} onClick={handleExport}>
          Export
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={mockData}
        rowKey="pid"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  )
}

export default FR2052a
