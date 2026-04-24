import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzTagModule } from 'ng-zorro-antd/tag'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { TdInputComponent } from './td-input/td-input.component'
import { TdSelectComponent } from './td-select/td-select.component'
import { StatusBadgeComponent } from './status-badge/status-badge.component'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzIconModule,
  ],
  declarations: [TdInputComponent, TdSelectComponent, StatusBadgeComponent],
  exports: [TdInputComponent, TdSelectComponent, StatusBadgeComponent],
})
export class LeapUiAngularModule {}
