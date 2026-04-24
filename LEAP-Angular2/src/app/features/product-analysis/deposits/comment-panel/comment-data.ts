/**
 * Comment data + hierarchy utilities for the deposits Comment panel.
 *
 * Evaluation flow:
 *   rowId (clicked row) + RowIndex (full tree skeleton) + scope (counterparty column)
 *     -> getCommentsForRow -> CommentGroup[]
 *
 * The first entry is always the current row itself; subsequent entries are
 * descendants that have their own comments, preserving tree (DFS) order.
 *
 * Every comment bucket now lives under a `(rowId, scope)` pair. `scope === 'TOTAL'`
 * reproduces the old "comment on the whole row" behavior; other scopes pin the
 * comment to a specific counterparty column so Variance cells can surface a
 * focused preview.
 */

import type { DriverCode } from './driver-codes'

/**
 * Counterparty column identifier. Mirrors the `key` fields in
 * `deposits.component.ts:COUNTERPARTY_GROUPS`. `TOTAL` is always allowed;
 * other scopes are only rendered when there's actual data or an existing
 * comment under them.
 */
export type ScopeKey =
  | 'TOTAL'
  | 'RETAIL'
  | 'SME'
  | 'NON_FINANCIAL'
  | 'PENSION_FUNDS'
  | 'SOVEREIGNS'
  | 'GSE_PSE'
  | 'BANK'
  | 'BROKER_DEALERS'
  | 'INVESTMENT_FUNDS'
  | 'OTHER_FINANCIAL'

export interface CommentReply {
  id: string
  author: string
  initials: string
  avatarColor: string
  avatarBg: string
  timestamp: string
  text: string
  replies?: CommentReply[]
}

export interface Comment {
  id: string
  author: string
  initials: string
  avatarColor: string
  avatarBg: string
  timestamp: string
  text: string
  replies?: CommentReply[]
  /** Structured reason code explaining the variance. Optional so legacy / free-text comments still work. */
  driver?: DriverCode
  /** Signed amount of the variance the commenter is claiming this driver explains. */
  impactAmount?: number
  /** Redundant-but-handy direction for UI labels; derived from `impactAmount` sign on save. */
  impactDirection?: 'UP' | 'DOWN' | 'FLAT'
  /** The scope this comment was authored against. Mirrors the bucket key so the UI can self-describe. */
  scope?: ScopeKey
}

export interface CommentGroup {
  rowId: string
  rowName: string
  /** Scope the group's comments live under. */
  scope: ScopeKey
  /** Row names from the child immediately under the current row, down to this group's row. Empty for the current row itself. */
  breadcrumbs: string[]
  comments: Comment[]
}

export interface RowIndexEntry {
  id: string
  name: string
  level: number
  parentId: string | null
  /** Ids from the root down to this node (inclusive). */
  path: string[]
  /** Direct children ids. */
  childrenIds: string[]
}

export type RowIndex = Map<string, RowIndexEntry>

/** Minimal skeleton of the deposits Summary hierarchy. Mirrors `deposits.component.ts:buildSummaryRowData()`. */
interface SummaryTreeNode {
  id: string
  name: string
  children?: SummaryTreeNode[]
}

