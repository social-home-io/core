/**
 * LongPressMenu — context menu on mobile (§23.37).
 */
import { signal } from '@preact/signals'

const menuItems = signal<{ label: string; action: () => void; danger?: boolean }[]>([])
const menuPos = signal({ x: 0, y: 0 })
const menuOpen = signal(false)

export function showContextMenu(x: number, y: number, items: typeof menuItems.value) {
  menuPos.value = { x, y }
  menuItems.value = items
  menuOpen.value = true
}

export function useLongPress(items: typeof menuItems.value) {
  let timer: ReturnType<typeof setTimeout>
  return {
    onTouchStart: (e: TouchEvent) => {
      timer = setTimeout(() => {
        const touch = e.touches[0]
        showContextMenu(touch.clientX, touch.clientY, items)
      }, 500)
    },
    onTouchEnd: () => clearTimeout(timer),
    onTouchMove: () => clearTimeout(timer),
    onContextMenu: (e: Event) => {
      e.preventDefault()
      const me = e as MouseEvent
      showContextMenu(me.clientX, me.clientY, items)
    },
  }
}

export function ContextMenu() {
  if (!menuOpen.value) return null
  return (
    <div class="sh-context-overlay" onClick={() => menuOpen.value = false}>
      <div class="sh-context-menu" style={{ top: menuPos.value.y, left: menuPos.value.x }}
        onClick={(e) => e.stopPropagation()}>
        {menuItems.value.map((item, i) => (
          <button key={i}
            class={`sh-context-item ${item.danger ? 'sh-context-item--danger' : ''}`}
            onClick={() => { item.action(); menuOpen.value = false }}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
