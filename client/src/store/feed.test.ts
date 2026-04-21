import { describe, it, expect } from 'vitest'
import { posts, feedLoading, feedHasMore } from './feed'

describe('feed store', () => {
  it('starts with empty posts', () => {
    expect(posts.value).toEqual([])
  })

  it('feedLoading starts false', () => {
    expect(feedLoading.value).toBe(false)
  })

  it('feedHasMore starts true', () => {
    expect(feedHasMore.value).toBe(true)
  })
})
