import { Component, OnInit } from '@angular/core'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'

export interface SummaryRowData {
  nodeId: string
  name: string
  level: number
  isExpanded: boolean
  isLeaf: boolean
  hasAlert?: boolean
  counterparties?: Record<string, unknown>
}

@Component({
  selector: 'app-deposit-name-cell',
  standalone: true,
  template: `
    <div
      class="deposit-name-cell"
      [style.padding-left.px]="indent"
      (click)="onCellClick($event)"
    >
      @if (!isLeaf) {
        <span
          class="expansion-icon"
          [class.expanded]="isExpanded"
          [innerText]="isExpanded ? '−' : '+'"
        ></span>
      }
      <span class="name-text" [class.level-0]="level === 0">{{ name }}</span>
    </div>
  `,
  styles: [`
    .deposit-name-cell {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }
    .deposit-name-cell:has(.name-text.level-0) { cursor: pointer; }
    .expansion-icon {
      margin-right: 8px;
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
export class DepositNameCellRendererComponent implements ICellRendererAngularComp, OnInit {
  name = ''
  level = 0
  isLeaf = true
  isExpanded = false
  nodeId = ''
  indent = 0
  private toggleNode: ((id: string) => void) | null = null

  agInit(params: ICellRendererParams & { context?: { toggleNode?: (id: string) => void } }): void {
    const data = params.data as SummaryRowData
    if (data) {
      this.name = data.name
      this.level = data.level
      this.isLeaf = data.isLeaf
      this.isExpanded = data.isExpanded
      this.nodeId = data.nodeId
      this.indent = data.level * 20
    }
    this.toggleNode = params.context?.toggleNode ?? null
  }

  ngOnInit(): void {}

  onCellClick(e: Event): void {
    if (this.isLeaf) return
    e.preventDefault()
    e.stopPropagation()
    this.toggleNode?.(this.nodeId)
  }

  refresh(params: ICellRendererParams & { context?: { toggleNode?: (id: string) => void } }): boolean {
    this.agInit(params)
    return true
  }
}
