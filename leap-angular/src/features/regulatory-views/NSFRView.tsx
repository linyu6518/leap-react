import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, Table } from 'antd'
import { mockDataService } from '@services/mockDataService'

function NSFRView() {
  const [nsfrData, setNsfrData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await mockDataService.getNSFRData()
      setNsfrData(data)
    } catch (error) {
      console.error('Failed to load NSFR data:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Region',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: 'ASF',
      dataIndex: 'asf',
      key: 'asf',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'RSF',
      dataIndex: 'rsf',
      key: 'rsf',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'NSFR Ratio',
      dataIndex: 'nsfrRatio',
      key: 'nsfrRatio',
      render: (value: number) => `${value}%`,
    },
  ]

  return (
    <div className="nsfr-view-container">
      <Card title="NSFR (Net Stable Funding Ratio)" loading={loading}>
        {nsfrData && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic
                  title="Total ASF"
                  value={nsfrData.asf}
                  prefix="$"
                  formatter={(value) => value.toLocaleString()}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total RSF"
                  value={nsfrData.rsf}
                  prefix="$"
                  formatter={(value) => value.toLocaleString()}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="NSFR Ratio"
                  value={nsfrData.nsfrRatio}
                  suffix="%"
                  valueStyle={{ color: nsfrData.nsfrRatio >= 100 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
            </Row>

            <Table
              dataSource={nsfrData.products}
              columns={columns}
              rowKey={(record: any, index?: number) => `${record.region}-${record.product}-${index || 0}`}
              pagination={false}
            />
          </>
        )}
      </Card>
    </div>
  )
}

export default NSFRView
