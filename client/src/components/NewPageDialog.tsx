/**
 * NewPageDialog — modal replacement for the old window.prompt flow.
 */
import { useEffect, useRef, useState } from 'preact/hooks'
import { Button } from './Button'

interface Props {
  open: boolean
  onCreate: (title: string) => void | Promise<void>
  onCancel: () => void
}

export function NewPageDialog({ open, onCreate, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setBusy(false)
      setTimeout(() => ref.current?.focus(), 10)
    }
  }, [open])

  if (!open) return null

  const submit = async (e: Event) => {
    e.preventDefault()
    const t = title.trim()
    if (!t || busy) return
    setBusy(true)
    try { await onCreate(t) }
    finally { setBusy(false) }
  }

  return (
    <div class="sh-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        class="sh-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sh-new-page-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="sh-modal-header">
          <h3 id="sh-new-page-title" style={{ margin: 0 }}>New page</h3>
          <button
            type="button" class="sh-modal-close"
            aria-label="Close dialog" onClick={onCancel}
          >×</button>
        </div>
        <form class="sh-modal-body sh-form" onSubmit={submit}>
          <label>
            Title
            <input
              ref={ref}
              value={title}
              placeholder="e.g. Trip plan — Italy 2026"
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onCancel()
              }}
              required
            />
          </label>
          <div class="sh-form-actions">
            <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
            <Button type="submit" loading={busy} disabled={!title.trim()}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
