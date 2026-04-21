import { describe, it, expect } from 'vitest'
import { getPermalink } from './DeepLinks'

describe('DeepLinks', () => {
  it('generates a permalink', () => {
    const link = getPermalink('post', '123')
    expect(link).toContain('/post/123')
    expect(link).toContain('http')
  })
})
