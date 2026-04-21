/**
 * SpaceJoinLanding — handler for ``/join?token=...`` invite deep-links
 * (spec §23.62).
 *
 * The invite dialog (``SpaceInviteDialog``) generates a URL of the form
 * ``${origin}/join?token=X``. Pasting it into a desktop browser or
 * tapping it on mobile lands here: the page pulls the token out of the
 * query string, POSTs ``/api/spaces/join``, and redirects to the space
 * feed on success. Displays a contextual error message on failure.
 */
import { useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'
import { useLocation } from 'preact-iso'
import { api } from '@/api'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'

type Status = 'loading' | 'joined' | 'error'

const status  = signal<Status>('loading')
const message = signal<string>('')
const joined  = signal<{ space_id: string } | null>(null)

async function consumeToken(token: string) {
  try {
    const r = await api.post('/api/spaces/join', { token }) as {
      space_id: string
      role: string
    }
    joined.value = r
    status.value = 'joined'
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? String(err)
    message.value = msg || 'Invite link rejected'
    status.value = 'error'
  }
}

export default function SpaceJoinLanding() {
  const loc = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token') || ''
    if (!token) {
      status.value = 'error'
      message.value = 'This invite link is missing its token.'
      return
    }
    void consumeToken(token)
  }, [])

  if (status.value === 'loading') {
    return (
      <div class="sh-join-landing">
        <Spinner />
        <p>Joining the space…</p>
      </div>
    )
  }
  if (status.value === 'joined' && joined.value) {
    return (
      <div class="sh-join-landing sh-card">
        <h2>You're in! 🎉</h2>
        <p>Welcome to the space.</p>
        <Button onClick={() => loc.route(`/spaces/${joined.value!.space_id}`)}>
          Open space
        </Button>
      </div>
    )
  }
  return (
    <div class="sh-join-landing sh-card sh-error">
      <h2>Couldn't join</h2>
      <p>{message.value}</p>
      <Button onClick={() => loc.route('/spaces')}>Back to spaces</Button>
    </div>
  )
}
