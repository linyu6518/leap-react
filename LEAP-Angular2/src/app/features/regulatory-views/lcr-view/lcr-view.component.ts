import { Component, OnInit, signal, effect } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
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

const STORAGE_KEY = 'leap_lcr_view_params'

interface StoredParams {
  region: string | null
  /** Legacy field, used as fallback when restoring older sessions. */
  enterprise?: string | null
  segment: string | string[] | null
  prior: string | null
  current: string | null
  entities?: string[]
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
  segment?: string[] | null
  prior?: Date | string | null
  current?: Date | string | null
  entities?: string[]
}) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        region: p.region ?? null,
        segment: p.segment ?? [],
        prior: p.prior instanceof Date ? p.prior.toISOString().slice(0, 10) : p.prior ?? null,
        current: p.current instanceof Date ? p.current.toISOString().slice(0, 10) : p.current ?? null,
        entities: p.entities ?? [],
      })
    )
  } catch (_) {}
}

const ROUTE_KEY = 'lcr-view'

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
    SegmentTreePickerComponent,
  ],
  templateUrl: './lcr-view.component.html',
  styleUrls: ['./lcr-view.component.scss'],
})
export class LcrViewComponent implements OnInit {
  form: FormGroup
  canSubmit = signal(false)
  regionOpen = signal(false)
  segmentsSig = signal<string[]>([])

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private scopeSvc: ReportScopeService,
  ) {
    const saved = loadParams()
    const scope = this.scopeSvc.effectiveScope(ROUTE_KEY)
    const restoredRegion = normaliseRegion(saved.region ?? scope.region ?? null)
    const restoredSegment = scope.segments.length ? scope.segments : []
    this.segmentsSig.set(restoredSegment)
    this.form = this.fb.group({
      region: [restoredRegion, Validators.required],
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
    const filled = !!(
      v.region &&
      this.segmentsSig().length > 0 &&
      v.prior &&
      v.current
    )
    const touched = this.form.dirty || this.segmentsSig().length > 0
    this.canSubmit.set(filled && touched)
  }

  view(): void {
    if (!this.canSubmit()) return
    const v = this.form.getRawValue()
    const priorStr = v.prior instanceof Date ? v.prior.toISOString().slice(0, 10) : v.prior
    const currentStr = v.current instanceof Date ? v.current.toISOString().slice(0, 10) : v.current
    const segments = this.segmentsSig()
    saveParams({ region: v.region, prior: v.prior, current: v.current })
    this.scopeSvc.setPageOverride(ROUTE_KEY, v.region, segments)
    this.router.navigate(['/regulatory/lcr/detail'], {
      state: {
        region: v.region ?? null,
        segment: segments,
        prior: priorStr ?? null,
        current: currentStr ?? null,
      },
    })
  }
}
