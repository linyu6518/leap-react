import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  signal,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { NzTreeModule, NzTreeNodeOptions, NzFormatEmitEvent, NzTreeComponent } from 'ng-zorro-antd/tree'
import { NzIconModule } from 'ng-zorro-antd/icon'
import {
  EntityNode,
  entityTreeFor,
  isEnterpriseGroupCode,
  segmentLabelFor,
} from './entity-data'

/**
 * Segment picker:
 * - US region → embedded nz-tree (multi-select, expand to L2)
 * - Enterprise region → simple nz-select dropdown (CAD Retail / USD Retail)
 */
@Component({
  selector: 'app-segment-tree-picker',
  standalone: true,
  imports: [CommonModule, NzTreeModule, NzIconModule],
  template: `
    <div
      class="seg-wrap"
      [class.seg-wrap--header]="variant === 'header'"
      [class.open]="isOpen()"
      [class.active]="isActive()"
    >
      <button
        type="button"
        class="seg-trigger"
        (click)="toggle()"
        [attr.aria-expanded]="isOpen()"
      >
        <span
          class="seg-value"
          [class.seg-value--placeholder]="variant === 'header' && !triggerLabel()"
        >{{ triggerLabel() || (variant === 'header' ? placeholder : '') }}</span>
        <span class="seg-arrow"></span>
      </button>
      @if (variant !== 'header') {
        <span class="seg-label">{{ placeholder }}</span>
      }

      @if (isOpen() && treeData().length > 0) {
        <div class="seg-dropdown" (click)="$event.stopPropagation()">
          <div class="seg-tree-wrap">
            <nz-tree
              #treeRef
              [attr.data-region]="regionKey()"
              [nzData]="treeData()"
              [nzCheckable]="true"
              [nzMultiple]="true"
              [nzCheckStrictly]="true"
              [nzCheckedKeys]="checkedKeys()"
              [nzExpandedKeys]="expandedKeys()"
              [nzBlockNode]="true"
              (nzCheckBoxChange)="onCheck($event)"
              (nzExpandChange)="onExpand($event)"
              (nzClick)="onNodeClick($event)"
            ></nz-tree>
          </div>
          <div class="seg-dropdown-footer">
            <div class="seg-footer-actions">
              <button type="button" class="seg-link-btn" (click)="selectAll()">Select all</button>
              <button type="button" class="seg-link-btn" (click)="clearAll()">Clear all</button>
            </div>
            <button type="button" class="seg-confirm-btn" (click)="confirmSelection()">Confirm</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; position: relative; width: 100%; }

    .seg-wrap {
      position: relative;
      width: 100%;
    }

    .seg-label {
      position: absolute;
      left: 12px;
      top: 18px;
      font-size: 16px;
      font-weight: 400;
      color: #1c1c1c;
      pointer-events: none;
      transition: all 0.2s ease;
      background: #fff;
      padding: 0 2px;
      z-index: 2;
      line-height: 1;
      white-space: nowrap;
    }
    .seg-wrap.active .seg-label {
      top: 6px;
      font-size: 12px;
    }

    /* ── US tree trigger ── */
    .seg-trigger {
      width: 100%;
      height: 54px;
      box-sizing: border-box;
      padding: 8px 40px 8px 12px;
      border: 1px solid #8C8C8C;
      border-radius: 4px 4px 0 0;
      background: #fff;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      display: flex;
      align-items: flex-end;
      position: relative;
      transition: border-color 0.2s;
    }
    .seg-trigger:hover { border-color: #8C8C8C; }
    .seg-wrap.open .seg-trigger {
      border-color: #008a00;
      border-width: 1px 1px 3px 1px;
      outline: none;
    }
    .seg-trigger:focus { outline: none; }

    .seg-value {
      font-size: 16px;
      font-weight: 500;
      color: #1a1a1a;
      line-height: 1.5;
      margin-top: 12px;
      margin-left: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(100% - 40px);
    }

    .seg-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(calc(-50% - 2px));
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #616161;
      pointer-events: none;
    }
    .seg-arrow::after {
      content: '';
      display: block;
      width: 8px;
      height: 8px;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg) scale(0.9);
      transition: transform 0.2s ease;
    }
    .seg-wrap.open .seg-arrow {
      transform: translateY(calc(-50% + 2px));
    }
    .seg-wrap.open .seg-arrow::after {
      transform: rotate(225deg) scale(0.9);
    }

    .seg-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      min-width: 100%;
      width: max-content;
      max-width: 520px;
      z-index: 1050;
      background: #fff;
      border: 1px solid rgba(0,0,0,0.12);
      border-top: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .seg-tree-wrap {
      max-height: 300px;
      overflow-y: auto;
      padding: 8px 4px;
    }

    .seg-dropdown-footer {
      border-top: 1px solid #f0f0f0;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff;
    }

    .seg-footer-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .seg-link-btn {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      color: #058901;
      &:hover { text-decoration: underline; }
    }

    .seg-confirm-btn {
      height: 28px;
      padding: 0 16px;
      background: #058901;
      color: #fff;
      border: none;
      border-radius: 2px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      &:hover { background: #047001; }
    }

    :host ::ng-deep .ant-tree {
      font-size: 14px;
      font-weight: 500;
      color: #1c1c1c;
    }
    :host ::ng-deep .ant-tree-treenode { padding: 2px 0; }

    /* No text wrap — dropdown width adjusts instead */
    :host ::ng-deep .ant-tree-title {
      font-weight: 500;
      color: #1c1c1c;
      white-space: nowrap;
      line-height: 1.5;
    }
    :host ::ng-deep .ant-tree-node-content-wrapper {
      white-space: nowrap;
    }

    /* Remove blue selection highlight — click is for checking only */
    :host ::ng-deep .ant-tree-node-content-wrapper,
    :host ::ng-deep .ant-tree-node-content-wrapper.ant-tree-node-selected {
      background: transparent !important;
    }
    :host ::ng-deep .ant-tree-node-content-wrapper:hover {
      background: rgba(0,0,0,0.04) !important;
      cursor: pointer;
    }

    :host ::ng-deep .ant-tree-checkbox-inner {
      border-color: #058901;
    }
    :host ::ng-deep .ant-tree-checkbox-checked .ant-tree-checkbox-inner,
    :host ::ng-deep .ant-tree-checkbox-indeterminate .ant-tree-checkbox-inner {
      background-color: #058901;
      border-color: #058901;
    }

    /* Header bar: visually match search's rendered height. */
    .seg-wrap--header .seg-trigger {
      height: 44px;
      min-height: 44px;
      padding: 0 32px 0 12px;
      align-items: center;
      box-sizing: border-box;
    }
    .seg-wrap--header .seg-value {
      margin-top: 0;
      line-height: 42px;
      font-size: 16px;
      font-weight: 500;
    }
    .seg-wrap--header .seg-value--placeholder {
      font-weight: 400;
      color: #1c1c1c;
    }
    .seg-wrap--header .seg-arrow {
      transform: translateY(calc(-50% - 2px));
    }
    .seg-wrap--header.open .seg-arrow {
      transform: translateY(calc(-50% + 2px));
    }
  `],
})
export class SegmentTreePickerComponent implements OnChanges {
  @Input() region: string | null = null
  @Input() selectedCodes: string[] = []
  @Input() placeholder = 'Segment'
  /** `header` = compact single-line control matching the header search input */
  @Input() variant: 'default' | 'header' = 'default'
  @Output() selectedCodesChange = new EventEmitter<string[]>()

