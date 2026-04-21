/**
 * SkinTonePicker — emoji skin-tone modifier (§23.39).
 */
import { signal } from '@preact/signals'

const TONES = ['', '🏻', '🏼', '🏽', '🏾', '🏿']
export const selectedTone = signal(localStorage.getItem('sh_skin_tone') || '')

export function SkinTonePicker({ onSelect }: { onSelect?: (tone: string) => void }) {
  return (
    <div class="sh-skin-picker" role="radiogroup" aria-label="Skin tone">
      {TONES.map(tone => (
        <button key={tone}
          class={`sh-skin-btn ${selectedTone.value === tone ? 'sh-skin-btn--active' : ''}`}
          onClick={() => {
            selectedTone.value = tone
            localStorage.setItem('sh_skin_tone', tone)
            onSelect?.(tone)
          }}
          role="radio" aria-checked={selectedTone.value === tone}>
          {tone ? `👋${tone}` : '👋'}
        </button>
      ))}
    </div>
  )
}

export function applyTone(emoji: string): string {
  if (!selectedTone.value) return emoji
  // Simple: append modifier after the first emoji codepoint
  return emoji + selectedTone.value
}
