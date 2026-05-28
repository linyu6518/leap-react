import type { AbstractControl, ValidationErrors } from '@angular/forms'

/**
 * Legal-entity (LE) hierarchy that drives the new "Entity tree" multi-select on
 * LCR / Deposits / Products pages. The shape of these trees and the default-
 * selection rules come from Emily Ng's email (Apr 2026); see {@link defaultEntitiesFor}.
 *
 * Region semantics:
 *  - 'US'         → use {@link US_ENTITY_TREE}
 *  - 'Enterprise' → use {@link ENTERPRISE_ENTITY_TREE}
 *  - other        → no entity tree shown
 */

export type RegionKey = 'US' | 'Enterprise'

/** US Segment picker — selectable node codes (red-line items in hierarchy spec). */
export const US_SELECTABLE_SEGMENT_CODES = ['CUSO', 'TDGUS', 'TDBUSH', 'TDH', 'NYB'] as const

export type UsSegmentCode = (typeof US_SELECTABLE_SEGMENT_CODES)[number]

/** A single node in the legal-entity hierarchy. */
export interface EntityNode {
  /** Stable code used as the selection key; matches what we tag mock data with. */
  code: string
  /** Display label (long form). */
  label: string
  /** Optional inactive flag — rendered but disabled by the tree component. */
  inactive?: boolean
  children?: EntityNode[]
}

/** Region: US — root is CUSO, three top-level children. */
export const US_ENTITY_TREE: EntityNode[] = [
  {
    code: 'CUSO',
    label: 'Combined US Operations (CUSO)',
    children: [
      {
        code: 'TDGUS',
        label: 'TD Group US Holdings LLC (TDGUS)',
        /**
         * Per JIRA TRTSBOOST-909, TDH Consolidated is held under TDGUS
         * alongside TDBUSH and TDGUS-O — not a sibling of TDGUS under CUSO.
         */
        children: [
          {
            code: 'TDBUSH',
            label: 'TD Bank US Holding LLC - Consolidated (TDBUSH)',
            children: [
              { code: 'TDBNA', label: 'TD Bank, N.A. (TDBNA)' },
              { code: 'TDBUSA', label: 'TD Bank, USA N.A. (TDBUSA)' },
              { code: 'EIP', label: 'Epoch Investment Partners, Inc. (EIP)' },
              { code: 'TDBUSH-O', label: 'TD Bank US Holding Co. - Others (TDBUSH-O)' },
            ],
          },
          {
            code: 'TDH',
            label: 'TD Holdings USA Inc. - Consolidated (TDH Consolidated)',
            children: [
              { code: 'Cowen', label: 'Cowen, Inc. (Cowen)' },
              { code: 'TDPS USA', label: 'TD Prime Services USA LLC (TDPS USA)' },
              { code: 'TDS USA', label: 'TD Securities USA LLC (TDS USA)' },
              { code: 'TDII', label: 'Toronto Dominion Investments, Inc. (TDII)' },
              { code: 'TDH-O', label: 'TD Holdings USA Inc. - Others (TDH-O)' },
              { code: 'TDH-USA', label: 'TD Holdings USA Inc. (TDH-USA)' },
            ],
          },
          {
            code: 'TDGUS-O',
            label: 'TD Group US Holdings LLC - All Other Entities (TDGUS-O)',
            children: [
              { code: 'TD Texas', label: 'Toronto Dominion Texas (TD Texas)' },
              { code: 'TD Alabama', label: 'Toronto Dominion Alabama (TD Alabama)' },
              { code: 'TDNY', label: 'Toronto Dominion New York (TDNY)' },
              { code: 'TDII', label: 'Toronto Dominion Investments, Inc. (TDII)' },
              { code: 'TD Capital USA', label: 'TD Capital USA' },
            ],
          },
        ],
      },
      { code: 'NYB', label: 'TD Bank - Consolidated US Branch Network (NYB)' },
    ],
  },
]

/**
 * US Segment tree — hierarchy skeleton only (no leaf legal entities, no TDGUS-O).
 * Used for US Segment dropdown labels ({@link segmentLabelFor}).
 */
export const US_SEGMENT_PICKER_TREE: EntityNode[] = [
  {
    code: 'CUSO',
    label: 'Combined US Operations (CUSO)',
    children: [
      {
        code: 'TDGUS',
        label: 'TD Group US Holdings LLC (TDGUS)',
        children: [
          {
            code: 'TDBUSH',
            label: 'TD Bank US Holding LLC - Consolidated (TDBUSH)',
          },
          {
            code: 'TDH',
            label: 'TD Holdings USA Inc. - Consolidated (TDH Consolidated)',
          },
        ],
      },
      { code: 'NYB', label: 'TD Bank - Consolidated US Branch Network (NYB)' },
    ],
  },
]

/** Region: Enterprise — Segment-as-grouping (CAD Retail / USD Retail). */
export const ENTERPRISE_ENTITY_TREE: EntityNode[] = [
  {
    code: '__CAD_RETAIL_GROUP__',
    label: 'CAD Retail',
    children: [
      { code: 'TDCT', label: 'Toronto Dominion Canada Trust (TDCT)' },
      { code: 'TDW', label: 'TD Wealth (TDW)' },
      { code: 'TDBEL', label: 'TD Bank Europe Limited (TDBEL)' },
      { code: 'TDUK', label: 'TDUK (inactive)', inactive: true },
    ],
  },
  {
    code: '__USD_RETAIL_GROUP__',
    label: 'USD Retail',
    children: [
      { code: 'TDBNA', label: 'TD Bank, N.A. (TDBNA)' },
      { code: 'TDBUSA', label: 'TD Bank, USA N.A. (TDBUSA)' },
    ],
  },
]

