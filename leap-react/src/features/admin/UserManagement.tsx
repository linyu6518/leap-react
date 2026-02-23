import { Card, Table, Button, Space, Tag } from 'antd'
import { EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons'

function UserManagement() {
  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  const mockData = [
    {
      id: 1,
      username: 'maker1',
      fullName: 'John Maker',
      email: 'maker1@leap.com',
      role: 'maker',
    },
    {
      id: 2,
      username: 'checker1',
      fullName: 'Jane Checker',
      email: 'checker1@leap.com',
      role: 'checker',
    },
    {
      id: 3,
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@leap.com',
      role: 'admin',
    },
  ]

  return (
    <Card title="User Management" extra={<Button type="primary" icon={<UserAddOutlined />}>Add User</Button>}>
      <Table columns={columns} dataSource={mockData} rowKey="id" />
    </Card>
  )
}

export default UserManagement
