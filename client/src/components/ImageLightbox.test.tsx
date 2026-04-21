import { describe, it, expect } from 'vitest'

describe('ImageLightbox', () => {
  it('module exports exist', async () => {
    const mod = await import('./ImageLightbox')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
