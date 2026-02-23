import { Component, OnInit, signal } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzFormModule } from 'ng-zorro-antd/form'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'

const STORAGE_KEY = 'leap_lcr_view_params'

interface StoredParams {
  enterprise: string | null
  segment: string | null
  prior: string | null
  current: string | null
}

function loadParams(): Partial<StoredParams> {
  try {
    const s = sessionStorage.getItem(STORAGE_KEY)
    if (s) return JSON.parse(s) as StoredParams
  } catch (_) {}
  return {}
}

function saveParams(p: {
  enterprise?: string | null
  segment?: string | null
  prior?: Date | string | null
  current?: Date | string | null
}) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        enterprise: p.enterprise ?? null,
        segment: p.segment ?? null,
        prior: p.prior instanceof Date ? p.prior.toISOString().slice(0, 10) : p.prior ?? null,
        current: p.current instanceof Date ? p.current.toISOString().slice(0, 10) : p.current ?? null,
      })
    )
  } catch (_) {}
}

@Component({
  selector: 'app-lcr-view',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
  ],
  templateUrl: './lcr-view.component.html',
  styleUrls: ['./lcr-view.component.scss'],
})
export class LcrViewComponent implements OnInit {
  form: FormGroup
  canSubmit = signal(false)
  enterpriseOpen = signal(false)
  segmentOpen = signal(false)

  constructor(
    private router: Router,
    private fb: FormBuilder
  ) {
    const saved = loadParams()
    this.form = this.fb.group({
      enterprise: [saved.enterprise ?? null, Validators.required],
      segment: [saved.segment ?? null, Validators.required],
      prior: [saved.prior ? new Date(saved.prior) : null, Validators.required],
      current: [saved.current ? new Date(saved.current) : null, Validators.required],
    })
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.updateCanSubmit())
    this.form.statusChanges.subscribe(() => this.updateCanSubmit())
    this.updateCanSubmit()
  }

  private updateCanSubmit(): void {
    const valid = this.form.valid
    const v = this.form.value
    const filled = !!(v.enterprise && v.segment && v.prior && v.current)
    const touched = this.form.dirty
    this.canSubmit.set(valid && filled && touched)
  }

  view(): void {
    if (!this.canSubmit()) return
    const v = this.form.getRawValue()
    const priorStr = v.prior instanceof Date ? v.prior.toISOString().slice(0, 10) : v.prior
    const currentStr = v.current instanceof Date ? v.current.toISOString().slice(0, 10) : v.current
    saveParams({
      enterprise: v.enterprise,
      segment: v.segment,
      prior: v.prior,
      current: v.current,
    })
    this.router.navigate(['/regulatory/lcr/detail'], {
      state: {
        enterprise: v.enterprise ?? null,
        segment: v.segment ?? null,
        prior: priorStr ?? null,
        current: currentStr ?? null,
      },
    })
  }
}
