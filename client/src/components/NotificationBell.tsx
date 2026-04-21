/**
 * NotificationBell — notification indicator + dropdown (§23.3).
 */
import { signal, effect } from '@preact/signals'
import { api } from '@/api'
import type { Notification } from '@/types'

const unreadCount = signal(0)
const notifications = signal<Notification[]>([])
const panelOpen = signal(false)

// Poll unread count every 30s
let pollTimer: ReturnType<typeof setInterval>
export function startNotificationPolling() {
  const poll = async () => {
    try {
      const data = await api.get('/api/notifications/unread-count')
      unreadCount.value = data.unread || 0
    } catch {}
  }
  poll()
  pollTimer = setInterval(poll, 30000)
}

export function stopNotificationPolling() {
  clearInterval(pollTimer)
}

export function NotificationBell() {
  const togglePanel = async () => {
    panelOpen.value = !panelOpen.value
    if (panelOpen.value) {
      try {
        const data = await api.get('/api/notifications?limit=20')
        notifications.value = data
      } catch {}
    }
  }

  const markAllRead = async () => {
    await api.post('/api/notifications/read-all')
    unreadCount.value = 0
    notifications.value = notifications.value.map(n => ({ ...n, read_at: new Date().toISOString() }))
  }

  return (
    <div class="sh-notif-bell">
      <button class="sh-notif-btn" onClick={togglePanel}>
        🔔
        {unreadCount.value > 0 && (
          <span class="sh-notif-badge">{unreadCount.value}</span>
        )}
      </button>
      {panelOpen.value && (
        <div class="sh-notif-panel">
          <div class="sh-notif-header">
            <h4>Notifications</h4>
            {unreadCount.value > 0 && (
              <button class="sh-link" onClick={markAllRead}>Mark all read</button>
            )}
          </div>
          <div class="sh-notif-list">
            {notifications.value.length === 0 && <p class="sh-muted">No notifications</p>}
            {notifications.value.map(n => (
              <div key={n.id} class={`sh-notif-item ${n.read_at ? '' : 'sh-notif--unread'}`}>
                <div class="sh-notif-title">{n.title}</div>
                <time class="sh-notif-time">{new Date(n.created_at).toLocaleString()}</time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
