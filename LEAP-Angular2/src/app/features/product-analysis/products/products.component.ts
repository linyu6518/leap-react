import { Component, OnInit, signal, effect } from '@angular/core'
import { Router } from '@angular/router'
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzFormModule } from 'ng-zorro-antd/form'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { SegmentTreePickerComponent } from '../../../shared/entity-tree/segment-tree-picker.component'
import { ReportScopeService } from '../../../core/services/report-scope.service'
import { normaliseRegion } from '../../../shared/entity-tree/entity-data'

const ROUTE_KEY = 'products'
const STORAGE_KEY = 'leap_deposits_query_params'

interface StoredParams {
  region: string | null
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
  region?: string | null
  prior?: Date | string | null
  current?: Date | string | null
}) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      region: p.region ?? null,
      prior: p.prior instanceof Date ? p.prior.toISOString().slice(0, 10) : p.prior ?? null,
      current: p.current instanceof Date ? p.current.toISOString().slice(0, 10) : p.current ?? null,
    }))
  } catch (_) {}
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    SegmentTreePickerComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  form: FormGroup
  canSubmit = signal(false)
  regionOpen = signal(false)
  segmentsSig = signal<string[]>([])

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private scopeSvc: ReportScopeService,
  ) {
    const scope = this.scopeSvc.effectiveScope(ROUTE_KEY)
    const saved = loadParams()
    const region = normaliseRegion(scope.region ?? saved.region ?? null)
    const segments = scope.segments.length ? scope.segments : []
    this.segmentsSig.set(segments)
    this.form = this.fb.group({
      region: [region, Validators.required],
      prior: [saved.prior ? new Date(saved.prior) : null, Validators.required],
      current: [saved.current ? new Date(saved.current) : null, Validators.required],
    })

    effect(() => {
      const scope = this.scopeSvc.globalScope()
      if (!this.scopeSvc.isPageOverridden(ROUTE_KEY)) {
        const r = normaliseRegion(scope.region ?? null)
        this.form.patchValue({ region: r }, { emitEvent: false })
        this.segmentsSig.set(scope.segments)
        this.updateCanSubmit()
      }
    })
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.updateCanSubmit())
    this.form.statusChanges.subscribe(() => this.updateCanSubmit())
    this.form.get('region')?.valueChanges.subscribe((region: string | null) => {
      this.segmentsSig.set([])
      this.scopeSvc.setPageOverride(ROUTE_KEY, region, [])
    })
    this.updateCanSubmit()
  }

  onSegmentsChange(codes: string[]): void {
    this.segmentsSig.set(codes)
    this.updateCanSubmit()
    this.scopeSvc.setPageOverride(ROUTE_KEY, this.form.get('region')?.value, codes)
  }

  private updateCanSubmit(): void {
    const v = this.form.value
    const valid = this.form.valid &&
      v.region &&
      this.segmentsSig().length > 0 &&
      v.prior &&
      v.current
    const touched = this.form.dirty || this.segmentsSig().length > 0
    this.canSubmit.set(!!(valid && touched))
  }

  view(): void {
    if (!this.canSubmit()) return
    const v = this.form.getRawValue()
    const priorStr = v.prior instanceof Date ? v.prior.toISOString().slice(0, 10) : v.prior
    const currentStr = v.current instanceof Date ? v.current.toISOString().slice(0, 10) : v.current
    const segments = this.segmentsSig()
    saveParams({ region: v.region, prior: v.prior, current: v.current })
    this.scopeSvc.setPageOverride(ROUTE_KEY, v.region, segments)
    this.router.navigate(['/product/deposits'], {
      state: {
        region: v.region ?? null,
        segment: segments,
        prior: priorStr ?? null,
        current: currentStr ?? null,
      },
    })
  }
}
