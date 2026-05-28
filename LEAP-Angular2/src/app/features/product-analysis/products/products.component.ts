import { Component, OnInit, signal } from '@angular/core'
import { Router } from '@angular/router'
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { NzCardModule } from 'ng-zorro-antd/card'
import { NzFormModule } from 'ng-zorro-antd/form'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { EntityTreeSelectComponent } from '../../../shared/entity-tree/entity-tree-select.component'
import {
  defaultEntitiesFor,
  normaliseRegion,
  normaliseStoredSegments,
  regionShowsEntityTree,
  segmentLabelFor,
  segmentOptionsFor,
  segmentsRequiredValidator,
} from '../../../shared/entity-tree/entity-data'

const STORAGE_KEY = 'leap_deposits_query_params'

interface StoredParams {
  region: string | null
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
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      region: p.region ?? null,
      segment: p.segment ?? [],
      prior: p.prior instanceof Date ? p.prior.toISOString().slice(0, 10) : p.prior ?? null,
      current: p.current instanceof Date ? p.current.toISOString().slice(0, 10) : p.current ?? null,
      entities: p.entities ?? [],
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
    EntityTreeSelectComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  form: FormGroup
  canSubmit = signal(false)
  regionOpen = signal(false)
  segmentOpen = signal(false)
  entities = signal<string[]>([])
  segmentOptions = signal<string[]>(segmentOptionsFor(null))
  segmentsSig = signal<string[]>([])
  private restoringEntities = false

  constructor(
    private router: Router,
    private fb: FormBuilder,
  ) {
    const saved = loadParams()
    const region = normaliseRegion(saved.region ?? null)
    const segment = normaliseStoredSegments(region, saved.segment ?? null)
    this.segmentOptions.set(segmentOptionsFor(region))
    this.segmentsSig.set(segment)
    this.form = this.fb.group({
      region: [region, Validators.required],
      segment: [segment, [Validators.required, segmentsRequiredValidator]],
      prior: [saved.prior ? new Date(saved.prior) : null, Validators.required],
      current: [saved.current ? new Date(saved.current) : null, Validators.required],
    })
    if (saved.entities && saved.entities.length) {
      this.restoringEntities = true
      this.entities.set([...saved.entities])
      queueMicrotask(() => { this.restoringEntities = false })
    } else {
      this.entities.set(defaultEntitiesFor(region, segment))
    }
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.updateCanSubmit())
    this.form.statusChanges.subscribe(() => this.updateCanSubmit())
    this.form.get('region')?.valueChanges.subscribe((region: string | null) => this.onRegionChange(region))
    this.form.get('segment')?.valueChanges.subscribe((segment: string[]) => {
      this.segmentsSig.set(segment ?? [])
      this.applyDefaultEntitiesIfClean()
    })
    this.updateCanSubmit()
  }

  selectedSegment(): string | null {
    const seg = this.form.get('segment')?.value as string[] | undefined
    return seg?.[0] ?? null
  }

  segmentOptionLabel(code: string): string {
    return this.form.get('region')?.value === 'US' ? segmentLabelFor(code) : code
  }

  onSegmentChange(value: string | null): void {
    this.form.get('segment')?.setValue(value ? [value] : [])
    this.form.get('segment')?.markAsDirty()
  }

  segmentFieldActive(): boolean {
    const seg = this.form.get('segment')?.value as string[] | undefined
    return !!(seg && seg.length)
  }

  private onRegionChange(region: string | null): void {
    this.segmentOptions.set(segmentOptionsFor(region))
    this.form.get('segment')?.setValue([], { emitEvent: true })
    this.segmentsSig.set([])
    this.applyDefaultEntitiesIfClean()
  }

  private applyDefaultEntitiesIfClean(): void {
    if (this.restoringEntities) return
    const region = this.form.get('region')?.value
    const segment = this.form.get('segment')?.value as string[]
    this.entities.set(defaultEntitiesFor(region, segment))
  }

  onEntitiesChange(next: string[]): void {
    this.entities.set([...next])
  }

  showEntityTree(): boolean {
    return regionShowsEntityTree(this.form.get('region')?.value)
  }

  private updateCanSubmit(): void {
    const v = this.form.value
    const segment = v.segment as string[] | undefined
    const valid = this.form.valid &&
      v.region &&
      Array.isArray(segment) &&
      segment.length > 0 &&
      v.prior &&
      v.current
    const touched = this.form.dirty
    this.canSubmit.set(valid && touched)
  }

  view(): void {
    if (!this.canSubmit()) return
    const v = this.form.getRawValue()
    const priorStr = v.prior instanceof Date ? v.prior.toISOString().slice(0, 10) : v.prior
    const currentStr = v.current instanceof Date ? v.current.toISOString().slice(0, 10) : v.current
    const ents = this.entities()
    const segment = v.segment as string[]
    saveParams({
      region: v.region,
      segment,
      prior: v.prior,
      current: v.current,
      entities: ents,
    })
    this.router.navigate(['/product/deposits'], {
      state: {
        region: v.region ?? null,
        segment,
        prior: priorStr ?? null,
        current: currentStr ?? null,
        entities: ents,
      },
    })
  }
}
