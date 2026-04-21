/**
 * KeyboardShortcuts — global hotkey registry (§23.10).
 * Cmd+K is handled by QuickSwitcher; this adds the remaining shortcuts.
 */
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    // Ignore when typing in inputs
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

    if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      document.querySelector<HTMLInputElement>('.sh-search-input')?.focus()
    }
    if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
      // Focus the composer if visible
      document.querySelector<HTMLTextAreaElement>('.sh-composer-input')?.focus()
    }
    if (e.key === 'Escape') {
      // Close any open modal/overlay
      document.querySelector<HTMLButtonElement>('.sh-modal-close')?.click()
    }
  })
}

export function KeyboardShortcutsHelp() {
  return (
    <div class="sh-shortcuts-help">
      <h3>Keyboard Shortcuts</h3>
      <dl class="sh-shortcuts-list">
        <dt><kbd>Cmd+K</kbd></dt><dd>Quick switcher</dd>
        <dt><kbd>/</kbd></dt><dd>Focus search</dd>
        <dt><kbd>N</kbd></dt><dd>Focus composer</dd>
        <dt><kbd>Esc</kbd></dt><dd>Close modal</dd>
      </dl>
    </div>
  )
}
