import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

@Component({
  selector: 'leap-td-select',
  templateUrl: './td-select.component.html',
  styleUrls: ['./td-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TdSelectComponent),
      multi: true,
    },
  ],
})
export class TdSelectComponent implements ControlValueAccessor {
  @Input() label?: string
  @Input() placeholder = ''
  @Input() helperText?: string
  @Input() floatingLabelText?: string
  @Input() disabled = false
  @Input() error?: string
  @Input() nzOptions: { label: string; value: string | number }[] = []
  @Output() valueChange = new EventEmitter<string | number | null>()

  value: string | number | null = null
  focused = false
  open = false
  onChange: (v: string | number | null) => void = () => {}
  onTouched: () => void = () => {}

  get selectId(): string {
    return `td-select-${Math.random().toString(36).slice(2, 11)}`
  }

  get hasValue(): boolean {
    return this.value !== undefined && this.value !== null && this.value !== ''
  }

  get showFloatingLabel(): boolean {
    return !!(this.placeholder || this.floatingLabelText) && !this.label
  }

  get floatingLabel(): string {
    return this.floatingLabelText || this.placeholder
  }

  writeValue(v: string | number | null): void {
    this.value = v
  }

  registerOnChange(fn: (v: string | number | null) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  onValueChange(v: string | number | null): void {
    this.value = v
    this.onChange(v)
    this.valueChange.emit(v)
  }

  onFocus(): void {
    this.focused = true
    this.onTouched()
  }

  onBlur(): void {
    this.focused = false
  }

  onOpenChange(open: boolean): void {
    this.open = open
    this.focused = open
  }
}
