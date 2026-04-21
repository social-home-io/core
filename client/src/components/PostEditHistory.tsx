/**
 * PostEditHistory — viewer for past edits of a feed/space post (§23.36).
 *
 * Pages already have ``PageVersionHistory.tsx``; posts share the same
 * shape but live in feed_posts / space_posts. The component fetches
 * the version list and renders a chronological diff-style view.
 */
import { useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'
import { api } from '@/api'
import { Spinner } from './Spinner'
import { showToast } from './Toast'

interface Version {
  version: number
  edited_at: string
  edited_by: string
  content: string
}

const versions = signal<Version[]>([])
const loading  = signal(true)

export interface PostEditHistoryProps {
  postId: string
  scope?: 'feed' | 'space'
  spaceId?: string
}

export function PostEditHistory({
  postId, scope = 'feed', spaceId,
}: PostEditHistoryProps) {
  useEffect(() => { void load(postId, scope, spaceId) }, [postId, scope, spaceId])

  if (loading.value) return <Spinner />

  if (versions.value.length === 0) {
    return <p class="sh-muted">This post has not been edited.</p>
  }

  return (
    <ol class="sh-edit-history">
      {versions.value.map(v => (
        <li key={v.version} class="sh-edit-history-row">
          <header>
            <strong>v{v.version}</strong>
            <span class="sh-muted">
              {new Date(v.edited_at).toLocaleString()} · {v.edited_by}
            </span>
          </header>
          <pre class="sh-edit-history-body">{v.content}</pre>
        </li>
      ))}
    </ol>
  )
}

async function load(postId: string, scope: string, spaceId?: string) {
  loading.value = true
  try {
    const url = scope === 'space' && spaceId
      ? `/api/spaces/${spaceId}/posts/${postId}/history`
      : `/api/feed/posts/${postId}/history`
    versions.value = await api.get(url) as Version[]
  } catch (err: any) {
    // Backend may not implement the history endpoint yet; treat as empty
    // rather than blocking the UI.
    versions.value = []
    showToast(`No history available: ${err?.message || err}`, 'info')
  } finally {
    loading.value = false
  }
}
