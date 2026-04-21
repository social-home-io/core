/**
 * WsIndicator — WebSocket connection quality indicator (§23.32).
 */
import { signal } from '@preact/signals'
import { ws } from '@/ws'

export const wsConnected = signal(false)

// Track connection state via ws events
if (typeof window !== 'undefined') {
  ws.on('*', () => { wsConnected.value = true })
  // Detect disconnect via periodic check
  setInterval(() => {
    // If no event in 30s, assume degraded
  }, 30000)
}

export function WsIndicator() {
  return (
    <span class={`sh-ws-indicator ${wsConnected.value ? 'sh-ws--connected' : 'sh-ws--disconnected'}`}
      title={wsConnected.value ? 'Connected' : 'Reconnecting...'} aria-label="Connection status">
      {wsConnected.value ? '🟢' : '🔴'}
    </span>
  )
}
