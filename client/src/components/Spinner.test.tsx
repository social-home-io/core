import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('renders with default size', () => {
    const { container } = render(<Spinner />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.width).toContain('24')
  })

  it('renders with custom size', () => {
    const { container } = render(<Spinner size={48} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.width).toContain('48')
  })

  it('has status role for a11y', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('[role="status"]')).toBeTruthy()
  })
})
