import type { JSX } from 'preact'

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      class={`sh-btn sh-btn--${variant}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span class="sh-spinner-sm" /> : children}
    </button>
  )
}
