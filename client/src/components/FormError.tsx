/**
 * FormError — accessible inline form error message.
 *
 * Renders a ``role="alert"`` region the surrounding input can wire up
 * via ``aria-describedby={id}``. Screen readers announce the text the
 * moment it appears, giving sighted and non-sighted users parity.
 */
interface Props {
  id: string
  message: string | null | undefined
}

export function FormError({ id, message }: Props) {
  if (!message) return null
  return (
    <p id={id} class="sh-form-error" role="alert">
      {message}
    </p>
  )
}