/** Pseudo-codes used only as Enterprise grouping nodes; never persisted. */
const ENTERPRISE_GROUP_CODES = new Set(['__CAD_RETAIL_GROUP__', '__USD_RETAIL_GROUP__'])

export function isEnterpriseGroupCode(code: string): boolean {
  return ENTERPRISE_GROUP_CODES.has(code)
}

/** Returns every real entity code reachable from the given roots (skips group nodes). */
export function flattenEntityCodes(roots: EntityNode[]): string[] {
  const out: string[] = []
  const walk = (nodes: EntityNode[]) => {
    for (const n of nodes) {
      if (!isEnterpriseGroupCode(n.code)) out.push(n.code)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(roots)
  return out
}

/** Find a node by code anywhere in the given trees. */
export function findEntityNode(roots: EntityNode[], code: string): EntityNode | null {
  for (const n of roots) {
    if (n.code === code) return n
    if (n.children?.length) {
      const hit = findEntityNode(n.children, code)
      if (hit) return hit
    }
  }
  return null
}

/** Pick the right tree for a region; returns [] when the region has no tree. */
export function entityTreeFor(region: string | null | undefined): EntityNode[] {
  if (region === 'US') return US_ENTITY_TREE
  if (region === 'Enterprise') return ENTERPRISE_ENTITY_TREE
  return []
}

/** Normalise segment input to a string array. */
export function normaliseSegments(
  segments: string | string[] | null | undefined,
): string[] {
  if (!segments) return []
  if (Array.isArray(segments)) return segments.filter(Boolean)
  return [segments]
}

/** Display label for a segment code (US entity codes or Enterprise retail labels). */
export function segmentLabelFor(code: string): string {
  const us = findEntityNode(US_SEGMENT_PICKER_TREE, code) ?? findEntityNode(US_ENTITY_TREE, code)
  if (us) return us.label
  if (code === 'CAD Retail' || code === 'USD Retail') return code
  return code
}

/**
 * Coerce stored segment value (legacy string or array) into valid codes for the region.
 */
export function normaliseStoredSegments(
  region: string | null | undefined,
  raw: string | string[] | null | undefined,
): string[] {
  if (!region) return []

  const asArray = normaliseSegments(raw)
  if (region === 'US') {
    const migrated = asArray.flatMap((s) => migrateLegacyUsSegment(s))
    const allowed = new Set<string>(US_SELECTABLE_SEGMENT_CODES)
    const unique = [...new Set(migrated.filter((c) => allowed.has(c)))]
    return unique.length ? [unique[0]!] : []
  }

  if (region === 'Enterprise') {
    const allowed = new Set(segmentOptionsFor('Enterprise'))
    const fromArray = asArray.filter((s) => allowed.has(s))
    if (fromArray.length) return [fromArray[0]!]
    const single = typeof raw === 'string' ? raw : null
    if (single && allowed.has(single)) return [single]
    return []
  }

  return []
}

function migrateLegacyUsSegment(segment: string): string[] {
  if (US_SELECTABLE_SEGMENT_CODES.includes(segment as UsSegmentCode)) return [segment]
  if (segment === 'US Retail') return ['TDBUSH']
  if (segment === 'US Wholesale') return []
  return []
}

function defaultEntitiesForUsSegment(code: string): string[] {
  if (code === 'CUSO') return flattenEntityCodes(US_ENTITY_TREE)
  const node = findEntityNode(US_ENTITY_TREE, code)
  if (node) return flattenEntityCodes([node])
  return []
}

/**
 * Default entity selection rules per Emily's email.
 * Returns the codes that should be checked when (region, segments) changes.
 * Multiple segment codes (e.g. restored session) → union of subtrees; UI is single-select.
 */
export function defaultEntitiesFor(
  region: string | null | undefined,
  segments: string | string[] | null | undefined,
): string[] {
  const list = normaliseSegments(segments)
  if (!list.length) return []

  if (region === 'US') {
    const codes = new Set<string>()
    for (const seg of list) {
      for (const c of defaultEntitiesForUsSegment(seg)) codes.add(c)
    }
    return [...codes]
  }

  if (region === 'Enterprise') {
    const seg = list[0]
    if (seg === 'CAD Retail') return ['TDCT', 'TDW', 'TDBEL', 'TDUK']
    if (seg === 'USD Retail') return ['TDBNA', 'TDBUSA']
  }

  return []
}

/** Region-aware Segment options, used for validation and Enterprise dropdown. */
export function segmentOptionsFor(region: string | null | undefined): string[] {
  switch (region) {
    case 'US':
      return [...US_SELECTABLE_SEGMENT_CODES]
    case 'Enterprise':
      return ['CAD Retail', 'USD Retail']
    default:
      return []
  }
}

/** True when the given Region currently shows the entity tree. */
export function regionShowsEntityTree(region: string | null | undefined): boolean {
  return region === 'US' || region === 'Enterprise'
}

/** Selected / total leaf-entity counts for summary labels (e.g. drawer trigger). */
export function entitySelectionCounts(
  region: string | null | undefined,
  selectedCodes: string[] | null | undefined,
): { selected: number; total: number } {
  const leaves = new Set(flattenEntityCodes(entityTreeFor(region)))
  const selected = (selectedCodes ?? []).filter((c) => leaves.has(c)).length
  return { selected, total: leaves.size }
}

/** Allowed Region values for Report Config forms. */
export function normaliseRegion(value: string | null | undefined): string | null {
  const allowed = new Set<string>(['US', 'Enterprise'])
  if (value && allowed.has(value)) return value
  return null
}

/** Form validator: segment control must be a non-empty string array. */
export function segmentsRequiredValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value
  return Array.isArray(v) && v.length > 0 ? null : { required: true }
}
