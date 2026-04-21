import { describe, it, expect, beforeEach } from 'vitest'
import { saveDraft, loadDraft, clearDraft } from './DraftPersistence'

describe('DraftPersistence', () => {
  beforeEach(() => localStorage.clear())

  it('saves and loads a draft', () => {
    saveDraft('feed', 'hello world')
    const draft = loadDraft('feed')
    expect(draft).toBeTruthy()
    expect(draft!.content).toBe('hello world')
  })

  it('returns null for missing draft', () => {
    expect(loadDraft('nonexistent')).toBe(null)
  })

  it('clearDraft removes the draft', () => {
    saveDraft('feed', 'test')
    clearDraft('feed')
    expect(loadDraft('feed')).toBe(null)
  })

  it('empty content removes the draft', () => {
    saveDraft('feed', 'content')
    saveDraft('feed', '   ')
    expect(loadDraft('feed')).toBe(null)
  })
})
