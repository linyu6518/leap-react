import { Card, Table, DatePicker, Select, Button, Space } from 'antd'
import { SearchOutlined, ExportOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { mockDataService } from '@services/mockDataService'
import { exportService } from '@services/exportService'

const { RangePicker } = DatePicker

function AuditLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await mockDataService.getAuditLogs()
      setLogs(data)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Object',
      dataIndex: 'object',
      key: 'object',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
    },
  ]

  return (
    <Card
      title="Audit Log"
      extra={
        <Space>
          <Select placeholder="Filter by Action" style={{ width: 150 }} allowClear>
            <Select.Option value="Login">Login</Select.Option>
            <Select.Option value="Query">Query</Select.Option>
            <Select.Option value="Adjust">Adjust</Select.Option>
            <Select.Option value="Export">Export</Select.Option>
          </Select>
          <RangePicker />
          <Button icon={<SearchOutlined />} onClick={loadLogs}>
            Search
          </Button>
          <Button icon={<ExportOutlined />} onClick={() => exportService.exportToCSV(logs, 'audit-log.csv')}>
            Export
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </Card>
  )
}

export default AuditLog
