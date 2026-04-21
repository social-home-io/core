/**
 * AuctionCountdown — live countdown for bazaar auctions (§23.15).
 */
import { useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'

export function AuctionCountdown({ endTime }: { endTime: string }) {
  const remaining = signal('')
  const expired = signal(false)

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now()
      if (diff <= 0) { expired.value = true; remaining.value = 'Ended'; return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 24) {
        const d = Math.floor(h / 24)
        remaining.value = `${d}d ${h % 24}h`
      } else if (h > 0) {
        remaining.value = `${h}h ${m}m`
      } else {
        remaining.value = `${m}m ${s}s`
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  return (
    <span class={`sh-countdown ${expired.value ? 'sh-countdown--ended' : ''}`}
      aria-label={`Time remaining: ${remaining.value}`}>
      ⏱ {remaining.value}
    </span>
  )
}
