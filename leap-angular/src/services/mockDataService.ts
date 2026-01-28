import { ProductData, QueryParams } from '@store/slices/productSlice'
import { Workflow } from '@store/slices/workflowSlice'

class MockDataService {
  // 模拟API响应延迟
  private readonly DELAY_MS = 500

  // In-memory data stores
  private products: ProductData[] = []
  private workflows: Workflow[] = []
  private auditLogs: any[] = []

  constructor() {
    this.initializeMockData()
  }

  private initializeMockData(): void {
    // Initialize products data
    this.products = Array.from({ length: 100 }, (_, i) => {
      const current = Math.floor(Math.random() * 1000000) + 500000
      const prev = Math.floor(Math.random() * 1000000) + 500000
      return {
        id: i + 1,
        region: ['North America', 'Europe', 'Asia Pacific'][i % 3],
        internalCategory: ['Retail', 'Corporate', 'Treasury'][i % 3],
        product: ['Deposits', 'BuyBack', 'Loan Commitments'][i % 3],
        subProduct: `Sub-${String.fromCharCode(65 + (i % 5))}`,
        pid: `PID-${1000 + i}`,
        current,
        prev,
        variance: current - prev,
        threshold: 50000,
        commentary: i % 5 === 0 ? `Commentary for product ${i + 1}` : undefined,
      }
    })

    // Initialize workflows
    this.workflows = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: `Workflow ${i + 1}`,
      status: (['draft', 'pending', 'approved', 'rejected', 'escalated'][i % 5] as Workflow['status']),
      submittedBy: `maker${(i % 3) + 1}`,
      submittedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      reviewedBy: i % 5 === 2 ? `checker${(i % 2) + 1}` : null,
      reviewedAt: i % 5 === 2 ? new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString() : null,
      commentary: i % 3 === 0 ? `Workflow commentary ${i + 1}` : undefined,
    }))

    // Initialize audit logs
    this.auditLogs = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      user: `user${(i % 5) + 1}`,
      action: ['Login', 'Query', 'Adjust', 'Submit', 'Approve', 'Reject', 'Export'][i % 7],
      object: `Object-${i + 1}`,
      oldValue: i % 2 === 0 ? `Old value ${i}` : null,
      newValue: i % 2 === 0 ? `New value ${i}` : null,
      ipAddress: `192.168.1.${(i % 254) + 1}`,
      details: `Action details for log ${i + 1}`,
    }))
  }

  // Product data methods
  async getProductData(productType?: string, params?: QueryParams): Promise<ProductData[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let data = [...this.products]

        // Filter by product type
        if (productType) {
          data = data.filter((p) => p.product === productType)
        }

        // Filter by query params
        if (params) {
          if (params.region && params.region.length > 0) {
            data = data.filter((p) => params.region!.includes(p.region))
          }
          if (params.segment && params.segment.length > 0) {
            data = data.filter((p) => params.segment!.includes(p.internalCategory))
          }
        }

        resolve(data)
      }, this.DELAY_MS)
    })
  }

  async getLCRData(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = {
          hqla: 5250000000,
          nco: 4100000000,
          lcrRatio: 128,
          products: [
            { region: 'Americas', product: 'Deposits', hqla: 2500000000, nco: 1950000000, lcrRatio: 128 },
            { region: 'Americas', product: 'Securities', hqla: 1800000000, nco: 1400000000, lcrRatio: 129 },
            { region: 'EMEA', product: 'Deposits', hqla: 950000000, nco: 750000000, lcrRatio: 127 },
          ],
        }
        resolve(data)
      }, this.DELAY_MS)
    })
  }

  async getDashboardStats(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const stats = {
          draft: 15,
          pending: 8,
          approved: 42,
          lcrTrend: [105, 108, 112, 110, 115, 118, 120, 122, 119, 121, 125, 128],
          nsfrTrend: [110, 112, 115, 113, 117, 120, 122, 125, 123, 126, 130, 132],
        }
        resolve(stats)
      }, this.DELAY_MS)
    })
  }

  async adjustProductData(id: number, field: string, value: any, reason: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const product = this.products.find((p) => p.id === id)
        if (product) {
          const oldValue = (product as any)[field]
          ;(product as any)[field] = value

          // Log the adjustment
          this.auditLogs.unshift({
            id: this.auditLogs.length + 1,
            timestamp: new Date().toISOString(),
            user: 'current_user',
            action: 'Adjust',
            object: `Product ${id}`,
            oldValue: String(oldValue),
            newValue: String(value),
            ipAddress: '192.168.1.100',
            details: `Adjusted ${field} from ${oldValue} to ${value}. Reason: ${reason}`,
          })
        }
        resolve()
      }, this.DELAY_MS)
    })
  }

  async addProductCommentary(productId: number, commentary: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const product = this.products.find((p) => p.id === productId)
        if (product) {
          product.commentary = commentary

          // Log the commentary
          this.auditLogs.unshift({
            id: this.auditLogs.length + 1,
            timestamp: new Date().toISOString(),
            user: 'current_user',
            action: 'Comment',
            object: `Product ${productId}`,
            oldValue: null,
            newValue: commentary,
            ipAddress: '192.168.1.100',
            details: `Added commentary to product ${productId}`,
          })
        }
        resolve()
      }, this.DELAY_MS)
    })
  }

  async exportProductData(format: 'excel' | 'csv'): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Log the export
        this.auditLogs.unshift({
          id: this.auditLogs.length + 1,
          timestamp: new Date().toISOString(),
          user: 'current_user',
          action: 'Export',
          object: 'Product Data',
          oldValue: null,
          newValue: format,
          ipAddress: '192.168.1.100',
          details: `Exported product data in ${format} format`,
        })

        console.log(`Exporting data in ${format} format...`)
        resolve()
      }, this.DELAY_MS)
    })
  }

  // Workflow methods
  async getWorkflows(): Promise<Workflow[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.workflows)
      }, this.DELAY_MS)
    })
  }

  async updateWorkflowStatus(id: number, status: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const workflow = this.workflows.find((w) => w.id === id)
        if (workflow) {
          const oldStatus = workflow.status
          workflow.status = status as Workflow['status']
          workflow.reviewedBy = 'current_user'
          workflow.reviewedAt = new Date().toISOString()

          // Log the status change
          this.auditLogs.unshift({
            id: this.auditLogs.length + 1,
            timestamp: new Date().toISOString(),
            user: 'current_user',
            action: 'Update Status',
            object: `Workflow ${id}`,
            oldValue: oldStatus,
            newValue: status,
            ipAddress: '192.168.1.100',
            details: `Updated workflow ${id} status from ${oldStatus} to ${status}`,
          })
        }
        resolve()
      }, this.DELAY_MS)
    })
  }

  async addCommentary(workflowId: number, content: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const workflow = this.workflows.find((w) => w.id === workflowId)
        if (workflow) {
          workflow.commentary = content

          // Log the commentary
          this.auditLogs.unshift({
            id: this.auditLogs.length + 1,
            timestamp: new Date().toISOString(),
            user: 'current_user',
            action: 'Comment',
            object: `Workflow ${workflowId}`,
            oldValue: null,
            newValue: content,
            ipAddress: '192.168.1.100',
            details: `Added commentary to workflow ${workflowId}`,
          })
        }
        resolve()
      }, this.DELAY_MS)
    })
  }

  // Regulatory view methods
  async getNSFRData(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = {
          asf: 6250000000,
          rsf: 4800000000,
          nsfrRatio: 130,
          products: [
            { region: 'North America', product: 'Deposits', asf: 3000000000, rsf: 2300000000, nsfrRatio: 130 },
            { region: 'North America', product: 'Securities', asf: 2100000000, rsf: 1600000000, nsfrRatio: 131 },
            { region: 'Europe', product: 'Deposits', asf: 1150000000, rsf: 900000000, nsfrRatio: 128 },
          ],
        }
        resolve(data)
      }, this.DELAY_MS)
    })
  }

  async getNCCFData(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = {
          totalAssets: 15000000000,
          liquidAssets: 5250000000,
          nccfRatio: 35,
          breakdown: [
            { category: 'Cash', amount: 1500000000, percentage: 10 },
            { category: 'Government Securities', amount: 2750000000, percentage: 18.3 },
            { category: 'Corporate Bonds', amount: 1000000000, percentage: 6.7 },
          ],
        }
        resolve(data)
      }, this.DELAY_MS)
    })
  }

  async getILSTData(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = {
          internalLiquidityScore: 85,
          metrics: [
            { metric: 'Short-term Funding', value: 2500000000, score: 88 },
            { metric: 'Liquidity Buffer', value: 3200000000, score: 92 },
            { metric: 'Contingent Liquidity', value: 1800000000, score: 75 },
          ],
        }
        resolve(data)
      }, this.DELAY_MS)
    })
  }

  // Audit log methods
  async getAuditLogs(params?: any): Promise<any[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let logs = [...this.auditLogs]

        // Filter by params if provided
        if (params) {
          if (params.user) {
            logs = logs.filter((log) => log.user === params.user)
          }
          if (params.action) {
            logs = logs.filter((log) => log.action === params.action)
          }
          if (params.startDate) {
            logs = logs.filter((log) => new Date(log.timestamp) >= new Date(params.startDate))
          }
          if (params.endDate) {
            logs = logs.filter((log) => new Date(log.timestamp) <= new Date(params.endDate))
          }
        }

        resolve(logs)
      }, this.DELAY_MS)
    })
  }
}

export const mockDataService = new MockDataService()
