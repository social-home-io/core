/**
 * TypingIndicator — show who is typing (§23.9).
 * Subscribes to WS 'typing' events and shows animated dots.
 */
import { signal } from '@preact/signals'
import { ws } from '@/ws'

const typingUsers = signal<Map<string, number>>(new Map())

// Auto-clear after 3s of no typing event
if (typeof window !== 'undefined') {
  ws.on('typing', (evt) => {
    const userId = evt.data.user_id as string
    const map = new Map(typingUsers.value)
    map.set(userId, Date.now())
    typingUsers.value = map
  })
  setInterval(() => {
    const now = Date.now()
    const map = new Map(typingUsers.value)
    let changed = false
    for (const [uid, ts] of map) {
      if (now - ts > 3000) { map.delete(uid); changed = true }
    }
    if (changed) typingUsers.value = map
  }, 1000)
}

export function sendTyping(conversationId: string) {
  ws.send('typing', { conversation_id: conversationId })
}

export function TypingIndicator({ scope: _scope }: { scope?: string }) {
  const users = Array.from(typingUsers.value.keys())
  if (users.length === 0) return null
  const label = users.length === 1 ? `${users[0]} is typing` :
    users.length === 2 ? `${users[0]} and ${users[1]} are typing` :
    `${users.length} people are typing`
  return <div class="sh-typing" aria-live="polite"><span class="sh-typing-dots">•••</span> {label}</div>
}
