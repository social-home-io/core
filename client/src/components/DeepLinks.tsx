/**
 * DeepLinks — permalink generation + share (§23.12).
 */
import { showToast } from './Toast'

export function getPermalink(type: string, id: string): string {
  return `${location.origin}/${type}/${id}`
}

export function ShareButton({ type, id }: { type: string; id: string }) {
  const share = async () => {
    const url = getPermalink(type, id)
    if (navigator.share) {
      await navigator.share({ url, title: 'Social Home' }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Link copied!', 'success')
    }
  }
  return <button class="sh-share-btn" onClick={share} title="Share link" aria-label="Share">↗</button>
}
