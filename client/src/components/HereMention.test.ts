import { describe, it, expect } from 'vitest'
import { renderMentions } from './HereMention'

describe('renderMentions', () => {
  it('highlights @here', () => {
    const result = renderMentions('Hey @here meeting now')
    expect(result).toContain('sh-mention--here')
    expect(result).toContain('@here')
  })

  it('highlights @username', () => {
    const result = renderMentions('Thanks @anna')
    expect(result).toContain('sh-mention--user')
    expect(result).toContain('@anna')
  })

  it('passes through plain text', () => {
    expect(renderMentions('hello world')).toBe('hello world')
  })
})
