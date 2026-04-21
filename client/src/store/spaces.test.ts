import { describe, it, expect } from 'vitest'
import { spaces, activeSpace } from './spaces'

describe('spaces store', () => {
  it('starts with empty spaces', () => {
    expect(spaces.value).toEqual([])
  })

  it('activeSpace starts null', () => {
    expect(activeSpace.value).toBe(null)
  })
})
