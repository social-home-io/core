/**
 * ChildRestrictedView — restricted UI wrappers for minor accounts
 * (spec §23.106).
 *
 * * Named export :func:`ChildRestrictedView` — wraps a UI section and
 *   hides features a minor isn't allowed to access (``bazaar``,
 *   ``settings``).
 * * Named export :func:`ContentFilter` — wraps post content and hides
 *   flagged material for minors.
 * * Default export :func:`ChildRestrictedInfoPage` — a landing / onboarding
 *   panel a minor sees explaining their restrictions, with a link to the
 *   guardian help article. Mounted at ``/restrictions`` and linked from
 *   the side nav when CP is on for the caller.
 */
import type { ComponentChildren } from 'preact'
import { currentUser } from '@/store/auth'

interface RestrictedProps {
  children: ComponentChildren
  /** One of ``'dms' | 'bazaar' | 'spaces' | 'settings'``. */
  feature: string
  fallback?: ComponentChildren
}

/** Features the minor cannot use at all. */
const RESTRICTED_FEATURES = new Set(['bazaar', 'settings'])

export function ChildRestrictedView({ children, feature, fallback }: RestrictedProps) {
  const user = currentUser.value as (
    { is_minor?: boolean; child_protection_enabled?: boolean } | null
  )
  if (!user?.is_minor || !user?.child_protection_enabled) {
    return <>{children}</>
  }
  if (RESTRICTED_FEATURES.has(feature)) {
    return (
      <>{fallback || (
        <div class="sh-restricted-banner" role="alert">
          <h3>🔒 Restricted</h3>
          <p>
            This feature is not available for your account. Ask a parent
            or guardian for access.
          </p>
        </div>
      )}</>
    )
  }
  return <>{children}</>
}

/** Filters content that may be inappropriate for minors. */
export function ContentFilter({ children, flagged }: {
  children: ComponentChildren
  flagged?: boolean
}) {
  const user = currentUser.value as (
    { is_minor?: boolean; child_protection_enabled?: boolean } | null
  )
  if (flagged && user?.is_minor && user?.child_protection_enabled) {
    return (
      <div class="sh-content-filtered">
        <em class="sh-muted">
          This content has been hidden by your guardian's settings.
        </em>
      </div>
    )
  }
  return <>{children}</>
}

/**
 * First-login welcome page explaining the restrictions to a minor —
 * rendered at ``/restrictions`` and linked from the child's sidebar.
 */
export default function ChildRestrictedInfoPage() {
  const user = currentUser.value as (
    { display_name?: string; is_minor?: boolean } | null
  )
  const name = user?.display_name || 'there'
  return (
    <div class="sh-restricted-info sh-card">
      <h2>Welcome, {name}!</h2>
      <p>
        Your household has set up a <strong>protected account</strong> so
        you can use Social Home safely. Here's what that means:
      </p>
      <ul>
        <li>
          You can only join spaces your guardian has approved for your age.
        </li>
        <li>
          You can only send DMs to people your guardian knows.
        </li>
        <li>
          The bazaar and settings sections are hidden from you.
        </li>
        <li>
          Your guardian sees a log of key actions but not your message
          content.
        </li>
      </ul>
      <p class="sh-muted">
        Questions? Ask your guardian — they have a dashboard to help.
      </p>
    </div>
  )
}
