import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('renders initials when no src', () => {
    const { container } = render(<Avatar name="Anna Bee" />)
    expect(container.textContent).toContain('AN')
  })

  it('renders img when src provided', () => {
    const { container } = render(<Avatar name="Anna" src="/pic.jpg" />)
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.getAttribute('src')).toBe('/pic.jpg')
  })

  it('respects size prop', () => {
    const { container } = render(<Avatar name="A" size={64} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.width).toContain('64')
  })
})
