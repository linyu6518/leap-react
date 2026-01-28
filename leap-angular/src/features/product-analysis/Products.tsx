import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, DatePicker, Button, Form } from 'antd'
import { FolderOutlined, CalendarOutlined } from '@ant-design/icons'
import { TDSelect, Option } from '@components/shared'
import { saveDepositsQueryParams, loadDepositsQueryParams } from '@utils/queryParamsStorage'
import './Products.scss'

function Products() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const formValues = Form.useWatch([], form)

  // Load saved params on mount
  useEffect(() => {
    const savedParams = loadDepositsQueryParams()
    if (savedParams.region || savedParams.segment || savedParams.prior || savedParams.current) {
      form.setFieldsValue({
        region: savedParams.region || undefined,
        segment: savedParams.segment || undefined,
        prior: savedParams.prior || undefined,
        current: savedParams.current || undefined,
      })
    }
  }, [form])

  const handleView = (values: any) => {
    // Save to sessionStorage when user submits
    saveDepositsQueryParams({
      region: values.region,
      segment: values.segment,
      prior: values.prior,
      current: values.current,
    })
    
    navigate('/product/deposits', {
      state: {
        region: values.region,
        segment: values.segment,
        prior: values.prior ? values.prior.toISOString() : '',
        current: values.current ? values.current.toISOString() : '',
      },
    })
  }

  return (
    <div className="products-container">
      <div className="page-header">
        <div className="page-title">
          <FolderOutlined />
          <span>Products</span>
        </div>
      </div>

      <div className="products-page-content">
        <Card className="selection-card">
          <div className="header">
            <h2>Report Config</h2>
            <p className="subtitle">
              Configure the region and time parameters to analyze liquidity metrics across products.
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            className="compact-form"
            onFinish={handleView}
            initialValues={loadDepositsQueryParams()}
          >
            {/* 1. Region */}
            <Form.Item
              name="region"
              label=""
              rules={[{ required: true, message: 'Region is required' }]}
            >
              <TDSelect
                placeholder="Select a region"
                floatingLabelText="Region"
                size="large"
              >
                <Option value="US">US</Option>
                <Option value="CAD">CAD</Option>
                <Option value="Europe">Europe</Option>
                <Option value="Enterprise">Enterprise</Option>
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
                  className="products-datepicker"
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
                  className="products-datepicker"
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
                            !formValues?.region ||
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

export default Products
