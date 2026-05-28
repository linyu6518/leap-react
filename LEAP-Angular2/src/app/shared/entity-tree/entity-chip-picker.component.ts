import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import {
  EntityNode,
  defaultEntitiesFor,
  entityTreeFor,
  flattenEntityCodes,
  isEnterpriseGroupCode,
  regionShowsEntityTree,
} from './entity-data'

/**
 * Group of leaf entities under a single immediate parent. Chips are rendered
 * inside one of these groups, with the parent label acting as section header
 * (and master "select all / none" toggle).
 */
interface LeafGroup {
  kind: 'leaf'
  /** Code of the parent (group). For standalone leaves this is `__OTHER__`. */
  code: string
  /** Display label for the section header (long form, used for tooltips). */
  label: string
  /** Compact label for the section header — shown when columns are narrow. */
  shortLabel: string
  leaves: EntityNode[]
}

/**
 * Parent-level wrapper around several {@link LeafGroup}s, used when the tree
 * has an explicit grandparent layer we want to expose (currently TDGUS for the
 * US region, per JIRA TRTSBOOST-909). Renders as a dashed bracket frame with a
 * corner-tag master checkbox that toggles every leaf under every child group.
 */
interface ParentGroup {
  kind: 'parent'
  code: string
  /** Long label (e.g. "TD Group US Holdings LLC (TDGUS)"). */
  label: string
  /** Compact code shown in the corner tag (e.g. "TDGUS"). */
  shortLabel: string
  children: LeafGroup[]
}

type RenderRow = LeafGroup | ParentGroup

/**
 * Horizontal chip-style legal-entity multi-select.
 *
 * Same public API as {@link EntityTreeSelectComponent} (region, segment,
 * selectedCodes / selectedCodesChange) so callers can swap freely. The chip
 * layout uses the full available width (chips wrap), saving vertical space
 * compared to the tree.
 */
