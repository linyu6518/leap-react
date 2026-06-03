import type { ColDef, ValueFormatterParams } from 'ag-grid-community'

/** Period (column) the user drilled into. */
export type DrilldownPeriod = 'previous' | 'current'

/** Context passed from a clicked Summary cell into the drill-down panel. */
export interface DrilldownContext {
  /** Segment / counterparty column code (e.g. 'CUSO', 'TDGUS', or 'TOTAL'). */
  segmentCode: string
  /** Human label shown in the column header (e.g. 'Combined US Operations (CUSO)'). */
  segmentLabel: string
  period: DrilldownPeriod
  /** Deposits tree row name that was clicked (e.g. 'Demand Deposits (Checking)'). */
  productName: string
  /** Report date (the Summary form's Current date), ISO yyyy-MM-dd or null. */
  date: string | null
  /** The numeric value of the clicked cell (shown in the panel title). */
  amount?: number | null
}

/** One cashflow-level detail record (26 OSFI LCR columns). */
export interface DrilldownRow {
  n_date_skey: number
  v_product_category: string
  v_sub_product_category: string
  v_segment_name: string
  v_region_code: string
  v_portfolio_code: string
  v_record_type: string
  v_certificate_id: string
  v_entity_code: string
  v_osfi_lcr_line_code: string
  v_source_currency: string
  n_osfi_amt: number
  v_valuation_currency: string
  n_osfi_amt_usd: number
  v_reporting_currency: string
  n_osfi_amt_cad: number
  n_osfi_bucket_no: number
  d_cashflow_date: string
  n_principal_amt: number
  n_principal_amt_usd: number
  n_principal_amt_cad: number
  n_interest_amt: number
  n_interest_amt_usd: number
  n_interest_amt_cad: number
  v_cashflow_type: string
  v_original_certificate_id: string
}

export const CURRENCY_OPTIONS = ['CAD', 'USD', 'EUR', 'AUD'] as const

export const LINE_CODE_OPTIONS = [
  '1a.i', '1a.ii', '1b', '2a', '2b.i', '2b.ii', '3a', '3b', '4a', '4b',
] as const

const PRODUCT_CATEGORIES = ['Deposits', 'Term Funding', 'Wholesale', 'Retail'] as const
const SUB_PRODUCT_CATEGORIES = ['Demand', 'Notice', 'Fixed Term', 'Savings', 'GIC'] as const
const RECORD_TYPES = ['Notional', 'Cashflow', 'Balance'] as const
const CASHFLOW_TYPES = ['Principal', 'Interest', 'Maturity', 'Coupon'] as const
const ENTITY_CODES = ['TDBK', 'TDBNA', 'TDBUSA', 'TDGUS', 'NYB'] as const
const PORTFOLIO_CODES = ['CAFunding', 'USFunding', 'RetailBook', 'WholesaleBook'] as const

