/**
 * MobileNav — bottom tab bar for mobile (§23.20).
 * Only visible below the responsive breakpoint.
 */
export function MobileNav() {
  return (
    <nav class="sh-mobile-nav" role="navigation" aria-label="Mobile navigation">
      <a href="/" class="sh-mobile-tab">🏠<span>Feed</span></a>
      <a href="/spaces" class="sh-mobile-tab">💬<span>Spaces</span></a>
      <a href="/dms" class="sh-mobile-tab">✉️<span>DMs</span></a>
      <a href="/notifications" class="sh-mobile-tab">🔔<span>Notifs</span></a>
      <a href="/settings" class="sh-mobile-tab">⚙️<span>More</span></a>
    </nav>
  )
}
