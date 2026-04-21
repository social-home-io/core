/**
 * SwipeHandler — swipe gesture support (§23.38).
 * Wrap list items to enable swipe-left (delete) and swipe-right (archive).
 */
import { useRef } from 'preact/hooks'
import type { ComponentChildren } from 'preact'

interface SwipeProps {
  children: ComponentChildren
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function SwipeHandler({ children, onSwipeLeft, onSwipeRight, threshold = 80 }: SwipeProps) {
  const startX = useRef(0)
  const deltaX = useRef(0)

  return (
    <div class="sh-swipeable"
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; deltaX.current = 0 }}
      onTouchMove={(e) => { deltaX.current = e.touches[0].clientX - startX.current }}
      onTouchEnd={() => {
        if (deltaX.current < -threshold && onSwipeLeft) onSwipeLeft()
        if (deltaX.current > threshold && onSwipeRight) onSwipeRight()
        startX.current = 0; deltaX.current = 0
      }}>
      {children}
    </div>
  )
}
