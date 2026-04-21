/**
 * PullToRefresh — touch gesture handler (§23.29).
 */
import { useRef } from 'preact/hooks'
import { signal } from '@preact/signals'
import type { ComponentChildren } from 'preact'

const pulling = signal(false)
const refreshing = signal(false)

export function PullToRefresh({ onRefresh, children }: {
  onRefresh: () => Promise<void>; children: ComponentChildren
}) {
  const startY = useRef(0)
  const pullDist = useRef(0)

  const onTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY
  }
  const onTouchMove = (e: TouchEvent) => {
    if (startY.current === 0) return
    pullDist.current = e.touches[0].clientY - startY.current
    if (pullDist.current > 60) pulling.value = true
  }
  const onTouchEnd = async () => {
    if (pulling.value && pullDist.current > 80) {
      refreshing.value = true
      await onRefresh()
      refreshing.value = false
    }
    pulling.value = false
    startY.current = 0
    pullDist.current = 0
  }

  return (
    <div class="sh-ptr" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {(pulling.value || refreshing.value) && (
        <div class="sh-ptr-indicator">{refreshing.value ? '🔄 Refreshing...' : '↓ Pull to refresh'}</div>
      )}
      {children}
    </div>
  )
}
