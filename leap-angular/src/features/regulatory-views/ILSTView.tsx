import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, Table, Progress } from 'antd'
import { mockDataService } from '@services/mockDataService'

function ILSTView() {
  const [ilstData, setIlstData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await mockDataService.getILSTData()
      setIlstData(data)
    } catch (error) {
      console.error('Failed to load ILST data:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Metric',
      dataIndex: 'metric',
      key: 'metric',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          status={score >= 80 ? 'success' : score >= 60 ? 'active' : 'exception'}
        />
      ),
    },
  ]

  return (
    <div className="ilst-view-container">
      <Card title="ILST (Internal Liquidity Stress Test)" loading={loading}>
        {ilstData && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Statistic
                  title="Internal Liquidity Score"
                  value={ilstData.internalLiquidityScore}
                  suffix="/100"
                  valueStyle={{
                    fontSize: 48,
                    color: ilstData.internalLiquidityScore >= 80 ? '#3f8600' : ilstData.internalLiquidityScore >= 60 ? '#faad14' : '#cf1322',
                  }}
                />
              </Col>
            </Row>

            <Table
              dataSource={ilstData.metrics}
              columns={columns}
              rowKey="metric"
              pagination={false}
            />
          </>
        )}
      </Card>
    </div>
  )
}

export default ILSTView
