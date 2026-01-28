import React from 'react'

interface LiquidityIconProps {
  className?: string
  style?: React.CSSProperties
}

function LiquidityIcon({ className, style }: LiquidityIconProps) {
  return (
    <svg
      className={className}
      style={style}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Analytics Platform - Chart with trend line and data points */}
      {/* Base axis line */}
      <line
        x1="4"
        y1="18"
        x2="20"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Rising trend line */}
      <path
        d="M5 15 L9 12 L13 9 L17 6 L20 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Data points */}
      <circle cx="5" cy="15" r="1.5" fill="currentColor" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <circle cx="13" cy="9" r="1.5" fill="currentColor" />
      <circle cx="17" cy="6" r="1.5" fill="currentColor" />
      <circle cx="20" cy="4" r="1.5" fill="currentColor" />
    </svg>
  )
}

export default LiquidityIcon
