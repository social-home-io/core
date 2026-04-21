/**
 * OfflineIndicator — show when browser is offline (§23.21).
 */
import { signal } from '@preact/signals'

export const isOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true)

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })
}

export function OfflineIndicator() {
  if (isOnline.value) return null
  return (
    <div class="sh-offline-banner" role="alert">
      📡 You're offline — changes will sync when you reconnect.
    </div>
  )
}
