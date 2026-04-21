/**
 * LinkPreview — OG card for URLs in posts (§23.31).
 * Fetches og:title/image/description from the backend proxy.
 */
import { useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'

interface OGData { title: string; description?: string; image?: string; url: string }

export function LinkPreview({ url }: { url: string }) {
  const data = signal<OGData | null>(null)
  const loading = signal(true)

  useEffect(() => {
    // v1: no backend OG proxy yet — just show the URL as a clickable card
    data.value = { title: new URL(url).hostname, url }
    loading.value = false
  }, [url])

  if (loading.value || !data.value) return null

  return (
    <a href={data.value.url} target="_blank" rel="noopener noreferrer" class="sh-link-preview">
      {data.value.image && <img src={data.value.image} class="sh-link-preview-img" />}
      <div class="sh-link-preview-text">
        <strong>{data.value.title}</strong>
        {data.value.description && <p class="sh-muted">{data.value.description}</p>}
        <span class="sh-muted">{new URL(data.value.url).hostname}</span>
      </div>
    </a>
  )
}
