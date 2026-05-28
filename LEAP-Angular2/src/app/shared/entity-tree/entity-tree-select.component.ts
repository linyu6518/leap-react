import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core'
import { NzTreeModule, NzTreeNodeOptions, NzFormatEmitEvent } from 'ng-zorro-antd/tree'
import { NzIconModule } from 'ng-zorro-antd/icon'
import {
  EntityNode,
  defaultEntitiesFor,
  entityTreeFor,
  flattenEntityCodes,
  isEnterpriseGroupCode,
  regionShowsEntityTree,
} from './entity-data'

/**
 * Reusable Region/Segment-aware legal-entity multi-select tree.
 *
 * Renders nothing when the Region has no entity tree (CAD / Europe / null).
 * On Region+Segment change the selection auto-resets to the default mapping
 * unless the consumer has manually edited the selection (`userEdited` flag).
 * The "Reset to default" link forces the default again.
 */
@Component({
  selector: 'app-entity-tree-select',
  standalone: true,
  imports: [CommonModule, NzTreeModule, NzIconModule],
  template: `
    @if (visible()) {
      <div class="entity-tree-card" [class.vertical-layout]="layout === 'vertical'" [class.header-hidden]="hideHeader">
        @if (!hideHeader) {
          <header class="entity-tree-head">
            <div class="entity-tree-title">
              <span nz-icon nzType="apartment" nzTheme="outline"></span>
              <span>Legal entities</span>
              <span class="entity-tree-count">{{ selectedRealCount() }} / {{ totalRealCount() }}</span>
            </div>
            <button
              type="button"
              class="entity-tree-reset"
              (click)="resetToDefault()"
              [disabled]="!canReset()"
              title="Reset to default selection for this Region / Segment"
            >Reset to default</button>
          </header>
        }
        <div class="entity-tree-body">
        <nz-tree
          [nzData]="treeData()"
          [nzCheckable]="true"
          [nzMultiple]="true"
          [nzCheckStrictly]="false"
          [nzCheckedKeys]="checkedKeys()"
          [nzExpandedKeys]="expandedKeys()"
          [nzBlockNode]="true"
          (nzCheckBoxChange)="onCheckBoxChange($event)"
          (nzExpandChange)="onExpandChange($event)"
        ></nz-tree>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; }
    :host(.fill-panel) { height: 100%; min-height: 0; width: 100%; }
    .entity-tree-card {
      border: 1px solid #E6E6E6;
      background: #FFFFFF;
      padding: 14px 18px 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      min-height: 0;
      width: 100%;
      box-sizing: border-box;
    }
    .entity-tree-card.vertical-layout {
      height: 100%;
      width: 100%;
      min-height: 0;
      padding-bottom: 12px;
      overflow: hidden;
    }
    .entity-tree-card.header-hidden {
      padding-top: 8px;
    }
    .entity-tree-body {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      margin-top: 4px;
      max-height: 420px;
    }
    .entity-tree-card.vertical-layout .entity-tree-body {
      flex: 1 1 auto;
      max-height: none;
      overflow-y: auto;
      overflow-x: auto;
    }
    .entity-tree-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
      flex: 0 0 auto;
    }
    .entity-tree-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #3a473a;
    }
    .entity-tree-title [nz-icon] { color: #058901; font-size: 14px; }
    .entity-tree-count {
      margin-left: 4px;
      font-size: 11px;
      font-weight: 500;
      color: #8C8C8C;
      background: #F2F2F2;
      padding: 2px 8px;
      border-radius: 999px;
      letter-spacing: 0.2px;
    }
    .entity-tree-reset {
      border: none;
      background: transparent;
      color: #058901;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 2px;
    }
    .entity-tree-reset:hover:not(:disabled) { background: #F0F5F1; color: #047001; }
    .entity-tree-reset:disabled { color: #BFBFBF; cursor: not-allowed; }

    /* Tighter ng-zorro tree to fit query panel layout. */
    :host ::ng-deep .ant-tree {
      font-size: 14px;
      font-weight: 500;
      color: #1c1c1c;
    }
    :host ::ng-deep .ant-tree-treenode { padding: 2px 0; }
    :host ::ng-deep .ant-tree-node-content-wrapper,
    :host ::ng-deep .ant-tree-title {
      font-weight: 500;
      color: #1c1c1c;
      white-space: normal;
      word-break: break-word;
      line-height: 1.35;
    }
    :host ::ng-deep .ant-tree-list-holder-inner {
      min-width: 0;
    }
    :host ::ng-deep .ant-tree-checkbox-inner {
      border-color: #058901;
    }
    :host ::ng-deep .ant-tree-checkbox-checked .ant-tree-checkbox-inner,
    :host ::ng-deep .ant-tree-checkbox-indeterminate .ant-tree-checkbox-inner {
      background-color: #058901;
      border-color: #058901;
    }
    :host ::ng-deep .ant-tree-checkbox-disabled .ant-tree-node-content-wrapper {
      color: #BFBFBF;
      font-style: italic;
    }

    :host ::ng-deep .ant-tree-switcher .ant-tree-switcher-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      vertical-align: middle;
    }
    :host ::ng-deep .ant-tree-switcher .ant-tree-switcher-icon svg {
      display: none;
    }
    :host ::ng-deep .ant-tree-switcher .ant-tree-switcher-icon::after {
      content: '';
      display: block;
      width: 8px;
      height: 8px;
      border-right: 1.5px solid #058901;
      border-bottom: 1.5px solid #058901;
      transform: rotate(-45deg);
      transition: transform 0.2s ease;
    }
    :host ::ng-deep .ant-tree-switcher_open .ant-tree-switcher-icon::after {
      transform: rotate(45deg);
    }
  `],
  host: {
    '[class.fill-panel]': 'layout === "vertical"',
  },
})
export class EntityTreeSelectComponent implements OnChanges {
  @Input() region: string | null = null
  @Input() segments: string[] = []
  @Input() selectedCodes: string[] = []
  /** vertical = right Report Config panel (scrollable tree); horizontal = query bar below. */
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal'
  /** Hide title row when embedded in accordion (header shown by parent). */
  @Input() hideHeader = false
  @Output() selectedCodesChange = new EventEmitter<string[]>()

