/**
 * ThemeToggle — dark/light/auto theme switcher (§23.35).
 */
import { signal, effect } from '@preact/signals'

export type Theme = 'light' | 'dark' | 'auto'
export const theme = signal<Theme>(
  (localStorage.getItem('sh_theme') as Theme) || 'auto'
)

// Apply theme to document
if (typeof document !== 'undefined') {
  effect(() => {
    const t = theme.value
    localStorage.setItem('sh_theme', t)
    const root = document.documentElement
    root.classList.remove('sh-theme-light', 'sh-theme-dark')
    if (t === 'auto') {
      const prefersDark = typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false
      root.classList.add(prefersDark ? 'sh-theme-dark' : 'sh-theme-light')
    } else {
      root.classList.add(`sh-theme-${t}`)
    }
  })
}

export function ThemeToggle() {
  const next = () => {
    const order: Theme[] = ['light', 'dark', 'auto']
    const idx = order.indexOf(theme.value)
    theme.value = order[(idx + 1) % order.length]
  }
  const icon = theme.value === 'light' ? '☀️' : theme.value === 'dark' ? '🌙' : '🔄'
  return (
    <button class="sh-theme-toggle" onClick={next} title={`Theme: ${theme.value}`} aria-label="Toggle theme">
      {icon}
    </button>
  )
}
