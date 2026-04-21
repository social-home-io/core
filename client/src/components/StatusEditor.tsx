/**
 * StatusEditor — user status emoji + text (§23.8).
 */
import { signal } from '@preact/signals'
import { api } from '@/api'
import { Button } from './Button'
import { showToast } from './Toast'

const emoji = signal('')
const text = signal('')

export function StatusEditor({ onSave }: { onSave?: () => void }) {
  const save = async () => {
    await api.patch('/api/me', { status_emoji: emoji.value || null, status_text: text.value || null })
    showToast('Status updated', 'success')
    onSave?.()
  }
  const clear = async () => {
    emoji.value = ''; text.value = ''
    await api.patch('/api/me', { status_emoji: null, status_text: null })
    showToast('Status cleared', 'info')
    onSave?.()
  }
  return (
    <div class="sh-status-editor">
      <div class="sh-status-row">
        <input class="sh-status-emoji" value={emoji.value} placeholder="😊" maxLength={2}
          onInput={(e) => emoji.value = (e.target as HTMLInputElement).value} />
        <input class="sh-status-text" value={text.value} placeholder="What's your status?"
          maxLength={80} onInput={(e) => text.value = (e.target as HTMLInputElement).value} />
      </div>
      <div class="sh-status-actions">
        <Button variant="secondary" onClick={clear}>Clear</Button>
        <Button onClick={save}>Set status</Button>
      </div>
    </div>
  )
}
