/**
 * ReactionPicker — emoji reaction selection (§23.45).
 */
import { signal } from '@preact/signals'

const FREQUENT = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏']

// Keyword map — a minimal emoji-search index. Extend by adding
// keywords when people try to search for something that isn't here.
// Keep keywords lowercase and space-separated.
interface EmojiEntry { emoji: string; keywords: string }
const ALL_EMOJI_WITH_KEYWORDS: readonly EmojiEntry[] = [
  { emoji: '👍', keywords: 'thumbs up yes ok like approve' },
  { emoji: '👎', keywords: 'thumbs down no dislike reject' },
  { emoji: '❤️', keywords: 'heart love red' },
  { emoji: '🔥', keywords: 'fire hot lit flame' },
  { emoji: '😂', keywords: 'lol laugh cry joy funny' },
  { emoji: '😮', keywords: 'wow surprised shocked' },
  { emoji: '😢', keywords: 'sad cry tear' },
  { emoji: '😡', keywords: 'angry mad rage' },
  { emoji: '🎉', keywords: 'party celebrate congrats tada' },
  { emoji: '👏', keywords: 'clap applause bravo' },
  { emoji: '🤔', keywords: 'thinking hmm' },
  { emoji: '👀', keywords: 'eyes looking see' },
  { emoji: '💯', keywords: 'hundred perfect 100' },
  { emoji: '✅', keywords: 'check done tick yes' },
  { emoji: '❌', keywords: 'cross no wrong x' },
  { emoji: '⭐', keywords: 'star favourite favorite' },
  { emoji: '🙏', keywords: 'pray thanks please' },
  { emoji: '💪', keywords: 'muscle strong flex' },
  { emoji: '🫡', keywords: 'salute respect' },
  { emoji: '🤝', keywords: 'handshake deal agree' },
  { emoji: '😊', keywords: 'smile happy blush' },
  { emoji: '😎', keywords: 'cool sunglasses' },
  { emoji: '🥳', keywords: 'party celebrate birthday' },
  { emoji: '😴', keywords: 'sleep tired zzz' },
  { emoji: '🤯', keywords: 'mind blown exploding head' },
  { emoji: '💀', keywords: 'skull dead rip' },
  { emoji: '👻', keywords: 'ghost spooky halloween' },
  { emoji: '🎯', keywords: 'target bullseye focus' },
  { emoji: '🚀', keywords: 'rocket launch fast ship' },
  { emoji: '💡', keywords: 'idea bulb light' },
  { emoji: '🏠', keywords: 'home house' },
  { emoji: '🍕', keywords: 'pizza food' },
  { emoji: '☕', keywords: 'coffee tea drink' },
  { emoji: '🎵', keywords: 'music note song' },
  { emoji: '📚', keywords: 'books read study' },
  { emoji: '🔧', keywords: 'wrench tool fix' },
  { emoji: '🌟', keywords: 'star glowing sparkle' },
  { emoji: '💎', keywords: 'gem diamond jewel' },
  { emoji: '🌈', keywords: 'rainbow colorful pride' },
  { emoji: '🦋', keywords: 'butterfly insect' },
]
const ALL_EMOJI: readonly string[] = ALL_EMOJI_WITH_KEYWORDS.map(e => e.emoji)

function _matches(entry: EmojiEntry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  // Substring match on the keyword string. Simple, correct, fast.
  return entry.keywords.includes(q)
}

interface ReactionPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

const search = signal('')

export function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const filtered = search.value
    ? ALL_EMOJI_WITH_KEYWORDS.filter(e => _matches(e, search.value)).map(e => e.emoji)
    : ALL_EMOJI

  return (
    <div class="sh-reaction-picker" onClick={(e) => e.stopPropagation()}>
      <div class="sh-reaction-picker-header">
        <input class="sh-reaction-search" placeholder="Search emoji..."
          value={search.value}
          onInput={(e) => search.value = (e.target as HTMLInputElement).value} />
        <button class="sh-reaction-close" onClick={onClose}>✕</button>
      </div>
      <div class="sh-reaction-frequent">
        {FREQUENT.map(e => (
          <button key={e} class="sh-emoji-btn" onClick={() => { onSelect(e); onClose() }}>
            {e}
          </button>
        ))}
      </div>
      <div class="sh-reaction-grid">
        {filtered.map(e => (
          <button key={e} class="sh-emoji-btn" onClick={() => { onSelect(e); onClose() }}>
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
