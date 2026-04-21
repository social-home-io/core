import { describe, it, expect } from 'vitest'
import { items } from './shopping'

describe('shopping store', () => {
  it('starts with empty items', () => {
    expect(items.value).toEqual([])
  })
})
