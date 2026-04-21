import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/preact'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal open={false} title="T" onClose={() => {}}>Content</Modal>
    )
    expect(container.textContent).toBe('')
  })

  it('shows title and children when open', () => {
    const { getByText } = render(
      <Modal open={true} title="My Modal" onClose={() => {}}>
        <p>Hello modal</p>
      </Modal>
    )
    expect(getByText('My Modal')).toBeTruthy()
    expect(getByText('Hello modal')).toBeTruthy()
  })

  it('calls onClose when X clicked', () => {
    const fn = vi.fn()
    const { container } = render(
      <Modal open={true} title="T" onClose={fn}>C</Modal>
    )
    const closeBtn = container.querySelector('.sh-modal-close')
    if (closeBtn) fireEvent.click(closeBtn)
    expect(fn).toHaveBeenCalled()
  })
})
