import { useEffect } from 'react'
import { Form, DatePicker, Button } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import TDSelect, { Option } from './TDSelect'
import './QueryPanel.scss'

export interface QueryParams {
  region: string | null
  segment: string | null
  prior: Dayjs | null
  current: Dayjs | null
}

interface QueryPanelProps {
  initialValues?: Partial<QueryParams>
  onQuery: (params: QueryParams) => void
}

function QueryPanel({ initialValues, onQuery }: QueryPanelProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        region: initialValues.region || undefined,
        segment: initialValues.segment || undefined,
        prior: initialValues.prior ? dayjs(initialValues.prior) : undefined,
        current: initialValues.current ? dayjs(initialValues.current) : undefined,
      })
    }
  }, [initialValues, form])

  const handleSubmit = (values: any) => {
    const params: QueryParams = {
      region: values.region || null,
      segment: values.segment || null,
      prior: values.prior || null,
      current: values.current || null,
    }
    onQuery(params)
  }


  return (
    <div className="query-panel">
      <Form
        form={form}
        onFinish={handleSubmit}
        initialValues={{
          region: initialValues?.region || undefined,
          segment: initialValues?.segment || undefined,
          prior: initialValues?.prior ? dayjs(initialValues.prior) : undefined,
          current: initialValues?.current ? dayjs(initialValues.current) : undefined,
        }}
      >
        <div className="query-row">
        <Form.Item
          name="region"
          rules={[{ required: true, message: 'Region is required' }]}
          className="filter-field"
          style={{ flex: 1, minWidth: 250 }}
        >
          <TDSelect
            placeholder="Select a region"
            floatingLabelText="Region"
            size="large"
            style={{ width: '100%' }}
          >
            <Option value="US">US</Option>
            <Option value="CAD">CAD</Option>
            <Option value="Europe">Europe</Option>
            <Option value="Enterprise">Enterprise</Option>
          </TDSelect>
        </Form.Item>

        <Form.Item
          name="segment"
          rules={[{ required: true, message: 'Segment is required' }]}
          className="filter-field"
          style={{ flex: 1, minWidth: 250 }}
        >
          <TDSelect
            placeholder="Select a segment"
            floatingLabelText="Segment"
            size="large"
            style={{ width: '100%' }}
          >
            <Option value="Enterprise">Enterprise</Option>
            <Option value="CAD Retail">CAD Retail</Option>
            <Option value="US Retail">US Retail</Option>
            <Option value="Wholesale">Wholesale</Option>
          </TDSelect>
        </Form.Item>

        <Form.Item
          name="prior"
          rules={[{ required: true, message: 'Prior date is required' }]}
          className="filter-field date-field"
          style={{ flex: 1, minWidth: 220 }}
        >
          <DatePicker 
            placeholder="Prior *" 
            className="query-datepicker"
            size="large"
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
            suffixIcon={<CalendarOutlined style={{ color: '#008A00' }} />}
          />
        </Form.Item>

        <Form.Item
          name="current"
          rules={[{ required: true, message: 'Current date is required' }]}
          className="filter-field date-field"
          style={{ flex: 1, minWidth: 220 }}
        >
          <DatePicker 
            placeholder="Current *" 
            className="query-datepicker"
            size="large"
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
            suffixIcon={<CalendarOutlined style={{ color: '#008A00' }} />}
          />
        </Form.Item>

        <Form.Item 
          className="button-field"
          style={{ flex: '0 0 200px', minWidth: 200, maxWidth: 200 }}
        >
          <Button
            type="primary"
            htmlType="submit"
            className="query-button"
          >
            View Analytics
          </Button>
        </Form.Item>
        </div>
      </Form>
    </div>
  )
}

export default QueryPanel
