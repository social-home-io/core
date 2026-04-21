/**
 * BazaarSellerDashboard — seller-facing summary (§23.63 / §23.126).
 *
 * Rendered as the header of the "My listings" tab on :mod:`BazaarPage`.
 * Groups the caller's listings by status and surfaces aggregate
 * counters + gross-sold so sellers see their marketplace activity at
 * a glance. Per-listing actions (accept offer, cancel) live inside
 * :mod:`BazaarPostBody` — this view is metrics + navigation.
 */
import { formatBazaarAmount } from './BazaarPostBody'
import type { BazaarListing } from '@/types'

interface Props {
  listings: BazaarListing[]
  onChanged?: () => void
}

export function BazaarSellerDashboard({ listings, onChanged }: Props) {
  void onChanged

  const active = listings.filter(l => l.status === 'active')
  const sold = listings.filter(l => l.status === 'sold')
  const closed = listings.filter(
    l => l.status === 'expired' || l.status === 'cancelled',
  )
  const grossByCurrency = sold.reduce<Record<string, number>>((acc, l) => {
    if (l.winning_price != null) {
      acc[l.currency] = (acc[l.currency] ?? 0) + l.winning_price
    }
    return acc
  }, {})
  const grossLabels = Object.entries(grossByCurrency).map(
    ([cur, amt]) => formatBazaarAmount(amt, cur),
  )

  return (
    <section class="sh-seller-dashboard" aria-label="Seller dashboard">
      <div class="sh-seller-stats">
        <Stat label="Active" value={active.length} />
        <Stat label="Sold" value={sold.length} />
        <Stat label="Closed" value={closed.length} />
        {grossLabels.length > 0 && (
          <Stat label="Gross"
                value={grossLabels.join(' · ')}
                emphasis />
        )}
      </div>
      {listings.length === 0 && (
        <p class="sh-muted">
          Nothing yet — tap <strong>+ New listing</strong> above.
        </p>
      )}
    </section>
  )
}

function Stat({
  label, value, emphasis,
}: {
  label: string
  value: string | number
  emphasis?: boolean
}) {
  return (
    <div class={`sh-seller-stat ${emphasis ? 'sh-seller-stat--primary' : ''}`}>
      <span class="sh-seller-stat-value">{value}</span>
      <span class="sh-seller-stat-label">{label}</span>
    </div>
  )
}
