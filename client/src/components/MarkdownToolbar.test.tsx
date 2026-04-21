import { describe, it, expect } from 'vitest'

describe('MarkdownToolbar', () => {
  it('module exports exist', async () => {
    const mod = await import('./MarkdownToolbar')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
