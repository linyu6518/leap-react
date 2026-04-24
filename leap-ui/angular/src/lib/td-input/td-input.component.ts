import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

@Component({
  selector: 'leap-td-input',
  templateUrl: './td-input.component.html',
  styleUrls: ['./td-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TdInputComponent),
      multi: true,
    },
  ],
})
export class TdInputComponent implements ControlValueAccessor {
  @Input() label?: string
  @Input() placeholder = ''
  @Input() helperText?: string
  @Input() disabled = false
  @Input() error?: string
  @Input() nzSize: 'large' | 'small' | 'default' = 'default'
  @Output() valueChange = new EventEmitter<string>()

  value = ''
  focused = false
  onChange: (v: string) => void = () => {}
  onTouched: () => void = () => {}

  get inputId(): string {
    return `td-input-${Math.random().toString(36).slice(2, 11)}`
  }

  get hasValue(): boolean {
    return this.value !== undefined && this.value !== null && this.value !== ''
  }

  get showFloatingLabel(): boolean {
    return !!this.placeholder && !this.label
  }

  writeValue(v: string): void {
    this.value = v ?? ''
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  onInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value
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
}