  @ViewChild('treeRef') treeRef?: NzTreeComponent

  isOpen = signal(false)
  /** Mirrors @Input region so computed() reacts when Region changes. */
  private readonly _region = signal<string | null>(null)
  private _checked = signal<string[]>([])
  private _expanded = signal<string[]>([])

  readonly checkedKeys = this._checked.asReadonly()
  readonly expandedKeys = this._expanded.asReadonly()

  readonly isActive = computed(() => this.isOpen() || this._checked().length > 0)

  readonly treeData = computed<NzTreeNodeOptions[]>(() =>
    this.toNzNodes(entityTreeFor(this._region()))
  )

  readonly regionKey = computed(() => this._region() ?? '')

  readonly triggerLabel = computed(() => {
    const codes = this._checked().filter(c => !isEnterpriseGroupCode(c))
    if (!codes.length) return ''
    if (codes.length === 1) return segmentLabelFor(codes[0])
    return `${codes.length} selected`
  })

  constructor(private elRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    const regionChange = changes['region']
    const regionActuallyChanged =
      regionChange &&
      !regionChange.firstChange &&
      regionChange.previousValue !== regionChange.currentValue

    if (regionChange) {
      this._region.set(this.region)
      if (regionActuallyChanged) {
        this._checked.set([])
        this.selectedCodesChange.emit([])
        this.isOpen.set(false)
      }
      this.resetExpansion()
    }

    if ('selectedCodes' in changes && !regionActuallyChanged) {
      this._checked.set(this.validCodesForCurrentRegion(this.selectedCodes))
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false)
    }
  }

  toggle(): void {
    if (this.isOpen()) {
      this.isOpen.set(false)
    } else {
      this.resetExpansion()
      this.isOpen.set(true)
    }
  }

  onCheck(event: NzFormatEmitEvent): void {
    const checked = (event.keys ?? []).map(k => String(k))
    this._checked.set(checked)
    const real = checked.filter(c => !isEnterpriseGroupCode(c))
    this.selectedCodesChange.emit(real)
  }

  onNodeClick(event: NzFormatEmitEvent): void {
    const node = event.node
    if (!node || node.isDisabled || node.isDisableCheckbox) return
    node.setChecked(!node.isChecked)
    // Strict mode: toggling a node never affects its parent/children
    const checked = (this.treeRef?.getCheckedNodeList() ?? []).map(n => n.key)
    this._checked.set(checked)
    const real = checked.filter(c => !isEnterpriseGroupCode(c))
    this.selectedCodesChange.emit(real)
  }

  selectAll(): void {
    const keys: string[] = []
    const walk = (nodes: NzTreeNodeOptions[]) => {
      for (const n of nodes) {
        if (!n.disabled) keys.push(String(n.key))
        if (n.children?.length) walk(n.children)
      }
    }
    walk(this.treeData())
    this._checked.set(keys)
    this.selectedCodesChange.emit(keys.filter(c => !isEnterpriseGroupCode(c)))
  }

  clearAll(): void {
    this._checked.set([])
    this.selectedCodesChange.emit([])
  }

  confirmSelection(): void {
    this.isOpen.set(false)
  }

  onExpand(event: NzFormatEmitEvent): void {
    this._expanded.set((event.keys ?? []).map(k => String(k)))
  }

  private resetExpansion(): void {
    const roots = entityTreeFor(this._region())
    const expanded: string[] = []
    const walk = (nodes: EntityNode[], depth: number) => {
      for (const n of nodes) {
        if (n.children?.length && depth < 2) {
          expanded.push(n.code)
          walk(n.children, depth + 1)
        }
      }
    }
    walk(roots, 0)
    this._expanded.set(expanded)
  }

  private toNzNodes(roots: EntityNode[]): NzTreeNodeOptions[] {
    return roots.map(n => this.toNzNode(n))
  }

  private toNzNode(n: EntityNode): NzTreeNodeOptions {
    // Enterprise group pseudo-codes → map to real segment codes so they're selectable
    const key = n.code === '__CAD_RETAIL_GROUP__' ? 'CAD Retail'
               : n.code === '__USD_RETAIL_GROUP__' ? 'USD Retail'
               : n.code
    return {
      title: n.label,
      key,
      isLeaf: !n.children?.length,
      disabled: !!n.inactive,
      disableCheckbox: !!n.inactive,
      children: n.children?.map(c => this.toNzNode(c)),
    }
  }

  private validCodesForCurrentRegion(codes: string[]): string[] {
    const allowed = new Set<string>()
    const walk = (nodes: EntityNode[]) => {
      for (const n of nodes) {
        const key = n.code === '__CAD_RETAIL_GROUP__' ? 'CAD Retail'
                 : n.code === '__USD_RETAIL_GROUP__' ? 'USD Retail'
                 : n.code
        if (!n.inactive) allowed.add(key)
        if (n.children?.length) walk(n.children)
      }
    }
    walk(entityTreeFor(this._region()))
    return codes.filter(c => allowed.has(c))
  }
}
