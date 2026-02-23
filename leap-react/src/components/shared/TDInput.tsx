import React from 'react'
import { Input as AntInput, InputProps as AntInputProps } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import './TDInput.scss'

export interface LeadingTrailingConfig {
  content: React.ReactNode
  type: 'icon' | 'text' | 'tooltip'
}

export interface ClearButtonConfig {
  a11yDesc?: string
  onClick: () => void
}

export interface ErrorConfig {
  a11yDesc?: string
  text: string
}

export interface TDInputProps extends Omit<AntInputProps, 'prefix' | 'suffix'> {
  label?: string
  helperText?: string
  leading?: LeadingTrailingConfig
  trailing?: LeadingTrailingConfig
  clearBtn?: ClearButtonConfig
  error?: ErrorConfig
  wordCount?: {
    current: number
    max: number
  }
}

function TDInput({
  label,
  helperText,
  leading,
  trailing,
  clearBtn,
  error,
  wordCount,
  disabled,
  readOnly,
  value,
  onChange,
  className = '',
  ...restProps
}: TDInputProps) {
  const hasValue = value !== undefined && value !== null && value !== ''

  // Build prefix (leading)
  const prefix = leading ? (
    <span className={`td-input-leading td-input-leading-${leading.type}`}>
      {leading.content}
    </span>
  ) : undefined

  // Build suffix (trailing or clear button)
  const suffix = (() => {
    if (clearBtn && hasValue && !disabled && !readOnly) {
      return (
        <span
          className="td-input-clear-btn"
          onClick={(e) => {
            e.stopPropagation()
            clearBtn.onClick()
          }}
          role="button"
          tabIndex={0}
          aria-label={clearBtn.a11yDesc || 'Clear input'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              clearBtn.onClick()
            }
          }}
        >
          <CloseOutlined />
        </span>
      )
    }
    if (trailing) {
      return (
        <span className={`td-input-trailing td-input-trailing-${trailing.type}`}>
          {trailing.content}
        </span>
      )
    }
    return undefined
  })()

  const inputId = restProps.id || `td-input-${Math.random().toString(36).substr(2, 9)}`
  const helperTextId = helperText ? `${inputId}-helper` : undefined
  const errorTextId = error ? `${inputId}-error` : undefined

  const placeholder = restProps.placeholder || ''
  const showFloatingLabel = placeholder && (!label)
  const [focused, setFocused] = React.useState(false)

  return (
    <div className={`td-input-wrapper ${error ? 'td-input-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="td-input-label">
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <AntInput
          {...restProps}
          id={inputId}
          prefix={prefix}
          suffix={suffix}
          disabled={disabled}
          readOnly={readOnly}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setFocused(true)
            restProps.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            restProps.onBlur?.(e)
          }}
          status={error ? 'error' : undefined}
          aria-describedby={[helperTextId, errorTextId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          placeholder={showFloatingLabel ? '' : placeholder}
        />
        {showFloatingLabel && (
          <span 
            className={`td-input-floating-label ${(hasValue || focused) ? 'td-input-floating-label-active' : ''}`}
          >
            {placeholder}
          </span>
        )}
      </div>
      {error && (
        <div id={errorTextId} className="td-input-error-text" role="alert">
          <span className="td-input-error-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
              <path d="M7 3.5V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="7" cy="10" r="0.5" fill="currentColor"/>
            </svg>
          </span>
          <span className="td-input-error-message">{error.text}</span>
          {error.a11yDesc && <span className="sr-only">{error.a11yDesc}</span>}
        </div>
      )}
      {!error && helperText && (
        <div id={helperTextId} className="td-input-helper-text">
          {helperText}
        </div>
      )}
      {wordCount && (
        <div className="td-input-word-count">
          {wordCount.current} / {wordCount.max}
        </div>
      )}
    </div>
  )
}

export default TDInput