export const SUMMARY_TREE: SummaryTreeNode[] = [
  {
    id: 'personal',
    name: 'Personal',
    children: [
      { id: 'personal-demand', name: 'Demand Deposits (Checking)' },
      { id: 'personal-cds', name: 'CDs/Term Deposits/GIC' },
      { id: 'personal-savings', name: 'Savings Accounts' },
      { id: 'personal-third', name: 'Third Party Deposits' },
    ],
  },
  {
    id: 'non-personal',
    name: 'Non-Personal',
    children: [
      { id: 'non-personal-sweep', name: 'Sweep Accounts' },
      { id: 'non-personal-brokered', name: 'Brokered CDs' },
      { id: 'non-personal-banking', name: 'Business Banking' },
    ],
  },
  {
    id: 'wholesale',
    name: 'Wholesale Deposits',
    children: [
      { id: 'wholesale-cds', name: 'CDs' },
      { id: 'wholesale-term', name: 'Term Deposits' },
      {
        id: 'wholesale-gtb',
        name: 'GTB',
        children: [
          {
            id: 'wholesale-gtb-operational',
            name: 'a. Operational',
            children: [
              {
                id: 'wholesale-gtb-operational-retail',
                name: 'Retail/SME',
                children: [
                  { id: 'wholesale-gtb-operational-retail-insured', name: 'Insured' },
                  { id: 'wholesale-gtb-operational-retail-uninsured', name: 'Partial or Uninsured' },
                ],
              },
              {
                id: 'wholesale-gtb-operational-bank',
                name: 'Bank',
                children: [
                  { id: 'wholesale-gtb-operational-bank-insured', name: 'Insured' },
                  { id: 'wholesale-gtb-operational-bank-uninsured', name: 'Partial or Uninsured' },
                ],
              },
              {
                id: 'wholesale-gtb-operational-broker',
                name: 'Broker Dealers',
                children: [
                  { id: 'wholesale-gtb-operational-broker-insured', name: 'Insured' },
                  { id: 'wholesale-gtb-operational-broker-uninsured', name: 'Partial or Uninsured' },
                ],
              },
              {
                id: 'wholesale-gtb-operational-ia',
                name: 'IA/FMUs/Funds',
                children: [
                  { id: 'wholesale-gtb-operational-ia-insured', name: 'Insured' },
                  { id: 'wholesale-gtb-operational-ia-uninsured', name: 'Partial or Uninsured' },
                ],
              },
              {
                id: 'wholesale-gtb-operational-pension',
                name: 'Pension Funds',
                children: [
                  { id: 'wholesale-gtb-operational-pension-insured', name: 'Insured' },
                  { id: 'wholesale-gtb-operational-pension-uninsured', name: 'Partial or Uninsured' },
                ],
              },
              {
                id: 'wholesale-gtb-operational-pse',
                name: 'PSE/GSE/MDBs',
                children: [
                  { id: 'wholesale-gtb-operational-pse-insured', name: 'Insured' },
                  { id: 'wholesale-gtb-operational-pse-uninsured', name: 'Partial or Uninsured' },
                ],
              },
            ],
          },
          {
            id: 'wholesale-gtb-excess',
            name: 'B.Operational Excess Balance',
            children: [
              {
                id: 'wholesale-gtb-excess-retail',
                name: 'Retail/SME',
                children: [
                  { id: 'wholesale-gtb-excess-retail-insured', name: 'Insured' },
                  { id: 'wholesale-gtb-excess-retail-uninsured', name: 'Partial or Uninsured' },
                ],
              },
              { id: 'wholesale-gtb-excess-bank', name: 'Bank' },
              { id: 'wholesale-gtb-excess-broker', name: 'Broker Dealers' },
              { id: 'wholesale-gtb-excess-ia', name: 'IA/FMUs/Funds' },
              { id: 'wholesale-gtb-excess-pension', name: 'Pension Funds' },
              { id: 'wholesale-gtb-excess-pse', name: 'PSE/GSE/MDBs' },
              { id: 'wholesale-gtb-excess-nonfin', name: 'Non-Financial Corp' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pwm',
    name: 'PWM Deposits',
    children: [
      { id: 'pwm-cds', name: 'CDs' },
      { id: 'pwm-term', name: 'Term Deposits' },
      { id: 'pwm-demand', name: 'Demand Deposits' },
      { id: 'pwm-savings', name: 'Savings' },
    ],
  },
]

/**
 * Comment store keyed by `(rowId, scope)`. Arrays are returned by reference so
 * in-place mutations (new comments, new replies) persist across panel open/close.
 *
 * `scope === 'TOTAL'` reproduces the old "comment on the whole row" behaviour;
 * other scopes pin the comment to a specific counterparty column.
 */
export const COMMENTS_BY_SCOPE: Record<string /* rowId */, Partial<Record<ScopeKey, Comment[]>>> = {
  wholesale: {
    TOTAL: [
      {
        id: 'c-wholesale-1',
        author: 'Kevin Wu',
        initials: 'KW',
        avatarColor: '#283593',
        avatarBg: '#e8eaf6',
        timestamp: '2025-10-15 13:20',
        text: 'Overall wholesale variance is within the monthly tolerance. Keep monitoring GTB subsegments closely.',
        driver: 'SEASONALITY',
        impactAmount: -2800,
        impactDirection: 'DOWN',
        scope: 'TOTAL',
        replies: [
          {
            id: 'c-wholesale-1-1',
            author: 'John Doe',
            initials: 'JD',
            avatarColor: '#2e7d32',
            avatarBg: '#e8f5e9',
            timestamp: '2025-10-15 13:33',
            text: 'Acknowledged. Added to the governance watchlist.',
          },
        ],
      },
    ],
  },
  'wholesale-gtb': {
    TOTAL: [
      {
        id: 'c-gtb-1',
        author: 'Yufeng Guo',
        initials: 'YG',
        avatarColor: '#1565c0',
        avatarBg: '#e3f2fd',
        timestamp: '2025-10-15 12:19',
        text: 'GTB variance of 2,000 is driven by Operational Retail/SME Insured. Root cause analysis in progress.',
        driver: 'CLIENT_LOSS',
        impactAmount: -2000,
        impactDirection: 'DOWN',
        scope: 'TOTAL',
        replies: [
          {
            id: 'c-gtb-1-1',
            author: 'Amy Chen',
            initials: 'AC',
            avatarColor: '#00695c',
            avatarBg: '#e0f2f1',
            timestamp: '2025-10-15 12:48',
            text: 'Confirmed the variance is within the approved threshold.',
          },
        ],
      },
    ],
  },
  'wholesale-gtb-operational': {
    TOTAL: [
      {
        id: 'c-gtb-ops-1',
        author: 'Yu Lin',
        initials: 'YL',
        avatarColor: '#6a1b9a',
        avatarBg: '#f3e5f5',
        timestamp: '2025-10-15 11:02',
        text: 'Operational segment reviewed. Insured lines show a small drop vs prior.',
        driver: 'MATURITY_ROLLOVER',
        impactAmount: -1400,
        impactDirection: 'DOWN',
        scope: 'TOTAL',
      },
    ],
  },
  'wholesale-gtb-operational-retail-insured': {
    TOTAL: [
      {
        id: 'c-insured-1',
        author: 'John Doe',
        initials: 'JD',
        avatarColor: '#2e7d32',
        avatarBg: '#e8f5e9',
        timestamp: '2025-10-15 12:19',
        text: 'Reviewed adjusted value, within acceptable range.',
        driver: 'CLIENT_LOSS',
        impactAmount: -500,
        impactDirection: 'DOWN',
        scope: 'TOTAL',
        replies: [
          {
            id: 'c-insured-1-1',
            author: 'Yu Lin',
            initials: 'YL',
            avatarColor: '#6a1b9a',
            avatarBg: '#f3e5f5',
            timestamp: '15 hours ago',
            text: 'Reviewed deposit variance',
            replies: [
              {
                id: 'c-insured-1-1-1',
                author: 'John Doe',
                initials: 'JD',
                avatarColor: '#2e7d32',
                avatarBg: '#e8f5e9',
                timestamp: '14 hours ago',
                text: 'Thanks for confirming.',
              },
            ],
          },
        ],
      },
      {
        id: 'c-insured-2',
        author: 'Amy Chen',
        initials: 'AC',
        avatarColor: '#00695c',
        avatarBg: '#e0f2f1',
        timestamp: '2025-10-15 09:12',
        text: 'Counterparty breakdown matches our FR 2052a feed.',
      },
    ],
    RETAIL: [
      {
        id: 'c-insured-retail-1',
        author: 'Kevin Wu',
        initials: 'KW',
        avatarColor: '#283593',
        avatarBg: '#e8eaf6',
        timestamp: '2025-10-15 13:05',
        text: 'Retail insured dropped 350 driven by a large term deposit maturing Oct 14 that did not roll.',
        driver: 'MATURITY_ROLLOVER',
        impactAmount: -350,
        impactDirection: 'DOWN',
        scope: 'RETAIL',
      },
    ],
  },
  personal: {
    TOTAL: [
      {
        id: 'c-personal-1',
        author: 'Amy Chen',
        initials: 'AC',
        avatarColor: '#00695c',
        avatarBg: '#e0f2f1',
        timestamp: '2025-10-15 10:40',
        text: 'Personal segment looks stable week-over-week. Flagged items concentrated in Demand + Third Party.',
        driver: 'SEASONALITY',
        impactAmount: 5000,
        impactDirection: 'UP',
        scope: 'TOTAL',
      },
    ],
  },
  'personal-demand': {
    TOTAL: [
      {
        id: 'c-demand-1',
        author: 'John Doe',
        initials: 'JD',
        avatarColor: '#2e7d32',
        avatarBg: '#e8f5e9',
        timestamp: '2025-10-15 08:55',
        text: 'Variance exceeds threshold by 500. Pending investigation with branch ops.',
        driver: 'CLIENT_WIN',
        impactAmount: 2000,
        impactDirection: 'UP',
        scope: 'TOTAL',
      },
      {
        id: 'c-demand-2',
        author: 'Yu Lin',
        initials: 'YL',
        avatarColor: '#6a1b9a',
        avatarBg: '#f3e5f5',
        timestamp: '2025-10-15 09:20',
        text: 'Will cross-check against the overnight feed after 10:00.',
      },
    ],
  },
  'personal-third': {
    TOTAL: [
      {
        id: 'c-third-1',
        author: 'Kevin Wu',
        initials: 'KW',
        avatarColor: '#283593',
        avatarBg: '#e8eaf6',
        timestamp: '2025-10-15 11:15',
        text: 'Escalation not required for now. Keep this in weekly tracking.',
      },
    ],
  },
  'pwm-cds': {
    TOTAL: [
      {
        id: 'c-pwm-cds-1',
        author: 'Yufeng Guo',
        initials: 'YG',
        avatarColor: '#1565c0',
        avatarBg: '#e3f2fd',
        timestamp: '2025-10-15 10:05',
        text: 'Small decline in PWM CDs — in line with maturity roll-off.',
        driver: 'MATURITY_ROLLOVER',
        impactAmount: -500,
        impactDirection: 'DOWN',
        scope: 'TOTAL',
      },
    ],
  },
  'pwm-demand': {
    TOTAL: [
      {
        id: 'c-pwm-demand-1',
        author: 'Amy Chen',
        initials: 'AC',
        avatarColor: '#00695c',
        avatarBg: '#e0f2f1',
        timestamp: '2025-10-15 10:10',
        text: 'Alert cleared after reconciliation with custodian feed.',
        driver: 'DATA_CORRECTION',
        impactAmount: -200,
        impactDirection: 'DOWN',
        scope: 'TOTAL',
      },
    ],
  },
}

/** True if the row has at least one comment across any scope. */
export function rowHasAnyComment(rowId: string): boolean {
  const row = COMMENTS_BY_SCOPE[rowId]
  if (!row) return false
  for (const key of Object.keys(row) as ScopeKey[]) {
    const b = row[key]
    if (b && b.length > 0) return true
  }
  return false
}

/** True if the specific `(rowId, scope)` bucket has at least one comment. Used by the Variance cell dot. */
export function hasScopedComment(rowId: string, scope: ScopeKey): boolean {
  return (COMMENTS_BY_SCOPE[rowId]?.[scope]?.length ?? 0) > 0
}

/** Most recently added comment in the `(rowId, scope)` bucket, for hover previews. */
export function latestScopedComment(rowId: string, scope: ScopeKey): Comment | null {
  const bucket = COMMENTS_BY_SCOPE[rowId]?.[scope]
  if (!bucket || bucket.length === 0) return null
  return bucket[0] ?? null
}

/** Build a lookup map from the tree skeleton. Called once per view change. */
export function buildRowIndex(tree: SummaryTreeNode[] = SUMMARY_TREE): RowIndex {
  const index: RowIndex = new Map()

  const walk = (
    nodes: SummaryTreeNode[],
    parentId: string | null,
    parentPath: string[],
    level: number,
  ): void => {
    for (const node of nodes) {
      const path = [...parentPath, node.id]
      const childrenIds = (node.children ?? []).map((c) => c.id)
      index.set(node.id, {
        id: node.id,
        name: node.name,
        level,
        parentId,
        path,
        childrenIds,
      })
      if (node.children?.length) {
        walk(node.children, node.id, path, level + 1)
      }
    }
  }

  walk(tree, null, [], 0)
  return index
}

/**
 * Build the grouped comment list for a given row and scope.
 * - Group 0 is always the current row.
 * - Descendant groups are included only when they have at least one comment in the same scope.
 * - Comment arrays are returned by reference, so the panel can mutate them and persistence in the mock store stays consistent.
 */
export function getCommentsForRow(
  rowId: string,
  index: RowIndex,
  scope: ScopeKey = 'TOTAL',
): CommentGroup[] {
  const entry = index.get(rowId)

  if (!entry) {
    const own = ensureBucket(rowId, scope)
    return [{ rowId, rowName: '', scope, breadcrumbs: [], comments: own }]
  }

  const groups: CommentGroup[] = [
    {
      rowId: entry.id,
      rowName: entry.name,
      scope,
      breadcrumbs: [],
      comments: ensureBucket(entry.id, scope),
    },
  ]

  const visit = (ids: string[]): void => {
    for (const id of ids) {
      const node = index.get(id)
      if (!node) continue
      const bucket = COMMENTS_BY_SCOPE[id]?.[scope]
      if (bucket && bucket.length > 0) {
        const relIds = node.path.slice(entry.path.length)
        const crumbs = relIds.map((nid) => index.get(nid)?.name ?? '')
        groups.push({
          rowId: id,
          rowName: node.name,
          scope,
          breadcrumbs: crumbs,
          comments: bucket,
        })
      }
      visit(node.childrenIds)
    }
  }

  visit(entry.childrenIds)
  return groups
}

/** Lazily create the comment bucket for a `(rowId, scope)` so new comments can be posted. */
export function ensureBucket(rowId: string, scope: ScopeKey = 'TOTAL'): Comment[] {
  const row = COMMENTS_BY_SCOPE[rowId] ?? (COMMENTS_BY_SCOPE[rowId] = {})
  if (!row[scope]) row[scope] = []
  return row[scope] as Comment[]
}
