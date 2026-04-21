/**
 * PinPostAction — pin/unpin posts (§23.100).
 */
import { api } from '@/api'
import { showToast } from './Toast'

export async function pinPost(postId: string) {
  try {
    await api.post(`/api/feed/posts/${postId}/pin`)
    showToast('Post pinned', 'success')
  } catch (e: any) { showToast(e.message || 'Failed to pin', 'error') }
}

export async function unpinPost(postId: string) {
  try {
    await api.post(`/api/feed/posts/${postId}/unpin`)
    showToast('Post unpinned', 'info')
  } catch (e: any) { showToast(e.message || 'Failed to unpin', 'error') }
}

export function PinButton({ postId, pinned, onToggle }: {
  postId: string; pinned: boolean; onToggle?: () => void
}) {
  const handleClick = async () => {
    if (pinned) await unpinPost(postId)
    else await pinPost(postId)
    onToggle?.()
  }
  return (
    <button class={`sh-pin-btn ${pinned ? 'sh-pin-btn--active' : ''}`}
      onClick={handleClick} title={pinned ? 'Unpin' : 'Pin'}>
      📌
    </button>
  )
}
