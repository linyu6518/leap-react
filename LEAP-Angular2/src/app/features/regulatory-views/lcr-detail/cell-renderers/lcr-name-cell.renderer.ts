import { Component } from '@angular/core'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'

interface LcrNameContext {
  toggleNode?: (id: string) => void
  signedOffNodes?: Set<string>
}

interface LcrNameRowData {
  nodeId: string
  name: string
  level: number
  isLeaf: boolean
  isExpanded: boolean
}

@Component({
  selector: 'app-lcr-name-cell',
  standalone: true,
  template: `
    <div
      class="name-cell-wrap"
      [style.padding-left.px]="indent"
      (click)="onCellClick($event)"
    >
      @if (isSignedOff) {
        <span class="signoff-badge" aria-label="Signed off">
          Sign-off
          <span class="signoff-badge__arrow"></span>
        </span>
      }
      @if (!isLeaf) {
        <span
          class="expansion-icon"
          [class.expanded]="isExpanded"
        >{{ isExpanded ? '−' : '+' }}</span>
      }
      <span class="name-text" [class.level-0]="level === 0">{{ name }}</span>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    .name-cell-wrap {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      cursor: pointer;
      gap: 8px;
    }

    /* Ribbon badge */
    .signoff-badge {
      position: absolute;
      top: 0;
      left: 0;
      display: inline-flex;
      align-items: center;
      background: #52C41A;
      color: #ffffff;
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
      padding: 3px 8px 3px 6px;
      white-space: nowrap;
      letter-spacing: 0.2px;
      z-index: 1;
    }

    /* Right-pointing chevron using a pseudo-element */
    .signoff-badge__arrow {
      position: absolute;
      right: -7px;
      top: 0;
      width: 0;
      height: 0;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-left: 7px solid #52C41A;
    }

    /* Indent the text content so it doesn't hide under badge */
    .name-cell-wrap.has-badge {
      padding-top: 14px;
    }

    .expansion-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 11px;
      height: 11px;
      background-color: #c0c0c0;
      border-radius: 2px;
      color: #fff;
      font-size: 11px;
      font-weight: 400;
      line-height: 1;
    }
    .expansion-icon.expanded {
      background-color: #1890ff;
    }

    .name-text { font-weight: 400; }
    .name-text.level-0 { font-weight: 600; }
  `],
})
export class LcrNameCellRendererComponent implements ICellRendererAngularComp {
  name = ''
  level = 0
  isLeaf = true
  isExpanded = false
  isSignedOff = false
  indent = 0
  private nodeId = ''
  private toggleNode: ((id: string) => void) | null = null

  agInit(params: ICellRendererParams): void {
    const data = params.data as LcrNameRowData | undefined
    if (data) {
      this.name = data.name
      this.level = data.level
      this.isLeaf = data.isLeaf
      this.isExpanded = data.isExpanded
      this.nodeId = data.nodeId
      this.indent = data.level * 20
    }
    const ctx = params.context as LcrNameContext | undefined
    this.toggleNode = ctx?.toggleNode ?? null
    this.isSignedOff = ctx?.signedOffNodes?.has(this.nodeId) ?? false
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }

  onCellClick(e: Event): void {
    if (this.isLeaf) return
    e.preventDefault()
    e.stopPropagation()
    this.toggleNode?.(this.nodeId)
  }
}
