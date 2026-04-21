/**
 * LandingDispatch — the component mounted at ``/``.
 *
 * Looks at the caller's ``landing_path`` preference:
 *   - ``/`` (default) → render the household feed
 *   - ``/dashboard``  → redirect to :mod:`DashboardPage` via preact-iso
 */
import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { getLandingPath } from '@/utils/preferences'
import FeedPage from './FeedPage'

export default function LandingDispatch() {
  const { route } = useLocation()

  useEffect(() => {
    if (getLandingPath() === '/dashboard') {
      route('/dashboard', true)   // replace so back-button doesn't bounce
    }
  }, [])

  if (getLandingPath() === '/dashboard') return null  // about to redirect
  return <FeedPage />
}
