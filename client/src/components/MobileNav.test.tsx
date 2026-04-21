import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { MobileNav } from './MobileNav'

describe('MobileNav', () => {
  it('renders tab links', () => {
    const { container } = render(<MobileNav />)
    const links = container.querySelectorAll('a')
    expect(links.length).toBe(5)
  })

  it('has navigation role', () => {
    const { container } = render(<MobileNav />)
    expect(container.querySelector('[role="navigation"]')).toBeTruthy()
  })

  it('contains Feed and Spaces tabs', () => {
    const { container } = render(<MobileNav />)
    expect(container.textContent).toContain('Feed')
    expect(container.textContent).toContain('Spaces')
  })
})
