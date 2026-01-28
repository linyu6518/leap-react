import { useEffect } from 'react'
import { Drawer, Form, Input, Button, List, Avatar } from 'antd'
import { SaveOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import './CommentaryDrawer.scss'

const { TextArea } = Input

export interface Commentary {
  id: number
  user: string
  timestamp: Date
  content: string
}

interface CommentaryDrawerProps {
  isOpen: boolean
  historyComments: Commentary[]
  productName?: string
  onClose: () => void
  onSave: (content: string) => void
}

function CommentaryDrawer({
  isOpen,
  historyComments,
  productName = '',
  onClose,
  onSave,
}: CommentaryDrawerProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (!isOpen) {
      form.resetFields()
    }
  }, [isOpen, form])

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave(values.content)
      form.resetFields()
    })
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Drawer
      title={`Commentary - ${productName}`}
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={480}
      className="commentary-drawer"
      footer={
        <div className="drawer-footer">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSave}
            icon={<SaveOutlined />}
            disabled={!form.getFieldValue('content') || form.getFieldValue('content').length < 10}
          >
            Save
          </Button>
        </div>
      }
    >
      <div className="drawer-body">
        {historyComments.length > 0 && (
          <div className="history-section">
            <h4 className="section-title">History</h4>
            <List
              dataSource={historyComments}
              renderItem={(comment) => (
                <List.Item className="comment-item">
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div className="comment-header">
                        <span className="user-name">{comment.user}</span>
                        <span className="comment-time">
                          {dayjs(comment.timestamp).format('MMM D, YYYY HH:mm')}
                        </span>
                      </div>
                    }
                    description={<div className="comment-content">{comment.content}</div>}
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        <div className="new-comment-section">
          <h4 className="section-title">Add New Commentary</h4>
          <Form form={form} layout="vertical">
            <Form.Item
              name="content"
              rules={[
                { required: true, message: 'Commentary is required' },
                { min: 10, message: 'Minimum 10 characters required' },
              ]}
            >
              <TextArea
                rows={6}
                placeholder="Enter your commentary here..."
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </Form>
        </div>
      </div>
    </Drawer>
  )
}

export default CommentaryDrawer
