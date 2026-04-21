import { describe, it, expect } from 'vitest'
import { theme } from './ThemeToggle'

describe('ThemeToggle', () => {
  it('default theme is auto or persisted value', () => {
    expect(['light', 'dark', 'auto']).toContain(theme.value)
  })
})
