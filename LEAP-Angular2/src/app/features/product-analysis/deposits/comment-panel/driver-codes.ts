/**
 * Structured "why did this variance happen" codes that power the new
 * Variance-focused comment flow. Attached to {@link Comment.driver} and
 * rendered as a small colored chip in both the panel and the cell tooltip.
 *
 * The set is intentionally short so reviewers don't drown in options; if we
 * need more we can promote `OTHER` subcategories to first-class codes.
 */

export type DriverCode =
  | 'MATURITY_ROLLOVER'
  | 'SEASONALITY'
  | 'CLIENT_WIN'
  | 'CLIENT_LOSS'
  | 'RATE_REPRICING'
  | 'CORPORATE_ACTION'
  | 'DATA_CORRECTION'
  | 'OPERATIONAL_BALANCE'
  | 'REGULATORY_CHANGE'
  | 'OTHER'

export interface DriverMeta {
  code: DriverCode
  /** Human-readable label shown in the Driver dropdown. */
  label: string
  /** 3-5 character label used in the chip and cell tooltip. */
  shortLabel: string
  /** Tooltip text surfaced on the dropdown option. */
  description: string
  /** Chip background — kept pastel to read as a label, not a signal. */
  colorBg: string
  /** Chip text color — tuned to stay legible against {@link colorBg}. */
  colorFg: string
}

export const DRIVER_CODES: DriverMeta[] = [
  {
    code: 'MATURITY_ROLLOVER',
    label: 'Maturity rollover',
    shortLabel: 'MAT',
    description: 'Term deposits / CDs rolling off or renewing on schedule.',
    colorBg: '#E3F2FD',
    colorFg: '#1565C0',
  },
  {
    code: 'SEASONALITY',
    label: 'Seasonality',
    shortLabel: 'SSN',
    description: 'Calendar-driven flow (month-end, tax, bonus, holiday).',
    colorBg: '#FFF3E0',
    colorFg: '#E65100',
  },
  {
    code: 'CLIENT_WIN',
    label: 'Client win / inflow',
    shortLabel: 'WIN',
    description: 'New mandate, deposit inflow or expansion with an existing client.',
    colorBg: '#E8F5E9',
    colorFg: '#1B5E20',
  },
  {
    code: 'CLIENT_LOSS',
    label: 'Client loss / outflow',
    shortLabel: 'LOSS',
    description: 'Client attrition or significant withdrawal.',
    colorBg: '#FFEBEE',
    colorFg: '#B71C1C',
  },
  {
    code: 'RATE_REPRICING',
    label: 'Rate repricing',
    shortLabel: 'RATE',
    description: 'Deposit rate change impacting balances / behavior.',
    colorBg: '#F3E5F5',
    colorFg: '#6A1B9A',
  },
  {
    code: 'CORPORATE_ACTION',
    label: 'Corporate action',
    shortLabel: 'CORP',
    description: 'M&A, subsidiary transfer, reorganisation etc.',
    colorBg: '#E0F7FA',
    colorFg: '#006064',
  },
  {
    code: 'DATA_CORRECTION',
    label: 'Data correction',
    shortLabel: 'FIX',
    description: 'Restatement of prior reported value after data fix.',
    colorBg: '#ECEFF1',
    colorFg: '#37474F',
  },
  {
    code: 'OPERATIONAL_BALANCE',
    label: 'Operational balance shift',
    shortLabel: 'OP',
    description: 'Change in operational vs non-operational classification.',
    colorBg: '#E8EAF6',
    colorFg: '#283593',
  },
  {
    code: 'REGULATORY_CHANGE',
    label: 'Regulatory change',
    shortLabel: 'REG',
    description: 'Reg or policy update that reshapes balances / weights.',
    colorBg: '#FFF8E1',
    colorFg: '#795548',
  },
  {
    code: 'OTHER',
    label: 'Other (see notes)',
    shortLabel: 'OTH',
    description: 'Anything not captured above — detail in the comment.',
    colorBg: '#F5F5F5',
    colorFg: '#424242',
  },
]

const DRIVER_BY_CODE: Map<DriverCode, DriverMeta> = new Map(
  DRIVER_CODES.map((d) => [d.code, d]),
)

/** Lookup helper; returns {@link OTHER} metadata if the code isn't recognised. */
export function driverMeta(code: DriverCode | null | undefined): DriverMeta {
  if (!code) return DRIVER_BY_CODE.get('OTHER')!
  return DRIVER_BY_CODE.get(code) ?? DRIVER_BY_CODE.get('OTHER')!
}