@Component({
  selector: 'app-entity-chip-picker',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzToolTipModule],
  template: `
    @if (visible()) {
      <div class="entity-chip-card" [class.vertical-layout]="layout === 'vertical'">
        <header class="entity-chip-head">
          <div class="entity-chip-title">
            <span>Legal entities</span>
            <span class="entity-chip-count">{{ selectedRealCount() }} / {{ totalRealCount() }}</span>
          </div>
          <button
            type="button"
            class="entity-chip-reset"
            [class.entity-chip-reset--check-all]="resetMode() === 'check-all'"
            (click)="resetToDefault()"
            [title]="resetMode() === 'check-all' ? 'Select every active legal entity' : 'Clear the current selection'"
          >{{ resetMode() === 'check-all' ? 'Check all' : 'Reset to default' }}</button>
        </header>

        <div
          class="entity-chip-groups"
          [class.entity-chip-groups--two]="leafGroups().length === 2"
        >
          @for (row of renderRows(); track row.code) {
            @if (row.kind === 'parent') {
              <section
                class="entity-chip-parent"
                [class.collapsed]="!isParentExpanded(row)"
              >
                <div class="entity-chip-parent-tag">
                  <button
                    type="button"
                    class="entity-chip-parent-checkbox"
                    (click)="toggleParent(row); $event.stopPropagation()"
                    [attr.aria-pressed]="isParentAllSelected(row)"
                    [title]="parentHint(row)"
                  >
                    <span
                      class="entity-chip-group-box"
                      [class.checked]="isParentAllSelected(row)"
                      [class.partial]="isParentPartiallySelected(row)"
                    >
                      @if (isParentAllSelected(row)) {
                        <span nz-icon nzType="check" nzTheme="outline"></span>
                      } @else if (isParentPartiallySelected(row)) {
                        <span class="entity-chip-group-dash"></span>
                      }
                    </span>
                  </button>
                  <button
                    type="button"
                    class="entity-chip-parent-expand"
                    (click)="toggleParentExpanded(row)"
                    [attr.aria-expanded]="isParentExpanded(row)"
                    [title]="row.label"
                    nz-tooltip
                    [nzTooltipTitle]="row.label"
                    nzTooltipPlacement="top"
                  >
                    <span class="entity-chip-parent-label">{{ row.shortLabel }}</span>
                    <span class="entity-chip-parent-count">{{ parentSelectedCount(row) }}/{{ parentTotalCount(row) }}</span>
                    <svg
                      class="entity-chip-parent-chevron"
                      [class.expanded]="isParentExpanded(row)"
                      viewBox="0 0 12 12"
                      width="12"
                      height="12"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 4 L6 8 L10 4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="square"
                        stroke-linejoin="miter"
                      ></path>
                    </svg>
                  </button>
                </div>
                @if (isParentExpanded(row)) {
                <div class="entity-chip-parent-body">
                  @for (group of row.children; track group.code) {
                    <section class="entity-chip-group entity-chip-group--nested">
                      <button
                        type="button"
                        class="entity-chip-group-header"
                        (click)="toggleGroup(group)"
                        [attr.aria-pressed]="isGroupAllSelected(group)"
                        [title]="group.label + ' — ' + groupHint(group)"
                        nz-tooltip
                        [nzTooltipTitle]="group.label"
                        nzTooltipPlacement="top"
                      >
                        <span
                          class="entity-chip-group-box"
                          [class.checked]="isGroupAllSelected(group)"
                          [class.partial]="isGroupPartiallySelected(group)"
                        >
                          @if (isGroupAllSelected(group)) {
                            <span nz-icon nzType="check" nzTheme="outline"></span>
                          } @else if (isGroupPartiallySelected(group)) {
                            <span class="entity-chip-group-dash"></span>
                          }
                        </span>
                        <span class="entity-chip-group-label">{{ group.shortLabel }}</span>
                        <span class="entity-chip-group-count">{{ groupSelectedCount(group) }}/{{ groupTotalCount(group) }}</span>
                      </button>

                      <div class="entity-chip-list">
                        @for (leaf of group.leaves; track leaf.code) {
                          <button
                            type="button"
                            class="entity-chip"
                            [class.selected]="isSelected(leaf.code)"
                            [class.inactive]="leaf.inactive"
                            [disabled]="!!leaf.inactive"
                            (click)="toggleEntity(leaf.code)"
                            nz-tooltip
                            [nzTooltipTitle]="leaf.label"
                            nzTooltipPlacement="top"
                          >
                            @if (isSelected(leaf.code)) {
                              <span class="entity-chip-check" nz-icon nzType="check" nzTheme="outline"></span>
                            }
                            <span class="entity-chip-code">{{ shortCode(leaf) }}</span>
                          </button>
                        }
                      </div>
                    </section>
                  }
                </div>
                }
              </section>
            } @else {
              <section class="entity-chip-group">
                <button
                  type="button"
                  class="entity-chip-group-header"
                  (click)="toggleGroup(row)"
                  [attr.aria-pressed]="isGroupAllSelected(row)"
                  [title]="row.label + ' — ' + groupHint(row)"
                  nz-tooltip
                  [nzTooltipTitle]="row.label"
                  nzTooltipPlacement="top"
                >
                  <span
                    class="entity-chip-group-box"
                    [class.checked]="isGroupAllSelected(row)"
                    [class.partial]="isGroupPartiallySelected(row)"
                  >
                    @if (isGroupAllSelected(row)) {
                      <span nz-icon nzType="check" nzTheme="outline"></span>
                    } @else if (isGroupPartiallySelected(row)) {
                      <span class="entity-chip-group-dash"></span>
                    }
                  </span>
                  <span class="entity-chip-group-label">{{ row.shortLabel }}</span>
                  <span class="entity-chip-group-count">{{ groupSelectedCount(row) }}/{{ groupTotalCount(row) }}</span>
                </button>

                <div class="entity-chip-list">
                  @for (leaf of row.leaves; track leaf.code) {
                    <button
                      type="button"
                      class="entity-chip"
                      [class.selected]="isSelected(leaf.code)"
                      [class.inactive]="leaf.inactive"
                      [disabled]="!!leaf.inactive"
                      (click)="toggleEntity(leaf.code)"
                      nz-tooltip
                      [nzTooltipTitle]="leaf.label"
                      nzTooltipPlacement="top"
                    >
                      @if (isSelected(leaf.code)) {
                        <span class="entity-chip-check" nz-icon nzType="check" nzTheme="outline"></span>
                      }
                      <span class="entity-chip-code">{{ shortCode(leaf) }}</span>
                    </button>
                  }
                </div>
              </section>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .entity-chip-card {
      border: 1px solid #E6E6E6;
      background: #FFFFFF;
      padding: 18px 24px 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    /* Vertical (right-panel) mode: card fills the wrapper's height and the
       header / Reset button stay pinned at the top while only the groups
       list scrolls. */
    .entity-chip-card.vertical-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    .entity-chip-card.vertical-layout .entity-chip-head {
      flex: 0 0 auto;
    }

    .entity-chip-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .entity-chip-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 17px;
      font-weight: 600;
      color: #3a473a;
      line-height: 1.3;
    }
    .entity-chip-count {
      margin-left: 4px;
      font-size: 11px;
      font-weight: 500;
      color: #8C8C8C;
      background: #F2F2F2;
      padding: 2px 8px;
      border-radius: 999px;
      letter-spacing: 0.2px;
    }

    /* "Reset to default" reads as a clear text button: green link with an
       underline on hover; clearly disabled when the selection already matches
       the default. */
    .entity-chip-reset {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: none;
      background: transparent;
      color: #058901;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 2px;
      letter-spacing: 0.2px;
      font-family: inherit;
    }
    .entity-chip-reset::before {
      content: '';
      display: inline-block;
      width: 12px;
      height: 12px;
      background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 1.5a4.5 4.5 0 1 1-3.18 7.68' stroke='%23058901' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3Cpath d='M2 0.6V3.4H4.8' stroke='%23058901' stroke-width='1.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-size: contain;
      background-repeat: no-repeat;
    }
    .entity-chip-reset:hover {
      background: #F0F5F1;
      color: #047001;
      text-decoration: underline;
    }
    /* "Check all" mode swaps the circular-arrow glyph for a check mark so the
       intent is clear at a glance. */
    .entity-chip-reset.entity-chip-reset--check-all::before {
      background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 6.2L4.7 9 10 3.4' stroke='%23058901' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    }

    /* Single-row horizontal layout for the entity groups: each leaf group
       sits in its own column. Chips inside a group still wrap if the column
       is narrow. Short grey vertical dividers separate adjacent groups. */
    .entity-chip-groups {
      display: flex;
      flex-wrap: nowrap;
      align-items: flex-start;
      gap: 64px;
      overflow-x: auto;
    }
    /* Enterprise region only has two leaf groups — keep them on the same row
       but limited to two columns so each group still gets reasonable width. */
    .entity-chip-groups.entity-chip-groups--two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .entity-chip-group {
      position: relative;
      flex: 0 0 auto;
      min-width: 0;
    }
    /* Subtle short divider between adjacent groups. */
    .entity-chip-group:not(:last-child)::after {
      content: '';
      position: absolute;
      right: -45px; /* center of the 90px group gap */
      top: 6px;
      bottom: 6px;
      width: 1px;
      background: #ececec;
      pointer-events: none;
    }

    /* Right-side panel mode: stack groups vertically and let only this area
       scroll, so the header above remains visible. Negative horizontal margin
       extends the scrollbar to the card's edge while padding restores the
       inner gutter for the chips. */
    .entity-chip-card.vertical-layout .entity-chip-groups {
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-x: visible;
      overflow-y: auto;
      flex: 1 1 auto;
      min-height: 0;
      margin: 0 -24px -20px;
      padding: 0 24px 20px;
    }
    .entity-chip-card.vertical-layout .entity-chip-group {
      width: 100%;
    }
    .entity-chip-card.vertical-layout .entity-chip-group:not(:last-child)::after {
      display: none;
    }

    .entity-chip-group-header {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: none;
      background: transparent;
      padding: 0;
      cursor: pointer;
      margin-bottom: 6px;
      font-family: inherit;
      color: #3a473a;
    }
    .entity-chip-group-header:focus-visible { outline: 2px solid #058901; outline-offset: 2px; }

    .entity-chip-group-box {
      width: 16px;
      height: 16px;
      border: 1.5px solid #BFBFBF;
      border-radius: 3px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #fff;
      color: #fff;
      font-size: 11px;
      transition: background 0.15s, border-color 0.15s;
    }
    .entity-chip-group-box.checked { background: #058901; border-color: #058901; }
    .entity-chip-group-box.partial { background: #058901; border-color: #058901; }
    .entity-chip-group-dash {
      display: block;
      width: 8px;
      height: 2px;
      background: #fff;
      border-radius: 1px;
    }
    .entity-chip-group-header:hover .entity-chip-group-box:not(.checked):not(.partial) {
      border-color: #058901;
    }

    .entity-chip-group-label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
      text-transform: none;
    }
    .entity-chip-group-count {
      font-size: 11px;
      font-weight: 500;
      color: #8C8C8C;
      margin-left: 2px;
    }

    .entity-chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 8px;
    }

    .entity-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border: 1px solid #D9D9D9;
      background: #FFFFFF;
      color: #3a473a;
      font-size: 12px;
      font-weight: 500;
      line-height: 1;
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
      font-family: inherit;
      height: 26px;
    }
    .entity-chip:hover:not(:disabled):not(.selected) {
      border-color: #058901;
      color: #058901;
    }
    .entity-chip.selected {
      background: #058901;
      border-color: #058901;
      color: #FFFFFF;
    }
    .entity-chip.selected:hover:not(:disabled) {
      background: #047001;
      border-color: #047001;
    }
    .entity-chip.inactive,
    .entity-chip:disabled {
      background: #F5F5F5;
      color: #BFBFBF;
      border-color: #E6E6E6;
      cursor: not-allowed;
      font-style: italic;
    }
    .entity-chip-check { font-size: 11px; }
    .entity-chip-code { white-space: nowrap; }

    /* ────────────────── Parent group (e.g. TDGUS) ────────────────── */
    /* Card-style frame wrapping child leaf groups. The top edge is
       highlighted with a 1px green border to mark the group boundary; the
       parent label sits inside the frame as plain text + master checkbox
       (no filled chip background). */
    .entity-chip-parent {
      position: relative;
      flex: 0 0 auto;
      padding: 0;
      border: 1px solid #DDE7DD;
      border-radius: 4px;
      background: #F4F9F4;
      overflow: hidden;
    }
    /* Top-level layout divider rules don't apply when a parent is involved —
       the card border already provides the visual separation. */
    .entity-chip-parent + .entity-chip-group::after,
    .entity-chip-group + .entity-chip-parent::after,
    .entity-chip-parent:not(:last-child)::after { display: none; }

    /* Header strip with two independent click zones: the left checkbox
       toggles select-all, the right area toggles expand/collapse. */
    .entity-chip-parent-tag {
      display: flex;
      align-items: center;
      width: 100%;
      background: #E9F2E9;
      line-height: 1.2;
      color: #3a473a;
    }
    .entity-chip-parent-checkbox {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 0 8px 12px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-family: inherit;
      color: inherit;
    }
    .entity-chip-parent-checkbox:hover .entity-chip-group-box:not(.checked):not(.partial) {
      border-color: #058901;
    }
    .entity-chip-parent-checkbox:focus-visible {
      outline: 2px solid #058901;
      outline-offset: 2px;
    }
    .entity-chip-parent-expand {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px 8px 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-family: inherit;
      color: inherit;
      text-align: left;
    }
    .entity-chip-parent-expand:hover .entity-chip-parent-label { color: #058901; }
    .entity-chip-parent-expand:hover .entity-chip-parent-chevron { color: #058901; }
    .entity-chip-parent-expand:focus-visible {
      outline: 2px solid #058901;
      outline-offset: 2px;
    }
    .entity-chip-parent-label {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.3px;
      color: #3a473a;
      transition: color 0.15s;
    }
    .entity-chip-parent-count {
      font-size: 11px;
      font-weight: 500;
      color: #8C8C8C;
      padding-left: 2px;
    }
    .entity-chip-parent-chevron {
      margin-left: auto;
      color: #8C8C8C;
      width: 12px;
      height: 12px;
      flex-shrink: 0;
      transform: rotate(-90deg);
      transition: transform 0.18s ease, color 0.15s;
    }
    .entity-chip-parent-chevron.expanded {
      transform: rotate(0deg);
    }
    /* When collapsed, drop the header divider so the row reads as a single
       compact bar. */
    .entity-chip-parent.collapsed .entity-chip-parent-body { display: none; }

    /* Inside the frame the child groups arrange horizontally; if the column
       gets narrow they wrap to the next line. Body inherits the same light
       green background as the header so the whole frame reads as one tinted
       region; a 1px divider still separates TDGUS from its children, and a
       small left indent reinforces the parent → children hierarchy. */
    .entity-chip-parent-body {
      display: flex;
      flex-wrap: wrap;
      gap: 14px 36px;
      align-items: flex-start;
      padding: 10px 12px 10px 22px;
      border-top: 1px solid #D5E0D5;
      background: transparent;
    }
    .entity-chip-group--nested {
      position: relative;
      flex: 0 0 auto;
      min-width: 0;
    }
    /* Subtle short divider between adjacent nested groups inside the frame. */
    .entity-chip-group--nested:not(:last-child)::after {
      content: '';
      position: absolute;
      right: -18px;
      top: 6px;
      bottom: 6px;
      width: 1px;
      background: #E5EBE5;
      pointer-events: none;
    }

    /* Vertical (right-panel) layout: parent frame stretches full width and
       child groups stack vertically. */
    .entity-chip-card.vertical-layout .entity-chip-parent {
      width: 100%;
    }
    .entity-chip-card.vertical-layout .entity-chip-parent-body {
      flex-direction: column;
      gap: 14px;
    }
    .entity-chip-card.vertical-layout .entity-chip-group--nested:not(:last-child)::after {
      display: none;
    }
  `],
})
export class EntityChipPickerComponent implements OnChanges {
  @Input() region: string | null = null
  @Input() segment: string | null = null
  @Input() selectedCodes: string[] = []
  /** horizontal = compact row groups; vertical = one group per row. */
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal'
  @Output() selectedCodesChange = new EventEmitter<string[]>()

