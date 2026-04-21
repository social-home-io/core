/**
 * ReadTracker — intersection observer for read position (§23.17).
 * Marks posts as "read" when they scroll into the viewport.
 */
import { useEffect, useRef } from 'preact/hooks'
import { api } from '@/api'

export function useReadTracker(postId: string) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          api.post(`/api/feed/read-position`, { post_id: postId }).catch(() => {})
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [postId])

  return ref
}
