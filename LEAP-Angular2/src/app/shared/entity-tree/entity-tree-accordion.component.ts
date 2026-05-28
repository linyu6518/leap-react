import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, Output, signal } from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { entitySelectionCounts, regionShowsEntityTree } from './entity-data'
import { EntityTreeSelectComponent } from './entity-tree-select.component'

@Component({
  selector: 'app-entity-tree-accordion',
  standalone: true,
  imports: [CommonModule, NzIconModule, EntityTreeSelectComponent],
  template: `
    @if (regionShowsEntityTree(region)) {
      <section class="entity-accordion" [class.expanded]="expanded()">
        <button
          type="button"
          class="entity-accordion-head"
          (click)="toggle()"
          [attr.aria-expanded]="expanded()"
        >
          <span class="entity-accordion-head-main">
            <span nz-icon nzType="apartment" nzTheme="outline" class="entity-accordion-icon"></span>
            <span class="entity-accordion-title">Legal entities</span>
            <span class="entity-accordion-count">
              {{ selectionCounts().selected }}/{{ selectionCounts().total }} selected
            </span>
          </span>
          <span class="entity-accordion-chevron" [class.expanded]="expanded()"></span>
        </button>

        @if (expanded()) {
          <div class="entity-accordion-body">
            <app-entity-tree-select
              [region]="region"
              [segments]="segments"
              [selectedCodes]="selectedCodes"
              (selectedCodesChange)="onSelectionChange($event)"
            ></app-entity-tree-select>
          </div>
        }
      </section>
    }
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .entity-accordion {
      border: 1px solid #8C8C8C;
      border-radius: 4px 4px 0 0;
      background: #FFFFFF;
    }
    .entity-accordion.expanded {
      border-color: #008a00;
      border-width: 1px 1px 1px 1px;
      box-shadow: none;
    }
    .entity-accordion-head {
      width: 100%;
      height: 54px;
      min-height: 54px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 40px 0 12px;
      border: none;
      background: #FFFFFF;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
    }
    .entity-accordion-head:hover {
      background: #FAFAFA;
    }
    .entity-accordion-head-main {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .entity-accordion-icon {
      color: #058901;
      font-size: 14px;
    }
    .entity-accordion-title {
      font-size: 16px;
      font-weight: 500;
      color: #1c1c1c;
    }
    .entity-accordion-count {
      font-size: 12px;
      font-weight: 500;
      color: #8C8C8C;
      background: #F2F2F2;
      padding: 2px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .entity-accordion-chevron {
      position: relative;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .entity-accordion-chevron::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 8px;
      height: 8px;
      border-right: 1.5px solid #616161;
      border-bottom: 1.5px solid #616161;
      transform: translate(-50%, -65%) rotate(-45deg);
      transition: transform 0.2s ease;
    }
    .entity-accordion-chevron.expanded::after {
      transform: translate(-50%, -50%) rotate(45deg);
    }
    .entity-accordion-body {
      border-top: 1px solid #E6E6E6;
      border-bottom: 2px solid #008a00;
      border-bottom: 2px solid #008a00;
      max-height: 280px;
      overflow: hidden;
    }
    .entity-accordion-body app-entity-tree-select {
      display: block;
      max-height: 280px;
    }
    :host ::ng-deep .entity-accordion-body .entity-tree-card {
      border: none;
      box-shadow: none;
      padding-top: 8px;
    }
    :host ::ng-deep .entity-accordion-body .entity-tree-body {
      max-height: 220px;
    }
  `],
})
export class EntityTreeAccordionComponent {
  @Input() region: string | null = null
  @Input() segments: string[] = []
  @Input() selectedCodes: string[] = []
  @Output() selectedCodesChange = new EventEmitter<string[]>()

  readonly regionShowsEntityTree = regionShowsEntityTree
  readonly expanded = signal(false)

  selectionCounts(): { selected: number; total: number } {
    return entitySelectionCounts(this.region, this.selectedCodes)
  }

  toggle(): void {
    this.expanded.update((v) => !v)
  }

  onSelectionChange(next: string[]): void {
    this.selectedCodesChange.emit(next)
  }
}
