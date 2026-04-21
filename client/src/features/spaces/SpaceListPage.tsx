import { useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'
import { api } from '@/api'
import type { Space } from '@/types'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/Button'
import { openSpaceCreate } from '@/components/SpaceCreateDialog'
import { RemoteInviteInboxBanner } from '@/components/RemoteInviteInboxBanner'

const spaces = signal<Space[]>([])
const loading = signal(true)

export default function SpaceListPage() {
  useEffect(() => {
    api.get('/api/spaces').then(data => { spaces.value = data; loading.value = false }).catch(() => { loading.value = false })
  }, [])

  if (loading.value) return <Spinner />

  return (
    <div class="sh-spaces">
      <div class="sh-page-header">
        <h1>Spaces</h1>
        <div class="sh-page-header__actions">
          <Button variant="secondary" onClick={() => { window.location.href = '/spaces/browse' }}>
            🔭 Browse spaces
          </Button>
          <Button onClick={openSpaceCreate}>+ Create space</Button>
        </div>
      </div>
      <RemoteInviteInboxBanner />
      {spaces.value.length === 0 && (
        <div class="sh-empty-state">
          <p>No spaces yet.</p>
          <p class="sh-muted">Create a space to start sharing with friends and family.</p>
        </div>
      )}
      {spaces.value.map(s => (
        <a key={s.id} href={`/spaces/${s.id}`} class="sh-space-card">
          <span class="sh-space-emoji">{s.emoji || '🏠'}</span>
          <div>
            <strong>{s.name}</strong>
            {s.description && <p class="sh-muted">{s.description}</p>}
            <span class="sh-badge">{s.space_type}</span>
          </div>
        </a>
      ))}
    </div>
  )
}
