/** FR2052A grid row model — lives in its own file to avoid circular imports with adjustment-panel. */

export type Fr2052AmountField = 'amount1' | 'amount2' | 'amount3'

export interface FR2052AData {
  pid: string
  product: string
  amount1: number
  amount2: number
  amount3: number
  hasAlert?: boolean
  isEscalated?: boolean
  isGrandTotal?: boolean
  reportingEntity?: string
  counterparty?: string
  insured?: string
  businessLine?: string
  currency?: string
  trigger?: string
  internal?: string
  converted?: string
  maturityAmount?: number
  issueId?: string
  /** Previous numeric value before last save, per column — used to annotate cells after adjustment */
  amountAdjustedFrom?: Partial<Record<Fr2052AmountField, number>>
}
