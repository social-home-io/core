import type { ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ComponentChildren
}

/**
 * Modal dialog surface (§23.21 accessibility).
 *
 * All household dialogs (Confirm, SpaceCreate, NewDm, BazaarCreate,
 * CalendarEvent, Report, etc.) compose on top of this component, so
 * wiring ``role="dialog"`` + ``aria-modal`` + a focus trap + Escape
 * handling here lifts the whole suite of dialogs without touching
 * each subclass.
 *
 * Focus-trap semantics (keyboard-only users):
 *   - On open, focus moves into the dialog automatically.
 *   - Tab at the last focusable element wraps to the first.
 *   - Shift+Tab at the first focusable element wraps to the last.
 *   - Escape invokes ``onClose``.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const titleId = useRef<string>(`sh-modal-title-${Math.random().toString(36).slice(2, 8)}`)

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return

    // Remember the element that had focus pre-open so we can restore.
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Move focus into the dialog — first focusable element.
    const focusables = _focusable(dialog)
    ;(focusables[0] ?? dialog).focus()

    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        onClose()
        return
      }
      if (ev.key !== 'Tab') return
      const items = _focusable(dialog!)
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault()
        last.focus()
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // Restore focus to whatever triggered the dialog.
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div class="sh-modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        class="sh-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="sh-modal-header">
          <h2 id={titleId.current}>{title}</h2>
          <button class="sh-modal-close" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>
        <div class="sh-modal-body">{children}</div>
      </div>
    </div>
  )
}


const _FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function _focusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(_FOCUSABLE_SELECTOR))
    .filter(el => !el.hasAttribute('aria-hidden'))
}
