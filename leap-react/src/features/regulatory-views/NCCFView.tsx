import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, Table, Progress } from 'antd'
import { mockDataService } from '@services/mockDataService'

function NCCFView() {
  const [nccfData, setNccfData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await mockDataService.getNCCFData()
      setNccfData(data)
    } catch (error) {
      console.error('Failed to load NCCF data:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (value: number) => (
        <Progress percent={value} size="small" status="active" />
      ),
    },
  ]

  return (
    <div className="nccf-view-container">
      <Card title="NCCF (Net Cash Capital Flow)" loading={loading}>
        {nccfData && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic
                  title="Total Assets"
                  value={nccfData.totalAssets}
                  prefix="$"
                  formatter={(value) => value.toLocaleString()}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Liquid Assets"
                  value={nccfData.liquidAssets}
                  prefix="$"
                  formatter={(value) => value.toLocaleString()}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="NCCF Ratio"
                  value={nccfData.nccfRatio}
                  suffix="%"
                  valueStyle={{ color: nccfData.nccfRatio >= 30 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
            </Row>

            <Table
              dataSource={nccfData.breakdown}
              columns={columns}
              rowKey="category"
              pagination={false}
            />
          </>
        )}
      </Card>
    </div>
  )
}

export default NCCFView
