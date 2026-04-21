/**
 * SpaceBrowserPage — browse + join spaces across three scopes.
 *
 *   1. Your household     — local spaces (HOUSEHOLD + PUBLIC types).
 *   2. From friends       — type=public spaces published by paired
 *                           peers (§D1a SPACE_DIRECTORY_SYNC).
 *   3. Global directory   — type=global spaces on the GFS.
 *
 * Primary UX: click a SpaceCard's action button. Local "open" joins
 * instantly; "request" pops a JoinRequestModal; remote spaces route
 * the request through federation (§D2); unpaired hosts deep-link to
 * the pairing flow.
 */
import { useEffect, useState } from 'preact/hooks'
import { signal } from '@preact/signals'
import { api } from '@/api'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'
import { showToast } from '@/components/Toast'
import { openPairing } from '@/components/PairingFlow'
import { currentUser } from '@/store/auth'
import type { DirectoryEntry, Space } from '@/types'
import { SpaceCard } from './SpaceCard'
import { JoinRequestModal } from './JoinRequestModal'

type Tab = 'household' | 'friends' | 'global'

const household = signal<DirectoryEntry[]>([])
const friends = signal<DirectoryEntry[]>([])
const global_ = signal<DirectoryEntry[]>([])
const loading = signal(true)
const activeTab = signal<Tab>('household')
const searchTerm = signal('')

async function loadAll() {
  loading.value = true
  try {
    const [rawLocal, rawFriends, rawGlobal, rawMine] = await Promise.all([
      api.get('/api/spaces').catch(() => [] as Space[]),
      api.get('/api/peer_spaces').catch(() => [] as DirectoryEntry[]),
      api.get('/api/public_spaces').catch(() => [] as DirectoryEntry[]),
      api.get('/api/spaces').catch(() => [] as Space[]),
    ])
    const myIds = new Set((rawMine as Space[]).map((s) => s.id))
    household.value = (rawLocal as Space[])
      .filter((s) => s.space_type === 'household' || s.space_type === 'public')
      .map((s) => ({
        space_id:          s.id,
        host_instance_id:  'local',
        host_display_name: 'Your household',
        host_is_paired:    true,
        name:              s.name,
        description:       s.description,
        emoji:             s.emoji,
        member_count:      0,
        scope:             s.space_type as 'household' | 'public',
        join_mode:         s.join_mode,
        min_age:           0,
        target_audience:   'all',
        already_member:    myIds.has(s.id),
      }))
    friends.value = (rawFriends as DirectoryEntry[]).map((e) => ({
      ...e, scope: 'public' as const,
    }))
    global_.value = (rawGlobal as DirectoryEntry[]).map((e) => ({
      ...e, scope: 'global' as const,
      // /api/public_spaces doesn't carry join_mode — default to request.
      join_mode: e.join_mode || 'request',
    }))
  } finally {
    loading.value = false
  }
}

function filterBy(entries: DirectoryEntry[], term: string): DirectoryEntry[] {
  if (!term) return entries
  const t = term.toLowerCase()
  return entries.filter((e) =>
    e.name.toLowerCase().includes(t)
    || (e.description || '').toLowerCase().includes(t),
  )
}

