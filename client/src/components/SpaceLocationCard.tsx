/**
 * SpaceLocationCard — map widget shown inside a space's "Map" tab
 * (§23.80). Polls :path:`GET /api/spaces/{id}/presence` and hands the
 * filtered entries to the shared :component:`LocationMap`.
 *
 * Respects the space-level ``location_mode`` returned by the server:
 *
 *   * ``off``       — renders an explanatory banner so admins know
 *                     why the map is empty.
 *   * ``zone_only`` — server already nulled lat/lon; we render the
 *                     per-member zone chips instead of a pinned map.
 *   * ``gps``       — regular map with pins + accuracy rings.
 *
 * Polling cadence is 30 s — presence changes fan out via the WS
 * presence channel, but this page isn't always the active tab so we
 * keep a light pull as a fallback.
 */
import { useEffect, useState } from 'preact/hooks'
import { api } from '@/api'
import { Spinner } from './Spinner'
import { Avatar } from './Avatar'
import { LocationMap, type LocationMarker } from './LocationMap'

interface SpacePresenceEntry {
  user_id: string
  username: string
  display_name: string
  state: string
  zone_name: string | null
  latitude: number | null
  longitude: number | null
  gps_accuracy_m: number | null
  picture_url: string | null
}

interface SpacePresenceResponse {
  feature_enabled: boolean
  location_mode: 'off' | 'zone_only' | 'gps'
  entries: SpacePresenceEntry[]
}

const POLL_INTERVAL_MS = 30_000

function _dotClass(state: string): string {
  switch (state) {
    case 'home':     return 'sh-dot sh-dot--home'
    case 'away':     return 'sh-dot sh-dot--away'
    case 'not_home': return 'sh-dot sh-dot--not-home'
    default:         return 'sh-dot sh-dot--unknown'
  }
}

export function SpaceLocationCard({ spaceId }: { spaceId: string }) {
  const [data, setData] = useState<SpacePresenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const body = await api.get(`/api/spaces/${spaceId}/presence`)
        if (!cancelled) setData(body as SpacePresenceResponse)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    const t = setInterval(() => { void load() }, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(t) }
  }, [spaceId])

  if (loading) return <Spinner />
  if (error) return (
    <div class="sh-error-state" role="alert">
      Could not load space presence: {error}
    </div>
  )
  if (!data) return null

  if (!data.feature_enabled) {
    return (
      <div class="sh-space-location sh-muted">
        <p>
          <strong>Location sharing is off for this space.</strong>
        </p>
        <p>
          An admin can turn it on in Space Settings → Features. Options:
          members share their live GPS (<em>gps</em>), their current
          zone name only (<em>zone_only</em>), or keep it fully off.
        </p>
      </div>
    )
  }

  if (data.location_mode === 'zone_only') {
    return (
      <div class="sh-space-location">
        <div class="sh-space-location__mode-banner sh-muted">
          🔒 Zone-only mode — space members share zone labels but no map
          coordinates.
        </div>
        <div class="sh-presence-overview">
          {data.entries.length === 0 && (
            <p class="sh-muted">No presence data from any member yet.</p>
          )}
          {data.entries.map((p) => (
            <div key={p.user_id} class="sh-presence-mini">
              <span class={_dotClass(p.state)} />
              <Avatar name={p.display_name} src={p.picture_url} size={28} />
              <span>{p.display_name}</span>
              <span class="sh-muted">{p.zone_name || p.state}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // gps mode
  const markers: LocationMarker[] = data.entries
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.user_id,
      lat: p.latitude as number,
      lon: p.longitude as number,
      accuracy_m: p.gps_accuracy_m,
      label: p.display_name,
      sub_label: p.zone_name || p.state,
      avatar_url: p.picture_url,
      state: p.state,
    }))

  const sharing = markers.length
  const total = data.entries.length

  return (
    <div class="sh-space-location">
      <LocationMap
        markers={markers}
        height={380}
        emptyLabel={
          total === 0
            ? 'No presence data from this space\'s members yet.'
            : 'No one in this space is sharing GPS right now.'
        }
      />
      <div class="sh-location-map-footer sh-muted">
        <span>{sharing} of {total} sharing GPS</span>
        <span>Location mode: {data.location_mode}</span>
      </div>
    </div>
  )
}