  /** Internal signal mirrors of @Inputs so `computed()` stays reactive. */
  private regionSig = signal<string | null>(null)
  private segmentsSig = signal<string[]>([])

  /** Tracks whether the user has touched the picker since the last (region, segments) change. */
  private userEdited = signal(false)
  private internalChecked = signal<string[]>([])
  /** Parent codes that the user has explicitly collapsed. Default = empty,
   * meaning all parent groups start expanded. */
  private collapsedParents = signal<Set<string>>(new Set())
  /** True after the first ngOnChanges so we can distinguish boot vs. update calls. */
  private isInitialized = false

  visible = computed(() => regionShowsEntityTree(this.regionSig()))

  /**
   * Build the chip layout from the current Region's tree:
   * for every internal node whose children are *all* leaves we emit one
   * section. Top-level leaves are bundled under an "Other" section.
   */
  readonly leafGroups = computed<LeafGroup[]>(() => {
    const roots = entityTreeFor(this.regionSig())
    return buildLeafGroups(roots)
  })

  /**
   * Higher-level rows used by the template: each row is either a flat
   * {@link LeafGroup} or a {@link ParentGroup} that wraps several leaf groups
   * (currently TDGUS for the US region). The flat `leafGroups()` view above
   * remains the source of truth for selection accounting.
   */
  readonly renderRows = computed<RenderRow[]>(() => {
    const roots = entityTreeFor(this.regionSig())
    return buildRenderRows(roots)
  })