/** Deterministic pseudo-random in [0,1) from an integer seed. */
function rng(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function isoToSkey(iso: string): number {
  return Number(iso.replace(/-/g, '')) || 0
}

function addDays(iso: string | null, days: number): string {
  const base = iso ? new Date(iso) : new Date()
  if (isNaN(base.getTime())) return new Date().toISOString().slice(0, 10)
  base.setDate(base.getDate() + days)
  return base.toISOString().slice(0, 10)
}

/**
 * Deterministic mock generator. Produces a stable set of cashflow rows for the
 * given drill-down context so filters always have data to narrow.
 */
export function buildDrilldownRows(ctx: DrilldownContext): DrilldownRow[] {
  const seedBase = hashString(`${ctx.segmentCode}|${ctx.productName}|${ctx.period}`)
  const count = 48 + (seedBase % 33) // 48-80 rows
  const region = ctx.segmentCode === 'TOTAL' ? 'CA' : 'US'
  const rows: DrilldownRow[] = []

  for (let i = 0; i < count; i++) {
    const s = seedBase + i * 7
    const currency = CURRENCY_OPTIONS[Math.floor(rng(s + 1) * CURRENCY_OPTIONS.length)]
    const lineCode = LINE_CODE_OPTIONS[Math.floor(rng(s + 2) * LINE_CODE_OPTIONS.length)]
    const cfDate = addDays(ctx.date, Math.floor(rng(s + 3) * 90))
    const osfiAmt = Math.round((50_000 + rng(s + 4) * 9_950_000))
    const fxUsd = 0.72 + rng(s + 5) * 0.06
    const fxCad = 1 + rng(s + 6) * 0.02
    const principal = Math.round(osfiAmt * (0.6 + rng(s + 7) * 0.35))
    const interest = Math.round(osfiAmt * (0.01 + rng(s + 8) * 0.06))
    const bucket = 1 + Math.floor(rng(s + 9) * 8)
    const certId = `${1000000 + (seedBase % 9000000) + i}`

    rows.push({
      n_date_skey: isoToSkey(cfDate),
      v_product_category: PRODUCT_CATEGORIES[Math.floor(rng(s + 10) * PRODUCT_CATEGORIES.length)],
      v_sub_product_category: SUB_PRODUCT_CATEGORIES[Math.floor(rng(s + 11) * SUB_PRODUCT_CATEGORIES.length)],
      v_segment_name: ctx.segmentLabel,
      v_region_code: region,
      v_portfolio_code: PORTFOLIO_CODES[Math.floor(rng(s + 12) * PORTFOLIO_CODES.length)],
      v_record_type: RECORD_TYPES[Math.floor(rng(s + 13) * RECORD_TYPES.length)],
      v_certificate_id: certId,
      v_entity_code: ENTITY_CODES[Math.floor(rng(s + 14) * ENTITY_CODES.length)],
      v_osfi_lcr_line_code: lineCode,
      v_source_currency: currency,
      n_osfi_amt: osfiAmt,
      v_valuation_currency: currency,
      n_osfi_amt_usd: Math.round(osfiAmt * fxUsd),
      v_reporting_currency: 'CAD',
      n_osfi_amt_cad: Math.round(osfiAmt * fxCad),
      n_osfi_bucket_no: bucket,
      d_cashflow_date: cfDate,
      n_principal_amt: principal,
      n_principal_amt_usd: Math.round(principal * fxUsd),
      n_principal_amt_cad: Math.round(principal * fxCad),
      n_interest_amt: interest,
      n_interest_amt_usd: Math.round(interest * fxUsd),
      n_interest_amt_cad: Math.round(interest * fxCad),
      v_cashflow_type: CASHFLOW_TYPES[Math.floor(rng(s + 15) * CASHFLOW_TYPES.length)],
      v_original_certificate_id: certId,
    })
  }
  return rows
}

const numFmt = (p: ValueFormatterParams) =>
  p.value != null && p.value !== '' ? Number(p.value).toLocaleString() : ''

const numStyle = { textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }

function textCol(field: keyof DrilldownRow, headerName: string, width = 150): ColDef {
  return { field, headerName, width, minWidth: 110 }
}

function numCol(field: keyof DrilldownRow, headerName: string, width = 150): ColDef {
  return { field, headerName, width, minWidth: 120, valueFormatter: numFmt, cellStyle: numStyle, type: 'rightAligned' }
}

/** Left-aligned formatted number (used for ID-like keys). */
function leftNumCol(field: keyof DrilldownRow, headerName: string, width = 150): ColDef {
  return { field, headerName, width, minWidth: 120, valueFormatter: numFmt, cellStyle: { textAlign: 'left' as const } }
}

/** 26 column defs in the order specified by the requirement. */
export function getDrilldownColumnDefs(): ColDef[] {
  return [
    leftNumCol('n_date_skey', 'Date Skey', 130),
    textCol('v_product_category', 'Product Category', 160),
    textCol('v_sub_product_category', 'Sub Product Category', 180),
    textCol('v_segment_name', 'Segment Name', 220),
    textCol('v_region_code', 'Region', 110),
    textCol('v_portfolio_code', 'Portfolio', 150),
    textCol('v_record_type', 'Record Type', 130),
    textCol('v_certificate_id', 'Certificate ID', 140),
    textCol('v_entity_code', 'Entity', 120),
    textCol('v_osfi_lcr_line_code', 'OSFI LCR Line', 140),
    textCol('v_source_currency', 'Source Ccy', 120),
    numCol('n_osfi_amt', 'OSFI Amt', 150),
    textCol('v_valuation_currency', 'Valuation Ccy', 140),
    numCol('n_osfi_amt_usd', 'OSFI Amt USD', 150),
    textCol('v_reporting_currency', 'Reporting Ccy', 140),
    numCol('n_osfi_amt_cad', 'OSFI Amt CAD', 150),
    numCol('n_osfi_bucket_no', 'Bucket No', 120),
    textCol('d_cashflow_date', 'Cashflow Date', 140),
    numCol('n_principal_amt', 'Principal Amt', 150),
    numCol('n_principal_amt_usd', 'Principal USD', 150),
    numCol('n_principal_amt_cad', 'Principal CAD', 150),
    numCol('n_interest_amt', 'Interest Amt', 140),
    numCol('n_interest_amt_usd', 'Interest USD', 140),
    numCol('n_interest_amt_cad', 'Interest CAD', 140),
    textCol('v_cashflow_type', 'Cashflow Type', 140),
    textCol('v_original_certificate_id', 'Orig Certificate ID', 170),
  ]
}
