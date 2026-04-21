/**
 * SpaceCard — shared card renderer for the three browser tabs
 * ("Your household" / "From friends" / "Global directory").
 *
 * Surfaces a scope chip (🏠 household / 🤝 public / 🌐 global),
 * a join-mode chip (🔓 Open / ✉ Approval required / 🎟 Invite-only),
 * an optional age chip (13+ / 16+ / 18+), the "Hosted by …" line for
 * remote spaces, and routes the action button between five states:
 *
 *   • already-member          → "Open space"
 *   • request pending         → disabled "Request pending"
 *   • open + local-or-paired  → "Join"
 *   • request + local-or-paired → "Request to join" (opens modal)
 *   • invite-only             → disabled "Invite required"
 *   • remote + unpaired host  → "Connect with {household} first"
 */
import { Button } from '@/components/Button'
import type { DirectoryEntry } from '@/types'

type Action =
  | { kind: 'join' }
  | { kind: 'request' }
  | { kind: 'open' }
  | { kind: 'pending' }
  | { kind: 'invite-only' }
  | { kind: 'pair-first' }

export interface SpaceCardProps {
  entry: DirectoryEntry
  /** Invoked when the user clicks the primary action; the caller
   *  interprets {@link DirectoryEntry} + action to decide what to do. */
  onAction: (entry: DirectoryEntry, action: Action) => void
}

function scopeChip(scope: DirectoryEntry['scope']) {
  switch (scope) {
    case 'household':
      return { cls: 'sh-scope-chip sh-scope-chip--household', icon: '🏠', label: 'Household' }
    case 'public':
      return { cls: 'sh-scope-chip sh-scope-chip--public', icon: '🤝', label: 'Public' }
    case 'global':
      return { cls: 'sh-scope-chip sh-scope-chip--global', icon: '🌐', label: 'Global' }
  }
}

function joinModeChip(mode: DirectoryEntry['join_mode']) {
  switch (mode) {
    case 'open':
      return { cls: 'sh-join-mode-chip sh-join-mode-chip--open', icon: '🔓', label: 'Open to join' }
    case 'request':
      return { cls: 'sh-join-mode-chip sh-join-mode-chip--request', icon: '✉', label: 'Approval required' }
    case 'link':
    case 'invite_only':
      return { cls: 'sh-join-mode-chip sh-join-mode-chip--invite', icon: '🎟', label: 'Invite-only' }
  }
}

function decideAction(entry: DirectoryEntry): Action {
  if (entry.already_member) return { kind: 'open' }
  if (entry.request_pending) return { kind: 'pending' }
  if (entry.join_mode === 'invite_only' || entry.join_mode === 'link') return { kind: 'invite-only' }
  // Remote + unpaired = must pair first before joining / requesting.
  if (entry.scope === 'global' && !entry.host_is_paired) return { kind: 'pair-first' }
  if (entry.scope === 'public' && !entry.host_is_paired) return { kind: 'pair-first' }
  return entry.join_mode === 'open' ? { kind: 'join' } : { kind: 'request' }
}

function actionLabel(action: Action, entry: DirectoryEntry): string {
  switch (action.kind) {
    case 'open':        return 'Open space'
    case 'pending':     return 'Request pending'
    case 'invite-only': return 'Invite required'
    case 'join':        return 'Join'
    case 'request':     return 'Request to join'
    case 'pair-first':  return `Connect with ${entry.host_display_name} first`
  }
}

export function SpaceCard({ entry, onAction }: SpaceCardProps) {
  const scope = scopeChip(entry.scope)
  const jmode = joinModeChip(entry.join_mode)
  const action = decideAction(entry)
  const disabled = action.kind === 'pending' || action.kind === 'invite-only'

  return (
    <article class="sh-browser-card">
      <div class="sh-browser-card__hd">
        <span class="sh-space-emoji" aria-hidden="true">{entry.emoji || '🗂'}</span>
        <div class="sh-browser-card__title">
          <strong>{entry.name}</strong>
          <span class="sh-muted sh-browser-card__count">
            {entry.member_count} {entry.member_count === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
      {entry.description && (
        <p class="sh-browser-card__desc sh-muted">{entry.description}</p>
      )}
      <div class="sh-browser-card__chips">
        <span class={scope.cls} title={scope.label}>
          <span aria-hidden="true">{scope.icon}</span> {scope.label}
        </span>
        <span class={jmode.cls} title={jmode.label}>
          <span aria-hidden="true">{jmode.icon}</span> {jmode.label}
        </span>
        {entry.min_age > 0 && (
          <span class="sh-age-chip" title={`Minimum age ${entry.min_age}`}>
            {entry.min_age}+
          </span>
        )}
      </div>
      {entry.scope !== 'household' && (
        <p class="sh-host-callout sh-muted">
          Hosted by <strong>{entry.host_display_name}</strong>
          {!entry.host_is_paired && (
            <span class="sh-muted"> · not yet connected</span>
          )}
        </p>
      )}
      <div class="sh-browser-card__actions">
        <Button
          variant={action.kind === 'open' ? 'primary' : 'secondary'}
          disabled={disabled}
          onClick={() => onAction(entry, action)}
        >
          {actionLabel(action, entry)}
        </Button>
      </div>
    </article>
  )
}
