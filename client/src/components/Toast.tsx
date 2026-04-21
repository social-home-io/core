import { signal } from '@preact/signals'

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
}

let nextId = 0
export const toasts = signal<ToastItem[]>([])

export function showToast(message: string, type: ToastItem['type'] = 'info') {
  const id = nextId++
  toasts.value = [...toasts.value, { id, message, type }]
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 4000)
}

export function ToastContainer() {
  return (
    <div class="sh-toast-container">
      {toasts.value.map(t => (
        <div key={t.id} class={`sh-toast sh-toast--${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