export default function SpaceBrowserPage() {
  const [activeModal, setActiveModal] = useState<DirectoryEntry | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  const onAction = async (entry: DirectoryEntry, action: { kind: string }) => {
    if (action.kind === 'open') {
      window.location.href = `/spaces/${entry.space_id}`
      return
    }
    if (action.kind === 'pair-first') {
      // Open the pairing flow pre-targeted at this household.
      openPairing('household')
      return
    }
    if (action.kind === 'join') {
      if (entry.scope === 'household' || entry.host_instance_id === 'local') {
        try {
          // Local open-to-join: use the join-request endpoint; the
          // server auto-approves for JoinMode.OPEN via existing flow.
          await api.post(
            `/api/spaces/${entry.space_id}/join-requests`, {},
          )
          showToast(`Joined ${entry.name}`, 'success')
          await loadAll()
        } catch (exc) {
          showToast((exc as Error).message, 'error')
        }
      } else {
        try {
          await api.post(
            `/api/public_spaces/${entry.space_id}/join-request`,
            { host_instance_id: entry.host_instance_id },
          )
          showToast(
            `Request sent to ${entry.host_display_name}`, 'success',
          )
          entry.request_pending = true
          // Trigger reactivity.
          global_.value = [...global_.value]
          friends.value = [...friends.value]
        } catch (exc) {
          showToast((exc as Error).message, 'error')
        }
      }
      return
    }
    if (action.kind === 'request') {
      setActiveModal(entry)
    }
  }

  const onSubmitJoinRequest = async (message: string) => {
    if (!activeModal) return
    const e = activeModal
    if (e.scope === 'household' || e.host_instance_id === 'local') {
      await api.post(
        `/api/spaces/${e.space_id}/join-requests`, { message },
      )
      showToast(`Request sent for ${e.name}`, 'success')
    } else {
      await api.post(
        `/api/public_spaces/${e.space_id}/join-request`,
        { host_instance_id: e.host_instance_id, message },
      )
      showToast(`Request sent to ${e.host_display_name}`, 'success')
    }
    e.request_pending = true
    global_.value = [...global_.value]
    friends.value = [...friends.value]
    household.value = [...household.value]
  }

  const onRefreshGfs = async () => {
    setRefreshing(true)
    try {
      await api.post('/api/public_spaces/refresh', {})
      showToast('Directory refresh requested', 'info')
      // Wait a short beat before reloading so the refreshed poll lands.
      setTimeout(() => { void loadAll() }, 2000)
    } catch (exc) {
      showToast((exc as Error).message, 'error')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading.value) return <Spinner />

  const term = searchTerm.value
  const lists: Record<Tab, DirectoryEntry[]> = {
    household: filterBy(household.value, term),
    friends:   filterBy(friends.value,  term),
    global:    filterBy(global_.value,  term),
  }
  const me = currentUser.value
  const canRefresh = me?.is_admin === true
  const hasFriends = friends.value.length > 0

  return (
    <div class="sh-space-browser">
      <div class="sh-page-header">
        <h1>Browse spaces</h1>
        {canRefresh && (
          <Button
            variant="secondary" loading={refreshing}
            onClick={onRefreshGfs}
          >
            ⟳ Refresh global directory
          </Button>
        )}
      </div>

      <div class="sh-browser-toolbar">
        <input
          class="sh-input"
          type="search"
          placeholder="Search by name or description…"
          value={term}
          onInput={(e) => {
            searchTerm.value = (e.target as HTMLInputElement).value
          }}
        />
      </div>

      <nav class="sh-browser-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab.value === 'household'}
          class={
            'sh-browser-tab'
            + (activeTab.value === 'household' ? ' sh-browser-tab--active' : '')
          }
          onClick={() => { activeTab.value = 'household' }}
        >
          🏠 Your household ({lists.household.length})
        </button>
        {hasFriends && (
          <button
            role="tab"
            aria-selected={activeTab.value === 'friends'}
            class={
              'sh-browser-tab'
              + (activeTab.value === 'friends' ? ' sh-browser-tab--active' : '')
            }
            onClick={() => { activeTab.value = 'friends' }}
          >
            🤝 From friends ({lists.friends.length})
          </button>
        )}
        <button
          role="tab"
          aria-selected={activeTab.value === 'global'}
          class={
            'sh-browser-tab'
            + (activeTab.value === 'global' ? ' sh-browser-tab--active' : '')
          }
          onClick={() => { activeTab.value = 'global' }}
        >
          🌐 Global ({lists.global.length})
        </button>
      </nav>

      <section class="sh-browser-grid" role="tabpanel">
        {lists[activeTab.value].length === 0 && (
          <p class="sh-muted sh-browser-empty">
            {activeTab.value === 'global'
              ? 'No global spaces found. Try refreshing the directory or widening your search.'
              : activeTab.value === 'friends'
                ? 'None of your paired friends have shared a public space yet.'
                : 'Nothing here yet. Create a space from the sidebar.'}
          </p>
        )}
        {lists[activeTab.value].map((e) => (
          <SpaceCard key={e.space_id} entry={e} onAction={onAction} />
        ))}
      </section>

      {activeModal && (
        <JoinRequestModal
          open={true}
          onClose={() => setActiveModal(null)}
          spaceName={activeModal.name}
          hostDisplayName={activeModal.host_display_name}
          hostIsPaired={activeModal.host_is_paired}
          onSubmit={onSubmitJoinRequest}
        />
      )}
    </div>
  )
}
