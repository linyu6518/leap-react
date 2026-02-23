class ExportService {
  /**
   * Export data to CSV format
   */
  exportToCSV(data: any[], filename: string = 'export.csv'): void {
    if (!data || data.length === 0) {
      console.warn('No data to export')
      return
    }

    // Get headers from first object
    const headers = Object.keys(data[0])

    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Escape values containing commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(',')
      ),
    ].join('\n')

    this.downloadFile(csvContent, filename, 'text/csv')
  }

  /**
   * Export data to Excel format (simplified - creates CSV with .xlsx extension)
   * For full Excel support, consider using libraries like xlsx or exceljs
   */
  exportToExcel(data: any[], filename: string = 'export.xlsx'): void {
    // For now, use CSV format with Excel extension
    // In production, you might want to use a library like 'xlsx' for proper Excel format
    if (!data || data.length === 0) {
      console.warn('No data to export')
      return
    }

    const headers = Object.keys(data[0])

    const csvContent = [
      headers.join('\t'), // Use tab delimiter for better Excel compatibility
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (typeof value === 'string' && value.includes('\t')) {
              return `"${value}"`
            }
            return value
          })
          .join('\t')
      ),
    ].join('\n')

    this.downloadFile(csvContent, filename, 'application/vnd.ms-excel')
  }

  /**
   * Export table data to CSV (from HTML table)
   */
  exportTableToCSV(tableId: string, filename: string = 'table-export.csv'): void {
    const table = document.getElementById(tableId) as HTMLTableElement
    if (!table) {
      console.error(`Table with id '${tableId}' not found`)
      return
    }

    const rows = Array.from(table.querySelectorAll('tr'))
    const csvContent = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'))
        return cells
          .map((cell) => {
            const text = cell.textContent?.trim() || ''
            if (text.includes(',') || text.includes('"')) {
              return `"${text.replace(/"/g, '""')}"`
            }
            return text
          })
          .join(',')
      })
      .join('\n')

    this.downloadFile(csvContent, filename, 'text/csv')
  }

  /**
   * Export data to JSON format
   */
  exportToJSON(data: any, filename: string = 'export.json'): void {
    const jsonContent = JSON.stringify(data, null, 2)
    this.downloadFile(jsonContent, filename, 'application/json')
  }

  /**
   * Private helper to trigger file download
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Format number with thousands separator
   */
  formatNumber(value: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  /**
   * Format currency
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  /**
   * Format date for export
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toISOString().split('T')[0] // YYYY-MM-DD format
  }
}

export const exportService = new ExportService()
