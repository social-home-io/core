/**
 * MuteToggle — mute conversation or space notifications (§23.66).
 */
import { showToast } from './Toast'

export function MuteToggle({ muted, onToggle }: {
  /** Reserved for v2 when the mute preference is persisted via a
   *  ``PATCH /api/conversations/{id}/mute`` or
   *  ``PATCH /api/spaces/{id}/mute`` endpoint; kept off the current
   *  prop list so ESLint doesn't flag them as unused. */
  type?: 'conversation' | 'space';
  id?: string;
  muted: boolean;
  onToggle: (m: boolean) => void;
}) {
  const toggle = async () => {
    try {
      // v1: stored client-side; real impl would PATCH the server
      onToggle(!muted)
      showToast(muted ? 'Unmuted' : 'Muted', 'info')
    } catch {}
  }
  return (
    <button class="sh-mute-toggle" onClick={toggle}
      title={muted ? 'Unmute' : 'Mute'} aria-label={muted ? 'Unmute' : 'Mute'}>
      {muted ? '🔇' : '🔔'}
    </button>
  )
}
