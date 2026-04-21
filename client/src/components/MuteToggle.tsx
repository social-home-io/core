/**
 * MuteToggle — mute conversation or space notifications (§23.66).
 */
import { api } from '@/api'
import { showToast } from './Toast'

export function MuteToggle({ type, id, muted, onToggle }: {
  type: 'conversation' | 'space'; id: string; muted: boolean; onToggle: (m: boolean) => void
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
