import { Card, Table, Button, Space } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

function ProductMapping() {
  const columns = [
    { title: 'Product Code', dataIndex: 'code', key: 'code' },
    { title: 'Product Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>Edit</Button>
          <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
        </Space>
      ),
    },
  ]

  const mockData = [
    { code: 'DEP001', name: 'Retail Deposits', category: 'Deposits' },
    { code: 'LOAN001', name: 'Corporate Loans', category: 'Loans' },
    { code: 'SEC001', name: 'Government Securities', category: 'Securities' },
  ]

  return (
    <Card title="Product Mapping" extra={<Button type="primary">Add Mapping</Button>}>
      <Table columns={columns} dataSource={mockData} rowKey="code" />
    </Card>
  )
}

export default ProductMapping
