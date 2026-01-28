import { useNavigate } from 'react-router-dom'
import { Card, DatePicker, Button, Form } from 'antd'
import { FileTextOutlined, CalendarOutlined } from '@ant-design/icons'
import { TDSelect, Option } from '@components/shared'
import './LCRView.scss'

function LCRView() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const formValues = Form.useWatch([], form)

  const handleView = (values: any) => {
    navigate('/regulatory/lcr/detail', {
      state: {
        enterprise: values.enterprise,
        segment: values.segment,
        prior: values.prior ? values.prior.toISOString() : '',
        current: values.current ? values.current.toISOString() : '',
      },
    })
  }

  return (
    <div className="lcr-container">
      <div className="page-header">
        <div className="page-title">
          <FileTextOutlined className="page-icon" />
          <div className="title-breadcrumb">
            <a 
              href="#" 
              className="breadcrumb-link"
              onClick={(e) => {
                e.preventDefault()
                navigate('/regulatory/lcr')
              }}
            >
              Regulatory
            </a>
            <span className="breadcrumb-separator">-</span>
            <a 
              href="#" 
              className="breadcrumb-link"
              onClick={(e) => {
                e.preventDefault()
                navigate('/regulatory/lcr')
              }}
            >
              Metrics
            </a>
            <span className="breadcrumb-separator">-</span>
            <span className="breadcrumb-current">LCR</span>
          </div>
        </div>
      </div>

      <div className="lcr-page-content">
        <Card className="selection-card">
          <div className="header">
            <h2>Report Config</h2>
            <p className="subtitle">
              Configure the enterprise, segment and time parameters to analyze LCR metrics.
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            className="compact-form"
            onFinish={handleView}
          >
            {/* 1. Enterprise */}
            <Form.Item
              name="enterprise"
              label=""
              rules={[{ required: true, message: 'Enterprise is required' }]}
            >
              <TDSelect
                placeholder="Select an enterprise"
                floatingLabelText="Enterprise"
                size="large"
              >
                <Option value="Enterprise">Enterprise</Option>
                <Option value="CAD Retail">CAD Retail</Option>
                <Option value="US Retail">US Retail</Option>
                <Option value="Wholesale">Wholesale</Option>
              </TDSelect>
            </Form.Item>

            {/* 2. Segment */}
            <Form.Item
              name="segment"
              label=""
              rules={[{ required: true, message: 'Segment is required' }]}
            >
              <TDSelect
                placeholder="Select a segment"
                floatingLabelText="Segment"
                size="large"
              >
                <Option value="Enterprise">Enterprise</Option>
                <Option value="CAD Retail">CAD Retail</Option>
                <Option value="US Retail">US Retail</Option>
                <Option value="Wholesale">Wholesale</Option>
              </TDSelect>
            </Form.Item>

            {/* 3. Prior and Current Dates */}
            <div className="date-row">
              <Form.Item
                name="prior"
                label=""
                rules={[{ required: true, message: 'Prior date is required' }]}
                style={{ flex: 1 }}
              >
                <DatePicker
                  placeholder="Prior *"
                  className="lcr-datepicker"
                  size="large"
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                  suffixIcon={<CalendarOutlined style={{ color: '#008A00' }} />}
                />
              </Form.Item>

              <Form.Item
                name="current"
                label=""
                rules={[{ required: true, message: 'Current date is required' }]}
                style={{ flex: 1 }}
              >
                <DatePicker
                  placeholder="Current *"
                  className="lcr-datepicker"
                  size="large"
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                  suffixIcon={<CalendarOutlined style={{ color: '#008A00' }} />}
                />
              </Form.Item>
            </div>

            <Form.Item shouldUpdate>
              {() => (
                <>
                  <div className="form-divider"></div>
                  <div className="form-actions">
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="view-button"
                      disabled={
                        !form.isFieldsTouched(true) ||
                        !!form.getFieldsError().filter(({ errors }) => errors.length).length ||
                        !formValues?.enterprise ||
                        !formValues?.segment ||
                        !formValues?.prior ||
                        !formValues?.current
                      }
                    >
                      View Analytics
                    </Button>
                  </div>
                </>
              )}
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default LCRView
