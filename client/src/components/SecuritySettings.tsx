/**
 * SecuritySettings — session + token management (§23.127).
 */
import { useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'
import { api } from '@/api'
import { Button } from './Button'
import { showToast } from './Toast'
import { ConfirmDialog } from './ConfirmDialog'

interface Token { token_id: string; label: string; created_at: string; last_used_at?: string }

const tokens = signal<Token[]>([])
const revokeTarget = signal<string | null>(null)
const newLabel = signal('')

export function SecuritySettings() {
  useEffect(() => {
    api.get('/api/me/tokens').then(data => { tokens.value = data }).catch(() => {})
  }, [])

  const createToken = async () => {
    if (!newLabel.value.trim()) return
    try {
      const result = await api.post('/api/me/tokens', { label: newLabel.value })
      showToast(`Token created: ${result.token}`, 'success')
      newLabel.value = ''
      tokens.value = await api.get('/api/me/tokens')
    } catch (e: any) { showToast(e.message || 'Failed', 'error') }
  }

  const revokeToken = async (id: string) => {
    await api.delete(`/api/me/tokens/${id}`)
    tokens.value = tokens.value.filter(t => t.token_id !== id)
    showToast('Token revoked', 'info')
    revokeTarget.value = null
  }

  return (
    <div class="sh-security">
      <h3>API Tokens</h3>
      <div class="sh-token-create">
        <input value={newLabel.value} placeholder="Token label (e.g. laptop)"
          onInput={(e) => newLabel.value = (e.target as HTMLInputElement).value} />
        <Button onClick={createToken} disabled={!newLabel.value.trim()}>Create</Button>
      </div>
      {tokens.value.map(t => (
        <div key={t.token_id} class="sh-token-row">
          <span class="sh-token-label">{t.label}</span>
          <time class="sh-muted">{new Date(t.created_at).toLocaleDateString()}</time>
          {t.last_used_at && <span class="sh-muted">Used {new Date(t.last_used_at).toLocaleDateString()}</span>}
          <Button variant="danger" onClick={() => revokeTarget.value = t.token_id}>Revoke</Button>
        </div>
      ))}
      <ConfirmDialog open={revokeTarget.value !== null} title="Revoke token?"
        message="This token will immediately stop working. Any device using it will need to re-authenticate."
        confirmLabel="Revoke" destructive
        onConfirm={() => revokeTarget.value && revokeToken(revokeTarget.value)}
        onCancel={() => revokeTarget.value = null} />
    </div>
  )
}
