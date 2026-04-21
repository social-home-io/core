/**
 * RemoteInviteInboxBanner — surfaces pending inbound private-space
 * invitations from other households (§D1b). Sits at the top of the
 * space list so a user who just received one doesn't miss it.
 *
 * One-click Accept consumes the invite token and seats the user as a
 * remote member of the host's private space. Decline tells the host
 * via ``SPACE_PRIVATE_INVITE_DECLINE``.
 */
import { useEffect, useState } from 'preact/hooks'
import { api } from '@/api'
import { Button } from './Button'
import { showToast } from './Toast'
import type { RemoteInvite } from '@/types'

export function RemoteInviteInboxBanner() {
  const [invites, setInvites] = useState<RemoteInvite[]>([])

  const load = () => {
    api.get('/api/remote_invites').then((data) => {
      setInvites(data as RemoteInvite[])
    }).catch(() => {
      setInvites([])
    })
  }

  useEffect(() => {
    load()
  }, [])

  if (invites.length === 0) return null

  const decide = async (invite: RemoteInvite, decision: 'accept' | 'decline') => {
    try {
      await api.post(
        `/api/remote_invites/${invite.invite_token}/${decision}`, {},
      )
      showToast(
        decision === 'accept' ? 'Invite accepted' : 'Invite declined',
        decision === 'accept' ? 'success' : 'info',
      )
      load()
    } catch (exc) {
      showToast((exc as Error).message, 'error')
    }
  }

  return (
    <aside class="sh-remote-invite-banner">
      <h2>📬 Pending invites from other households</h2>
      {invites.map((inv) => (
        <div key={inv.invite_token} class="sh-remote-invite-banner__row">
          <div>
            <strong>{inv.space_display_hint || inv.space_id}</strong>
            <span class="sh-muted">
              {' '}from household <code>{inv.inviter_instance_id.slice(0, 12)}…</code>
            </span>
          </div>
          <div class="sh-remote-invite-banner__actions">
            <Button
              variant="secondary" onClick={() => decide(inv, 'decline')}
            >
              Decline
            </Button>
            <Button
              variant="primary" onClick={() => decide(inv, 'accept')}
            >
              Accept
            </Button>
          </div>
        </div>
      ))}
    </aside>
  )
}
