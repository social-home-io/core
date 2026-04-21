/**
 * MentionAutocomplete — @mention dropdown in composer/DMs (§23.22).
 */
import { signal } from '@preact/signals'
import { api } from '@/api'
import type { User } from '@/types'
import { Avatar } from './Avatar'

const query = signal('')
const matches = signal<User[]>([])
const visible = signal(false)
const position = signal({ top: 0, left: 0 })

export function checkForMention(text: string, cursorPos: number, inputEl: HTMLElement) {
  const before = text.slice(0, cursorPos)
  const match = before.match(/@(\w{1,30})$/)
  if (match) {
    query.value = match[1]
    visible.value = true
    const rect = inputEl.getBoundingClientRect()
    position.value = { top: rect.bottom, left: rect.left }
    api.get('/api/users').then(users => {
      matches.value = users.filter((u: User) =>
        u.display_name.toLowerCase().includes(query.value.toLowerCase()) ||
        u.username.toLowerCase().includes(query.value.toLowerCase())
      ).slice(0, 5)
    })
  } else {
    visible.value = false
  }
}

export function MentionAutocomplete({ onSelect }: { onSelect: (username: string) => void }) {
  if (!visible.value || matches.value.length === 0) return null
  return (
    <div class="sh-mention-dropdown" style={{ top: position.value.top, left: position.value.left }}>
      {matches.value.map(u => (
        <button key={u.username} class="sh-mention-option"
          onMouseDown={(e) => { e.preventDefault(); onSelect(u.username); visible.value = false }}>
          <Avatar name={u.display_name} src={u.picture_url} size={24} />
          <span>{u.display_name}</span>
          <span class="sh-muted">@{u.username}</span>
        </button>
      ))}
    </div>
  )
}
