import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { ReadReceipt, readReceiptsEnabled } from './ReadReceipts'

describe('ReadReceipt', () => {
  it('shows single check for sent', () => {
    const { container } = render(<ReadReceipt sent={true} delivered={false} read={false} />)
    expect(container.textContent).toContain('✓')
  })

  it('shows double check for delivered', () => {
    const { container } = render(<ReadReceipt sent={true} delivered={true} read={false} />)
    expect(container.textContent).toContain('✓✓')
  })

  it('shows blue double check for read', () => {
    const { container } = render(<ReadReceipt sent={true} delivered={true} read={true} />)
    expect(container.querySelector('.sh-receipt--read')).toBeTruthy()
  })

  it('shows pending when not sent', () => {
    const { container } = render(<ReadReceipt sent={false} delivered={false} read={false} />)
    expect(container.textContent).toContain('○')
  })
})

describe('readReceiptsEnabled', () => {
  it('defaults to true', () => {
    expect(readReceiptsEnabled.value).toBe(true)
  })
})
