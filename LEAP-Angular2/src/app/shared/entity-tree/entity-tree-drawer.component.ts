import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, Output, signal } from '@angular/core'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzDrawerModule } from 'ng-zorro-antd/drawer'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { entitySelectionCounts, regionShowsEntityTree } from './entity-data'
import { EntityTreeSelectComponent } from './entity-tree-select.component'

@Component({
  selector: 'app-entity-tree-drawer',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzDrawerModule,
    NzIconModule,
    EntityTreeSelectComponent,
  ],
  template: `
    @if (regionShowsEntityTree(region)) {
      <button
        nz-button
        nzType="default"
        type="button"
        class="entity-drawer-trigger"
        (click)="openDrawer()"
      >
        <span nz-icon nzType="apartment" nzTheme="outline"></span>
        Legal entities ({{ selectionCounts().selected }}/{{ selectionCounts().total }})
      </button>

      <nz-drawer
        [nzVisible]="drawerOpen()"
        nzTitle="Legal entities"
        nzPlacement="right"
        [nzWidth]="480"
        [nzClosable]="true"
        (nzOnClose)="closeDrawer()"
      >
        <ng-container *nzDrawerContent>
          <div class="entity-drawer-body">
            <app-entity-tree-select
              [region]="region"
              [segments]="segments"
              [selectedCodes]="selectedCodes"
              layout="vertical"
              (selectedCodesChange)="onSelectionChange($event)"
            ></app-entity-tree-select>
          </div>
        </ng-container>
      </nz-drawer>
    }
  `,
  styles: [`
    :host { display: block; }
    .entity-drawer-trigger {
      width: 100%;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      border-color: #058901 !important;
      color: #058901 !important;
      border-radius: 0 !important;
    }
    .entity-drawer-trigger:hover {
      border-color: #047001 !important;
      color: #047001 !important;
      background: #f0f5f1 !important;
    }
    .entity-drawer-body {
      height: calc(100vh - 120px);
      min-height: 320px;
      display: flex;
      flex-direction: column;
    }
    .entity-drawer-body app-entity-tree-select {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: block;
    }
    :host ::ng-deep .entity-drawer-body .entity-tree-card {
      height: 100%;
      border: none;
      box-shadow: none;
      padding: 0;
    }
  `],
})
export class EntityTreeDrawerComponent {
  @Input() region: string | null = null
  @Input() segments: string[] = []
  @Input() selectedCodes: string[] = []
  @Output() selectedCodesChange = new EventEmitter<string[]>()

  readonly regionShowsEntityTree = regionShowsEntityTree
  readonly drawerOpen = signal(false)

  selectionCounts(): { selected: number; total: number } {
    return entitySelectionCounts(this.region, this.selectedCodes)
  }

  openDrawer(): void {
    this.drawerOpen.set(true)
  }

  closeDrawer(): void {
    this.drawerOpen.set(false)
  }

  onSelectionChange(next: string[]): void {
    this.selectedCodesChange.emit(next)
  }
}
