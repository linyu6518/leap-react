import { Card, Form, Switch, Button, Space } from 'antd'
import { TDInput } from '@components/shared'

function SystemSettings() {
  const [form] = Form.useForm()

  return (
    <Card title="System Settings">
      <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item label="System Name" name="systemName" initialValue="LEAP">
          <TDInput placeholder="System Name" />
        </Form.Item>
        <Form.Item label="Enable Notifications" name="notifications" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
        <Form.Item label="Enable Audit Logging" name="auditLog" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary">Save Settings</Button>
            <Button>Reset</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default SystemSettings
