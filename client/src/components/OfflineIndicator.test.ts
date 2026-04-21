import { describe, it, expect } from 'vitest'
import { isOnline } from './OfflineIndicator'

describe('OfflineIndicator', () => {
  it('isOnline defaults to true in test env', () => {
    expect(isOnline.value).toBe(true)
  })
})
