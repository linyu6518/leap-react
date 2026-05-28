import { CommonModule } from '@angular/common'
import { Component, forwardRef, signal } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NzTreeModule, NzTreeNodeOptions, NzFormatEmitEvent } from 'ng-zorro-antd/tree'
import { EntityNode, US_SEGMENT_PICKER_TREE } from './entity-data'

@Component({
  selector: 'app-us-segment-tree-picker',
  standalone: true,
  imports: [CommonModule, NzTreeModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UsSegmentTreePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="us-segment-tree-card">
      <nz-tree
        [nzData]="treeData"
        [nzCheckable]="true"
        [nzMultiple]="true"
        [nzCheckStrictly]="true"
        [nzCheckedKeys]="checkedKeys()"
        [nzExpandedKeys]="expandedKeys()"
        [nzBlockNode]="true"
        (nzCheckBoxChange)="onCheckBoxChange($event)"
        (nzExpandChange)="onExpandChange($event)"
      ></nz-tree>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .us-segment-tree-card {
      border: 1px solid #E6E6E6;
      background: #FFFFFF;
      border-radius: 2px;
      padding: 8px 12px 4px;
      max-height: 220px;
      overflow-y: auto;
    }
    :host ::ng-deep .ant-tree { font-size: 13px; }
    :host ::ng-deep .ant-tree-treenode { padding: 2px 0; }
    :host ::ng-deep .ant-tree-checkbox-inner {
      border-color: #058901;
    }
    :host ::ng-deep .ant-tree-checkbox-checked .ant-tree-checkbox-inner {
      background-color: #058901;
      border-color: #058901;
    }
  `],
})
export class UsSegmentTreePickerComponent implements ControlValueAccessor {
  readonly treeData: NzTreeNodeOptions[] = US_SEGMENT_PICKER_TREE.map((n) => this.toNzNode(n))

  readonly checkedKeys = signal<string[]>([])
  readonly expandedKeys = signal<string[]>(this.defaultExpandedKeys())

  private onChange: (value: string[]) => void = () => {}
  private onTouched: () => void = () => {}
  private disabled = false

  writeValue(value: string[] | null): void {
    this.checkedKeys.set(Array.isArray(value) ? [...value] : [])
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  onCheckBoxChange(event: NzFormatEmitEvent): void {
    if (this.disabled) return
    const checked = (event.keys ?? []).map((k) => String(k))
    this.checkedKeys.set(checked)
    this.onChange(checked)
    this.onTouched()
  }

  onExpandChange(event: NzFormatEmitEvent): void {
    const expanded = (event.keys ?? []).map((k) => String(k))
    this.expandedKeys.set(expanded)
  }

  private defaultExpandedKeys(): string[] {
    const expanded: string[] = []
    const walk = (nodes: EntityNode[], depth: number) => {
      for (const n of nodes) {
        if (n.children?.length && depth < 2) {
          expanded.push(n.code)
          walk(n.children, depth + 1)
        }
      }
    }
    walk(US_SEGMENT_PICKER_TREE, 0)
    return expanded
  }

  private toNzNode(node: EntityNode): NzTreeNodeOptions {
    const children = node.children?.map((c) => this.toNzNode(c))
    return {
      title: node.label,
      key: node.code,
      isLeaf: !children?.length,
      children,
    }
  }
}