  /** All active leaf codes (excludes inactive entities and Enterprise group nodes). */
  private readonly activeLeafCodes = computed<Set<string>>(() => {
    const codes = new Set<string>()
    for (const g of this.leafGroups()) {
      for (const l of g.leaves) {
        if (!l.inactive) codes.add(l.code)
      }
    }
    return codes
  })

  readonly totalRealCount = computed(() => this.activeLeafCodes().size)
  readonly selectedRealCount = computed(() => {
    const active = this.activeLeafCodes()
    return this.internalChecked().filter((c) => active.has(c)).length
  })

  /**
   * The single button toggles between two modes:
   *  - 'reset': something is selected → clicking clears everything.
   *  - 'check-all': nothing is selected → clicking selects all active leaves.
   */
  readonly resetMode = computed<'reset' | 'check-all'>(() => {
    const realSelected = this.internalChecked().filter((c) => !isEnterpriseGroupCode(c))
    return realSelected.length > 0 ? 'reset' : 'check-all'
  })

  ngOnChanges(changes: SimpleChanges): void {
    // Mirror inputs into signals on every change so `computed()`s react.
    if ('region' in changes) this.regionSig.set(this.region)
    if ('segment' in changes) this.segmentSig.set(this.segment)

    if (!this.isInitialized) {
      this.isInitialized = true
      const initial = this.selectedCodes ?? []
      if (initial.length) {
        this.internalChecked.set([...initial])
      } else {
        this.applyDefault()
      }
      return
    }

    const regionChanged = 'region' in changes
    const segmentChanged = 'segment' in changes
    const selectedChanged = 'selectedCodes' in changes

    if (regionChanged || segmentChanged) {
      this.userEdited.set(false)
      this.applyDefault()
      return
    }
    if (selectedChanged) {
      const next = this.selectedCodes ?? []
      this.internalChecked.set([...next])
    }
  }

