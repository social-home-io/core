/**
 * Lightbox — full-screen image viewer.
 *
 * Rendered above everything when an :mod:`ImageRenderer` image is
 * clicked. Closes on Escape, click-outside, or the ✕ button. Reuses
 * the existing ``.sh-lightbox-*`` styles used by :mod:`Gallery`.
 */
import { useEffect } from 'preact/hooks'

interface Props {
  src: string
  alt?: string
  onClose: () => void
}

export function Lightbox({ src, alt, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div class="sh-lightbox" role="dialog" aria-modal="true"
         aria-label="Image viewer">
      <div class="sh-lightbox-backdrop" onClick={onClose} />
      <div class="sh-lightbox-stage">
        <img class="sh-lightbox-media" src={src} alt={alt ?? ''} />
      </div>
      <button type="button" class="sh-lightbox-close"
              aria-label="Close viewer" onClick={onClose}>
        ✕
      </button>
    </div>
  )
}
