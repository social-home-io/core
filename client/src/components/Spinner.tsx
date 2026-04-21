export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div class="sh-spinner" style={{ width: size, height: size }} role="status">
      <span class="sr-only">Loading...</span>
    </div>
  )
}
