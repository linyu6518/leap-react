import { useEffect, useState, useRef } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
}

function AnimatedNumber({ value, duration = 1000, decimals = 0 }: AnimatedNumberProps) {
  // Always start from 0 for animation effect
  const [displayValue, setDisplayValue] = useState(0)
  const previousValue = useRef<number | null>(null)
  const animationFrameId = useRef<number | null>(null)
  const displayValueRef = useRef(0)

  // Keep ref in sync with state
  useEffect(() => {
    displayValueRef.current = displayValue
  }, [displayValue])

  useEffect(() => {
    // Check if value is valid
    if (value == null || isNaN(value)) {
      return
    }

    const endValue = value

    // If value hasn't changed, don't animate
    if (previousValue.current === endValue) {
      return
    }

    // Cancel any ongoing animation first
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current)
      animationFrameId.current = null
    }

    // Always animate from current display value (or 0 if first time) to target value
    const startValue = displayValueRef.current

    // Calculate dynamic duration based on value size for smoother animation
    // Larger values get slightly longer duration, but cap it for very large numbers
    const valueRange = Math.abs(endValue - startValue)
    const dynamicDuration = valueRange > 1000 
      ? Math.min(duration * 1.2, 2000) // Max 2 seconds for very large numbers
      : duration

    // Animate from startValue to endValue
    let startTime: number | null = null

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime
      }

      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / dynamicDuration, 1)

      // Use easeOutCubic for smooth, natural rolling animation
      // This provides a good balance between smoothness and speed
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (endValue - startValue) * easeOutCubic

      setDisplayValue(currentValue)
      displayValueRef.current = currentValue

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        displayValueRef.current = endValue
        previousValue.current = endValue
        animationFrameId.current = null
      }
    }

    animationFrameId.current = requestAnimationFrame(animate)

    // Cleanup function to cancel animation if component unmounts or value changes
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current)
        animationFrameId.current = null
      }
    }
  }, [value, duration])

  return <>{displayValue.toFixed(decimals)}</>
}

export default AnimatedNumber
