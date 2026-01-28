import { useState } from 'react'
import { Select as AntSelect, SelectProps as AntSelectProps } from 'antd'
import './TDSelect.scss'

const { Option } = AntSelect

export interface TDSelectProps extends Omit<AntSelectProps, 'placeholder'> {
  label?: string
  helperText?: string
  placeholder?: string
  floatingLabelText?: string // Text for floating label (different from placeholder)
  error?: {
    text: string
  }
}

function TDSelect({
  label,
  helperText,
  placeholder = '',
  floatingLabelText,
  error,
  value,
  onChange,
  className = '',
  disabled,
  ...restProps
}: TDSelectProps) {
  const hasValue = value !== undefined && value !== null && value !== ''
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)

  const selectId = restProps.id || `td-select-${Math.random().toString(36).substr(2, 9)}`
  const helperTextId = helperText ? `${selectId}-helper` : undefined
  const errorTextId = error ? `${selectId}-error` : undefined

  const showFloatingLabel = (placeholder || floatingLabelText) && !label
  const floatingLabel = floatingLabelText || placeholder
  // When floating label is active (focused/open) and no value, show placeholder in input
  const showPlaceholderInInput = showFloatingLabel && placeholder && (focused || open) && !hasValue

  return (
    <div className={`td-select-wrapper ${error ? 'td-select-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="td-select-label">
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <AntSelect
          {...restProps}
          value={value}
          onChange={onChange}
          disabled={disabled}
          status={error ? 'error' : undefined}
          aria-describedby={[helperTextId, errorTextId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          placeholder={showPlaceholderInInput ? placeholder : (showFloatingLabel ? '' : placeholder)}
          className="td-select"
          open={open}
          onDropdownVisibleChange={(visible) => {
            setOpen(visible)
            setFocused(visible)
            restProps.onDropdownVisibleChange?.(visible)
          }}
          onBlur={(e) => {
            setFocused(false)
            restProps.onBlur?.(e)
          }}
          onFocus={(e) => {
            setFocused(true)
            restProps.onFocus?.(e)
          }}
        />
        {showFloatingLabel && (
          <span
            className={`td-select-floating-label ${hasValue || focused || open ? 'td-select-floating-label-active' : ''}`}
          >
            {floatingLabel}
          </span>
        )}
      </div>
      {error && (
        <div id={errorTextId} className="td-select-error-text" role="alert">
          <span className="td-select-error-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
              <path d="M7 3.5V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="7" cy="10" r="0.5" fill="currentColor" />
            </svg>
          </span>
          <span className="td-select-error-message">{error.text}</span>
        </div>
      )}
      {!error && helperText && (
        <div id={helperTextId} className="td-select-helper-text">
          {helperText}
        </div>
      )}
    </div>
  )
}

export default TDSelect
export { Option }