  /** Tracks whether the user has touched the tree since the last (region, segment) change. */
  private userEdited = signal(false)
  private internalChecked = signal<string[]>([])
  private internalExpanded = signal<string[]>([])
  /** True after the first ngOnChanges so we can distinguish boot vs. update calls. */
  private isInitialized = false

  visible = computed(() => regionShowsEntityTree(this.region))

  /** ng-zorro NzTreeNodeOptions[] derived from the current Region's tree. */
  readonly treeData = computed<NzTreeNodeOptions[]>(() => {
    const roots = entityTreeFor(this.region)
    return roots.map((n) => this.toNzNode(n))
  })

  /** Real (non-grouping) entity codes that exist in the current tree. */
  private readonly leafCodeSet = computed(() => {
    return new Set(flattenEntityCodes(entityTreeFor(this.region)))
  })

  readonly totalRealCount = computed(() => this.leafCodeSet().size)

  readonly selectedRealCount = computed(() => {
    const leaves = this.leafCodeSet()
    return this.internalChecked().filter((c) => leaves.has(c)).length
  })

  readonly checkedKeys = computed(() => this.internalChecked())
  readonly expandedKeys = computed(() => this.internalExpanded())

  /** Reset is enabled only when the current selection differs from the default. */
  readonly canReset = computed(() => {
    const leaves = this.leafCodeSet()
    const current = new Set(this.internalChecked().filter((c) => leaves.has(c)))
    const def = defaultEntitiesFor(this.region, this.segments)
    if (current.size !== def.length) return true
    for (const c of def) if (!current.has(c)) return true
    return false
  })

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isInitialized) {
      this.isInitialized = true
      // Honor the parent's initial selection when present (e.g. restored from
      // sessionStorage). Otherwise fall back to (region, segment) defaults.
      const initial = this.selectedCodes ?? []
      if (initial.length) {
        this.internalChecked.set([...initial])
      } else {
        this.applyDefault()
      }
      this.resetExpansion()
      return
    }

    const regionChanged = 'region' in changes
    const segmentsChanged = 'segments' in changes
    const selectedChanged = 'selectedCodes' in changes

    if (regionChanged || segmentsChanged) {
      this.userEdited.set(false)
      this.applyDefault()
      this.resetExpansion()
      return
    }
    if (selectedChanged) {
      // External value push (parent updated the bound signal) — sync silently.
      const next = this.selectedCodes ?? []
      this.internalChecked.set([...next])
    }
  }

  /** Reset to (region, segment) defaults and notify the parent. */
  resetToDefault(): void {
    this.userEdited.set(false)
    this.applyDefault()
  }

  onCheckBoxChange(event: NzFormatEmitEvent): void {
    this.userEdited.set(true)
    const checked = (event.keys ?? []).map((k) => String(k))
    this.internalChecked.set(checked)
    this.emitReal()
  }

  onExpandChange(event: NzFormatEmitEvent): void {
    const expanded = (event.keys ?? []).map((k) => String(k))
    this.internalExpanded.set(expanded)
  }

  // ───────────────────────── helpers ─────────────────────────

  private applyDefault(): void {
    const def = defaultEntitiesFor(this.region, this.segments)
    this.internalChecked.set(def)
    this.selectedCodesChange.emit(def)
  }

  private resetExpansion(): void {
    // Auto-expand top two levels so the user immediately sees the structure.
    const roots = entityTreeFor(this.region)
    const expanded: string[] = []
    const maxDepth = this.region === 'US' ? 3 : 2
    const walk = (nodes: EntityNode[], depth: number) => {
      for (const n of nodes) {
        if (n.children?.length && depth < maxDepth) {
          expanded.push(n.code)
          walk(n.children, depth + 1)
        }
      }
    }
    walk(roots, 0)
    this.internalExpanded.set(expanded)
  }

  private emitReal(): void {
    const leaves = this.leafCodeSet()
    const real = this.internalChecked().filter(
      (c) => leaves.has(c) && !isEnterpriseGroupCode(c),
    )
    this.selectedCodesChange.emit(real)
  }

  private toNzNode(node: EntityNode): NzTreeNodeOptions {
    const children = node.children?.map((c) => this.toNzNode(c))
    return {
      title: node.label,
      key: node.code,
      isLeaf: !children?.length,
      disabled: !!node.inactive,
      disableCheckbox: !!node.inactive,
      children,
    }
  }
}
