/**
 * RemoteInviteDialog — "Invite someone from another household" modal
 * for private-space admins (§D1b).
 *
 * Admin picks one of their paired households → types the invitee's
 * user id (eventually a picker once peer-user-sync surfaces the
 * peer's user directory locally). Submit POSTs to
 * `/api/spaces/{id}/remote-invites`.
 */
import { useEffect, useState } from 'preact/hooks'
import { signal } from '@preact/signals'
import { api } from '@/api'
import { Modal } from './Modal'
import { Button } from './Button'
import { showToast } from './Toast'

interface Peer {
  instance_id: string
  display_name: string
  status: string
}

const open = signal<string | null>(null) // holds the space_id being invited to

export function openRemoteInviteDialog(spaceId: string) {
  open.value = spaceId
}

export function RemoteInviteDialog() {
  const [peers, setPeers] = useState<Peer[]>([])
  const [viaPeer, setViaPeer] = useState('')
  const [userId, setUserId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open.value) return
    api.get('/api/pairing/connections').then((data) => {
      const confirmed = (data as Peer[]).filter(
        (p) => p.status === 'active' || p.status === 'confirmed',
      )
      setPeers(confirmed)
      if (confirmed.length === 1) {
        setViaPeer(confirmed[0].instance_id)
      }
    }).catch(() => {
      setPeers([])
    })
  }, [open.value])

  if (!open.value) return null

  const spaceId = open.value
  const close = () => {
    open.value = null
    setUserId(''); setError(null)
  }

  const submit = async () => {
    if (!viaPeer || !userId) {
      setError('Both fields are required')
      return
    }
    setSubmitting(true); setError(null)
    try {
      await api.post(`/api/spaces/${spaceId}/remote-invites`, {
        invitee_instance_id: viaPeer,
        invitee_user_id: userId,
      })
      showToast('Invite sent', 'success')
      close()
    } catch (exc) {
      setError((exc as Error).message || 'Failed to send')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={true} onClose={close} title="Invite from another household">
      {peers.length === 0 ? (
        <p class="sh-muted">
          You need at least one paired household before you can send a
          cross-household invite.
        </p>
      ) : (
        <>
          <label class="sh-form-field">
            <span>Paired household</span>
            <select
              value={viaPeer}
              onChange={(e) => setViaPeer((e.target as HTMLSelectElement).value)}
            >
              <option value="">Select a household</option>
              {peers.map((p) => (
                <option key={p.instance_id} value={p.instance_id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </label>
          <label class="sh-form-field">
            <span>User id on that household</span>
            <input
              type="text"
              value={userId}
              placeholder="user_id"
              onInput={(e) => setUserId((e.target as HTMLInputElement).value)}
            />
            <small class="sh-muted">
              Ask the person on the other side for their user id. Only
              the routing envelope travels in the clear — space name
              and your invitation message ride fully encrypted.
            </small>
          </label>
          {error && <p class="sh-error">{error}</p>}
          <div class="sh-modal-actions">
            <Button
              variant="secondary" onClick={close} disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary" onClick={submit} loading={submitting}
            >
              Send invite
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