  // ───────────────────────── chip / group interactions ─────────────────────────

  isSelected(code: string): boolean {
    return this.internalChecked().includes(code)
  }

  toggleEntity(code: string): void {
    this.userEdited.set(true)
    const current = this.internalChecked()
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code]
    this.internalChecked.set(next)
    this.emitReal()
  }

  isGroupAllSelected(group: LeafGroup): boolean {
    const active = group.leaves.filter((l) => !l.inactive)
    if (!active.length) return false
    return active.every((l) => this.isSelected(l.code))
  }

  isGroupPartiallySelected(group: LeafGroup): boolean {
    const active = group.leaves.filter((l) => !l.inactive)
    if (!active.length) return false
    const selectedCount = active.filter((l) => this.isSelected(l.code)).length
    return selectedCount > 0 && selectedCount < active.length
  }

  toggleGroup(group: LeafGroup): void {
    this.userEdited.set(true)
    const active = group.leaves.filter((l) => !l.inactive)
    const allSelected = this.isGroupAllSelected(group)
    const current = new Set(this.internalChecked())
    if (allSelected) {
      for (const l of active) current.delete(l.code)
    } else {
      for (const l of active) current.add(l.code)
    }
    this.internalChecked.set([...current])
    this.emitReal()
  }

  groupSelectedCount(group: LeafGroup): number {
    return group.leaves.filter((l) => !l.inactive && this.isSelected(l.code)).length
  }

  groupTotalCount(group: LeafGroup): number {
    return group.leaves.filter((l) => !l.inactive).length
  }

  groupHint(group: LeafGroup): string {
    return this.isGroupAllSelected(group)
      ? `Deselect all in "${group.label}"`
      : `Select all in "${group.label}"`
  }

  // ─────────────────────────── parent-group helpers ───────────────────────────

  /** Sum of selected active leaves across every child of a parent group. */
  parentSelectedCount(parent: ParentGroup): number {
    let n = 0
    for (const g of parent.children) n += this.groupSelectedCount(g)
    return n
  }

  /** Sum of total active leaves across every child of a parent group. */
  parentTotalCount(parent: ParentGroup): number {
    let n = 0
    for (const g of parent.children) n += this.groupTotalCount(g)
    return n
  }

  isParentAllSelected(parent: ParentGroup): boolean {
    const total = this.parentTotalCount(parent)
    if (!total) return false
    return this.parentSelectedCount(parent) === total
  }

  isParentPartiallySelected(parent: ParentGroup): boolean {
    const selected = this.parentSelectedCount(parent)
    if (!selected) return false
    return selected < this.parentTotalCount(parent)
  }

  toggleParent(parent: ParentGroup): void {
    this.userEdited.set(true)
    const allSelected = this.isParentAllSelected(parent)
    const current = new Set(this.internalChecked())
    for (const group of parent.children) {
      const active = group.leaves.filter((l) => !l.inactive)
      if (allSelected) {
        for (const l of active) current.delete(l.code)
      } else {
        for (const l of active) current.add(l.code)
      }
    }
    this.internalChecked.set([...current])
    this.emitReal()
  }

  parentHint(parent: ParentGroup): string {
    return this.isParentAllSelected(parent)
      ? `Deselect all in "${parent.label}"`
      : `Select all in "${parent.label}"`
  }

  // ─────────────────────────── expand / collapse ───────────────────────────

  isParentExpanded(parent: ParentGroup): boolean {
    return !this.collapsedParents().has(parent.code)
  }

  toggleParentExpanded(parent: ParentGroup): void {
    const next = new Set(this.collapsedParents())
    if (next.has(parent.code)) next.delete(parent.code)
    else next.add(parent.code)
    this.collapsedParents.set(next)
  }

  /** Compact label for the chip body. Prefer the node's `code`; if the code
   * is long (multi-word like "TD Capital USA"), prefer the bracketed acronym
   * when the label has one; otherwise fall back to the code itself. */
  shortCode(node: EntityNode): string {
    if (node.code.length <= 12) return node.code
    const m = /\(([^)]+)\)\s*$/.exec(node.label)
    if (m && m[1].toLowerCase() !== 'inactive') return m[1]
    return node.code
  }

  resetToDefault(): void {
    this.userEdited.set(true)
    if (this.resetMode() === 'check-all') {
      const all = [...this.activeLeafCodes()]
      this.internalChecked.set(all)
      this.selectedCodesChange.emit(all)
    } else {
      this.internalChecked.set([])
      this.selectedCodesChange.emit([])
    }
  }

  // ───────────────────────── helpers ─────────────────────────

  private applyDefault(): void {
    const def = defaultEntitiesFor(this.regionSig(), this.segmentSig())
    this.internalChecked.set(def)
    this.selectedCodesChange.emit(def)
  }

  private emitReal(): void {
    const real = this.internalChecked().filter((c) => !isEnterpriseGroupCode(c))
    this.selectedCodesChange.emit(real)
  }
}

