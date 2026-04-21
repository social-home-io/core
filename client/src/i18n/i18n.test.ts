import { describe, it, expect } from 'vitest'
import { t, locale } from './i18n'

describe('i18n', () => {
  it('returns the key for known translations', () => {
    expect(t('app.title')).toBe('Social Home')
  })

  it('returns the key itself for unknown translations', () => {
    expect(t('unknown.key')).toBe('unknown.key')
  })

  it('interpolates parameters', () => {
    // No parametrized keys in en.json yet, but the function should pass through
    expect(t('app.title', { unused: 'x' })).toBe('Social Home')
  })

  it('default locale is en', () => {
    expect(locale.value).toBe('en')
  })
})
