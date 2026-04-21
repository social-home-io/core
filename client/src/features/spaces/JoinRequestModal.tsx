/**
 * JoinRequestModal — reusable "Request to join this space" dialog.
 *
 * Works for both local-household spaces (join_mode=request, same
 * household) and cross-household spaces (remote peer, same mechanism
 * via §D2 federated join-request).
 */
import { useState } from 'preact/hooks'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'

export interface JoinRequestModalProps {
  open: boolean
  onClose: () => void
  spaceName: string
  hostDisplayName: string
  hostIsPaired: boolean
  /** Called with the message body on submit. Caller does the POST. */
  onSubmit: (message: string) => Promise<void>
}

export function JoinRequestModal({
  open, onClose, spaceName, hostDisplayName, hostIsPaired, onSubmit,
}: JoinRequestModalProps) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async () => {
    setSubmitting(true); setError(null)
    try {
      await onSubmit(message)
      setMessage('')
      onClose()
    } catch (exc) {
      setError((exc as Error).message || 'Failed to send')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Request to join ${spaceName}`}>
      <p class="sh-muted">
        Your request will be sent to the admins of <strong>{hostDisplayName}</strong>.
        {hostIsPaired
          ? ' You\'ll be added automatically once they approve.'
          : ' You\'ll need to be connected with their household for this to work.'}
      </p>
      <label class="sh-form-field">
        <span>Add a short message (optional)</span>
        <textarea
          value={message}
          rows={4}
          placeholder="Hi, I'd love to join because…"
          onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
        />
      </label>
      {error && <p class="sh-error">{error}</p>}
      <div class="sh-modal-actions">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="primary" onClick={submit} loading={submitting}
        >
          Send request
        </Button>
      </div>
    </Modal>
  )
}
