import dayjs from 'dayjs'
import { QueryParams } from '@components/shared/QueryPanel'

const STORAGE_KEY_DEPOSITS = 'deposits_query_params'
const STORAGE_KEY_LCR = 'lcr_query_params'

interface StoredQueryParams {
  region: string | null
  segment: string | null
  prior: string | null // ISO string
  current: string | null // ISO string
}

// Convert QueryParams to storage format
function serializeParams(params: Partial<QueryParams>): StoredQueryParams {
  return {
    region: params.region || null,
    segment: params.segment || null,
    prior: params.prior ? params.prior.toISOString() : null,
    current: params.current ? params.current.toISOString() : null,
  }
}

// Convert storage format to QueryParams
function deserializeParams(stored: StoredQueryParams | null): Partial<QueryParams> {
  if (!stored) return {}
  
  return {
    region: stored.region || undefined,
    segment: stored.segment || undefined,
    prior: stored.prior ? dayjs(stored.prior) : undefined,
    current: stored.current ? dayjs(stored.current) : undefined,
  }
}

// Save query params for Deposits page
export function saveDepositsQueryParams(params: Partial<QueryParams>): void {
  try {
    const serialized = serializeParams(params)
    sessionStorage.setItem(STORAGE_KEY_DEPOSITS, JSON.stringify(serialized))
  } catch (error) {
    console.error('Failed to save Deposits query params:', error)
  }
}

// Load query params for Deposits page
export function loadDepositsQueryParams(): Partial<QueryParams> {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_DEPOSITS)
    if (stored) {
      const parsed = JSON.parse(stored) as StoredQueryParams
      return deserializeParams(parsed)
    }
  } catch (error) {
    console.error('Failed to load Deposits query params:', error)
  }
  return {}
}

// Save query params for LCR page
export function saveLCRQueryParams(params: Partial<QueryParams>): void {
  try {
    const serialized = serializeParams(params)
    sessionStorage.setItem(STORAGE_KEY_LCR, JSON.stringify(serialized))
  } catch (error) {
    console.error('Failed to save LCR query params:', error)
  }
}

// Load query params for LCR page
export function loadLCRQueryParams(): Partial<QueryParams> {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_LCR)
    if (stored) {
      const parsed = JSON.parse(stored) as StoredQueryParams
      return deserializeParams(parsed)
    }
  } catch (error) {
    console.error('Failed to load LCR query params:', error)
  }
  return {}
}
