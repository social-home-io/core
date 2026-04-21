import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { RejectReasonDialog, openRejectReason } from './RejectReasonDialog'

describe('RejectReasonDialog', () => {
  it('is closed by default', () => {
    const { queryByRole } = render(<RejectReasonDialog />)
    expect(queryByRole('dialog')).toBeNull()
  })

  it('opens via openRejectReason and renders the provided label', async () => {
    const { findByRole, findByText } = render(<RejectReasonDialog />)
    openRejectReason({
      title: 'Reject this?',
      label: 'Tell the submitter why',
      onSubmit: async () => {},
    })
    const dialog = await findByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(await findByText('Tell the submitter why')).toBeTruthy()
  })

  it('invokes onSubmit with the typed reason and closes', async () => {
    const { findByRole, findByText, queryByRole } = render(
      <RejectReasonDialog />,
    )
    let captured = ''
    openRejectReason({
      title: 'Reject',
      label: 'Reason',
      onSubmit: async (reason) => {
        captured = reason
      },
    })
    const dialog = await findByRole('dialog')
    const textarea = dialog.querySelector('textarea')!
    textarea.value = '  off-topic  '
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    const submitBtn = await findByText('Submit')
    submitBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    // Wait for the async onSubmit + close.
    await new Promise((r) => setTimeout(r, 30))
    expect(captured).toBe('off-topic')
    expect(queryByRole('dialog')).toBeNull()
  })
})