/**
 * Walk the tree and emit one {@link LeafGroup} per node whose children are all
 * leaves. Top-level leaves (no children at all) are bundled into an "Other"
 * group at the end so they still show up.
 */
function buildLeafGroups(roots: EntityNode[]): LeafGroup[] {
  const rows = buildRenderRows(roots)
  const flat: LeafGroup[] = []
  for (const row of rows) {
    if (row.kind === 'leaf') flat.push(row)
    else flat.push(...row.children)
  }
  return flat
}

/**
 * Walk the tree and emit one render row per top-level grouping:
 * - A {@link ParentGroup} is emitted when a node has multiple "leaf-only
 *   parent" children (e.g. TDGUS → TDBUSH / TDH / TDGUS-O), so the UI can
 *   render a bracket frame around them with a master corner-tag checkbox.
 * - A {@link LeafGroup} is emitted for any node whose own children are all
 *   leaves (the existing behaviour).
 * - Standalone top-level leaves still aggregate into a trailing "Other"
 *   LeafGroup so they remain visible.
 */
function buildRenderRows(roots: EntityNode[]): RenderRow[] {
  const rows: RenderRow[] = []
  const standalone: EntityNode[] = []

  const shortFor = (label: string, code: string): string => {
    const m = /\(([^)]+)\)\s*$/.exec(label)
    if (m && m[1]) return m[1]
    if (label.length <= 16) return label
    return code
  }

  const leafGroupFromNode = (node: EntityNode): LeafGroup => ({
    kind: 'leaf',
    code: node.code,
    label: node.label,
    shortLabel: shortFor(node.label, node.code),
    leaves: node.children ?? [],
  })

  const walk = (nodes: EntityNode[]) => {
    for (const node of nodes) {
      const hasChildren = !!node.children?.length
      if (!hasChildren) {
        standalone.push(node)
        continue
      }
      const childList = node.children!
      const allChildrenAreLeaves = childList.every((c) => !c.children?.length)
      if (allChildrenAreLeaves) {
        rows.push(leafGroupFromNode(node))
        continue
      }
      // Node has grandchildren. If *every* child is itself a leaf-only parent,
      // emit a ParentGroup that wraps them. Otherwise keep descending so the
      // existing flat behaviour is preserved for arbitrary nesting.
      const childrenAreLeafOnlyParents = childList.every(
        (c) => !!c.children?.length && c.children!.every((g) => !g.children?.length),
      )
      if (childrenAreLeafOnlyParents) {
        rows.push({
          kind: 'parent',
          code: node.code,
          label: node.label,
          shortLabel: shortFor(node.label, node.code),
          children: childList.map(leafGroupFromNode),
        })
      } else {
        walk(childList)
      }
    }
  }
  walk(roots)

  if (standalone.length) {
    rows.push({
      kind: 'leaf',
      code: '__OTHER__',
      label: 'Other',
      shortLabel: 'Other',
      leaves: standalone,
    })
  }
  return rows
}
