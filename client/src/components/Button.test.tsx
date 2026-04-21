import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/preact'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    const { getByText } = render(<Button>Click me</Button>)
    expect(getByText('Click me')).toBeTruthy()
  })

  it('calls onClick when clicked', () => {
    const fn = vi.fn()
    const { getByText } = render(<Button onClick={fn}>Go</Button>)
    fireEvent.click(getByText('Go'))
    expect(fn).toHaveBeenCalledOnce()
  })

  it('is disabled when loading', () => {
    const { container } = render(<Button loading>Submit</Button>)
    const btn = container.querySelector('button')
    expect(btn?.disabled).toBe(true)
  })

  it('applies variant class', () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    const btn = container.querySelector('button')
    expect(btn?.className).toContain('sh-btn--danger')
  })
})
