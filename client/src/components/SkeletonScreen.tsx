/**
 * SkeletonScreen — loading placeholders (§23.118).
 * Shows animated placeholder shapes while content loads.
 */

export function PostSkeleton() {
  return (
    <div class="sh-skeleton sh-skeleton-post" aria-hidden="true">
      <div class="sh-skeleton-header">
        <div class="sh-skeleton-circle" />
        <div class="sh-skeleton-lines">
          <div class="sh-skeleton-line sh-skeleton-line--short" />
          <div class="sh-skeleton-line sh-skeleton-line--tiny" />
        </div>
      </div>
      <div class="sh-skeleton-body">
        <div class="sh-skeleton-line" />
        <div class="sh-skeleton-line" />
        <div class="sh-skeleton-line sh-skeleton-line--medium" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div class="sh-skeleton" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} class="sh-skeleton-row">
          <div class="sh-skeleton-circle" />
          <div class="sh-skeleton-line" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div class="sh-skeleton sh-skeleton-card" aria-hidden="true">
      <div class="sh-skeleton-rect" />
      <div class="sh-skeleton-line" />
      <div class="sh-skeleton-line sh-skeleton-line--short" />
    </div>
  )
}
