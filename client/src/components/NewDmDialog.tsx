/**
 * NewDmDialog — start a new DM conversation (§23.47b).
 */
import { signal } from '@preact/signals'
import { api } from '@/api'
import { Modal } from './Modal'
import { Button } from './Button'
import { showToast } from './Toast'
import type { User } from '@/types'

const open = signal(false)
const users = signal<User[]>([])
const selected = signal('')
const loading = signal(false)

export function openNewDm() {
  open.value = true
  selected.value = ''
  // Load user list
  api.get('/api/users').then(data => { users.value = data })
}

export function NewDmDialog({ onCreated }: { onCreated?: (convId: string) => void }) {
  const handleCreate = async () => {
    if (!selected.value || loading.value) return
    loading.value = true
    try {
      const conv = await api.post('/api/conversations/dm', { username: selected.value })
      showToast('Conversation started', 'success')
      open.value = false
      onCreated?.(conv.id)
    } catch (e: any) {
      showToast(e.message || 'Failed to start conversation', 'error')
    } finally {
      loading.value = false
    }
  }

  return (
    <Modal open={open.value} onClose={() => open.value = false} title="New Message">
      <div class="sh-form">
        <label>
          To:
          <select value={selected.value}
            onChange={(e) => selected.value = (e.target as HTMLSelectElement).value}>
            <option value="">Select a user...</option>
            {users.value.map(u => (
              <option key={u.username} value={u.username}>
                {u.display_name} (@{u.username})
              </option>
            ))}
          </select>
        </label>
        <div class="sh-form-actions">
          <Button variant="secondary" onClick={() => open.value = false}>Cancel</Button>
          <Button onClick={handleCreate} loading={loading.value}
            disabled={!selected.value}>
            Start
          </Button>
        </div>
      </div>
    </Modal>
  )
}
