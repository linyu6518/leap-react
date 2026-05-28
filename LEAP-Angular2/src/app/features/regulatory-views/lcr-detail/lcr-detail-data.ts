export interface LcrSegmentValue {
  current: number
  previous: number
  variance: number
}

export interface LcrTreeNode {
  nodeId: string
  name: string
  level: number
  isLeaf: boolean
  isSummary?: boolean
  enterprise: LcrSegmentValue
  cadRetail: LcrSegmentValue
  wholesale: LcrSegmentValue
  usRetail: LcrSegmentValue
  children?: LcrTreeNode[]
  /** Dynamic segment columns keyed by entity code (populated by getColumnDefs). */
  segments?: Record<string, LcrSegmentValue>
}

export interface LcrRowData extends LcrTreeNode {
  isExpanded: boolean
}

const seg = (c: number, p?: number, v?: number): LcrSegmentValue => ({
  current: c,
  previous: p ?? c,
  variance: v ?? 0,
})

function node(
  nodeId: string,
  name: string,
  level: number,
  isLeaf: boolean,
  values: { e: number; c?: number; w?: number; u?: number },
  opts?: { isSummary?: boolean; children?: LcrTreeNode[] }
): LcrTreeNode {
  const e = values.e
  const c = values.c ?? e
  const w = values.w ?? e
  const u = values.u ?? e
  return {
    nodeId,
    name,
    level,
    isLeaf,
    isSummary: opts?.isSummary,
    enterprise: seg(e),
    cadRetail: seg(c),
    wholesale: seg(w),
    usRetail: seg(u),
    children: opts?.children,
  }
}

export const LCR_TREE: LcrTreeNode[] = [
  {
    ...node('lcr-ratio', 'LCR Ratio', 0, true, { e: 128.2 }, { isSummary: true }),
    enterprise: { current: 128.2, previous: 128.4, variance: -0.2 },
    cadRetail: { current: 128.2, previous: 128.4, variance: -0.2 },
    wholesale: { current: 128.2, previous: 128.4, variance: -0.2 },
    usRetail: { current: 128.2, previous: 128.4, variance: -0.2 },
  },
  node('hqla', 'HQLA', 0, false, { e: 33671 }, {
    children: [
      node('hqla-cash', 'Cash & Cash Equivalents', 1, false, { e: 10000 }, {
        children: [
          node('hqla-cash-child-1', 'Child 1', 2, true, { e: 5000 }),
        ],
      }),
      node('hqla-level1-nha', 'Level 1 - NHA MBS', 1, true, { e: 5000 }),
      node('hqla-level1-other', 'Level 1 - Other', 1, true, { e: 3000 }),
      node('hqla-level2a', 'Level 2a', 1, false, { e: 4000 }, {
        children: [node('hqla-level2a-child-1', 'Child 1', 2, true, { e: 2000 })],
      }),
      node('hqla-level2b', 'Level 2b', 1, false, { e: 3000 }, {
        children: [node('hqla-level2b-child-1', 'Child 1', 2, true, { e: 1500 })],
      }),
      node('hqla-internal-funding', 'Internal Funding With TDS', 1, true, { e: 6671 }),
    ],
  }),
  node('nco', 'Net Cash Outflows', 0, false, { e: 12671 }, {
    children: [
      node('nco-deposits', 'Deposits', 1, false, { e: 2000 }, {
        children: [
          node('nco-deposits-withdrawal', 'Withdrawal', 2, false, { e: 1500 }, {
            children: [node('nco-deposits-withdrawal-child-1', 'Child 1', 3, true, { e: 750 })],
          }),
          node('nco-deposits-buyback', 'BuyBack', 2, false, { e: 1200 }, {
            children: [node('nco-deposits-buyback-child-1', 'Child 1', 3, true, { e: 600 })],
          }),
          node('nco-deposits-rollover', 'Rollover', 2, false, { e: 1000 }, {
            children: [node('nco-deposits-rollover-child-1', 'Child 1', 3, true, { e: 500 })],
          }),
        ],
      }),
      node('nco-commitments', 'Commitments', 1, false, { e: 900 }, {
        children: [node('nco-commitments-child-1', 'Child 1', 2, true, { e: 450 })],
      }),
      node('nco-loans', 'Loans', 1, false, { e: 800 }, {
        children: [node('nco-loans-child-1', 'Child 1', 2, true, { e: 400 })],
      }),
      node('nco-derivatives', 'Derivatives', 1, false, { e: 700 }, {
        children: [node('nco-derivatives-child-1', 'Child 1', 2, true, { e: 350 })],
      }),
      node('nco-unsecured', 'Unsecured', 1, false, { e: 600 }, {
        children: [node('nco-unsecured-child-1', 'Child 1', 2, true, { e: 300 })],
      }),
      node('nco-interaffiliate', 'Interaffiliate Funding', 1, false, { e: 500 }, {
        children: [node('nco-interaffiliate-child-1', 'Child 1', 2, true, { e: 250 })],
      }),
      node('nco-secured', 'Secured Funding', 1, false, { e: 400 }, {
        children: [node('nco-secured-child-1', 'Child 1', 2, true, { e: 200 })],
      }),
      node('nco-other-risks', 'Other Risks', 1, false, { e: 300 }, {
        children: [node('nco-other-risks-child-1', 'Child 1', 2, true, { e: 150 })],
      }),
      node('nco-prime-services', 'Prime Services', 1, false, { e: 2071 }, {
        children: [node('nco-prime-services-child-1', 'Child 1', 2, true, { e: 1035 })],
      }),
    ],
  }),
  node('surplus', 'Surplus', 0, true, { e: 21000 }),
]

/** Scale factors per entity code for mock segment data in LCR table. */
const LCR_SEGMENT_SCALES: Record<string, number> = {
  CUSO: 1.0,
  TDGUS: 0.72,
  TDBUSH: 0.55,
  TDH: 0.28,
  NYB: 0.18,
  TDBNA: 0.40,
  TDBUSA: 0.12,
  TDCT: 0.60,
  TDW: 0.25,
  TDBEL: 0.08,
}

function mockSegmentsForNode(node: LcrTreeNode): Record<string, LcrSegmentValue> {
  // Build a segments record using enterprise value as base
  const base = node.enterprise.current
  const result: Record<string, LcrSegmentValue> = {}
  for (const [code, scale] of Object.entries(LCR_SEGMENT_SCALES)) {
    const curr = Math.round(base * scale)
    const prev = Math.round(base * scale * 1.03)
    result[code] = { current: curr, previous: prev, variance: curr - prev }
  }
  return result
}

export function buildLcrRowData(expandedNodes: Set<string>): LcrRowData[] {
  const rows: LcrRowData[] = []

  function addChildren(children: LcrTreeNode[], parentLevel: number): void {
    for (const child of children) {
      const hasChildren = !!(child.children && child.children.length > 0)
      const isExpanded = expandedNodes.has(child.nodeId)
      rows.push({
        ...child,
        level: parentLevel + 1,
        isExpanded,
        isLeaf: !hasChildren,
        segments: mockSegmentsForNode(child),
      })
      if (hasChildren && isExpanded && child.children) {
        addChildren(child.children, parentLevel + 1)
      }
    }
  }

  for (const item of LCR_TREE) {
    const hasChildren = !!(item.children && item.children.length > 0)
    const isExpanded = expandedNodes.has(item.nodeId)
    rows.push({
      ...item,
      isExpanded,
      isLeaf: !hasChildren,
      segments: mockSegmentsForNode(item),
    })
    if (hasChildren && isExpanded && item.children) {
      addChildren(item.children, 0)
    }
  }
  return rows
}
