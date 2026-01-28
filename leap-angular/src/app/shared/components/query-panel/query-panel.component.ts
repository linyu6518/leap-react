import { Component, EventEmitter, Output, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface QueryParams {
  region: string | null;
  segment: string | null;
  prior: Date | null;
  current: Date | null;
}

@Component({
  selector: 'app-query-panel',
  templateUrl: './query-panel.component.html',
  styleUrls: ['./query-panel.component.scss']
})
export class QueryPanelComponent implements OnInit, OnChanges {
  @Input() initialValues?: Partial<QueryParams>;
  @Output() query = new EventEmitter<QueryParams>();
  @Output() reset = new EventEmitter<void>();

  queryForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValues'] && this.queryForm) {
      this.queryForm.patchValue({
        region: this.initialValues?.region || '',
        segment: this.initialValues?.segment || '',
        prior: this.initialValues?.prior || '',
        current: this.initialValues?.current || ''
      });
    }
  }

  private initForm(): void {
    this.queryForm = this.fb.group({
      region: [this.initialValues?.region || '', Validators.required],
      segment: [this.initialValues?.segment || '', Validators.required],
      prior: [this.initialValues?.prior || '', Validators.required],
      current: [this.initialValues?.current || '', Validators.required]
    });
  }

  onQuery(): void {
    if (this.queryForm.valid) {
      const params: QueryParams = this.queryForm.value;
      this.query.emit(params);
    }
  }

  onReset(): void {
    this.queryForm.reset({
      region: '',
      segment: '',
      prior: '',
      current: ''
    });
    this.reset.emit();
  }
}
