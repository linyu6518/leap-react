import { useEffect, useState, useRef } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
}

function AnimatedNumber({ value, duration = 1000, decimals = 0 }: AnimatedNumberProps) {
  // Initialize with value if it's valid, otherwise 0
  // This prevents showing 0 and then animating to the target value
  const [displayValue, setDisplayValue] = useState(() => {
    return (value != null && !isNaN(value) && value >= 0) ? value : 0
  })
  const previousValue = useRef<number | null>((value != null && !isNaN(value) && value >= 0) ? value : null)
  const animationFrameId = useRef<number | null>(null)
  const displayValueRef = useRef((value != null && !isNaN(value) && value >= 0) ? value : 0)
  const isInitialMount = useRef(true)

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

    const startValue = displayValueRef.current

    // If this is initial mount, or value changes from 0/null to a valid value,
    // or the change is very large (likely initial load), set directly without animation
    // This prevents showing intermediate values (like 251) during initial load
    if (
      isInitialMount.current ||
      previousValue.current == null ||
      previousValue.current === 0 ||
      startValue === 0 ||
      Math.abs(endValue - startValue) > Math.max(endValue * 0.5, 100) // Large change threshold
    ) {
      setDisplayValue(endValue)
      previousValue.current = endValue
      displayValueRef.current = endValue
      isInitialMount.current = false
      return
    }

    // Animate only when value changes from one valid value to another
    let startTime: number | null = null

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime
      }

      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (endValue - startValue) * easeOutQuart

      setDisplayValue(currentValue)
      displayValueRef.current = currentValue

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        displayValueRef.current = endValue
        previousValue.current = endValue
        animationFrameId.current = null
        isInitialMount.current = false
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
