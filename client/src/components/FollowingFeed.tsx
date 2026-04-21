/**
 * FollowingFeed — aggregate feed from followed spaces (§23.94).
 */
import { useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'
import { PostCard } from './PostCard'
import { Spinner } from './Spinner'
import type { FeedPost } from '@/types'

const posts = signal<FeedPost[]>([])
const loading = signal(true)

export function FollowingFeed() {
  useEffect(() => {
    // v1: aggregate from all followed spaces
    // For now, show empty state
    loading.value = false
    posts.value = []
  }, [])

  if (loading.value) return <Spinner />

  return (
    <div class="sh-following-feed">
      <h2>Following</h2>
      {posts.value.length === 0 && (
        <p class="sh-muted">Follow spaces to see their posts here.</p>
      )}
      {posts.value.map(p => <PostCard key={p.id} post={p} />)}
    </div>
  )
}
