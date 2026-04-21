/**
 * ReadReceipts — checkmark indicators in DMs (§23.47d, §23.70).
 */

interface ReadReceiptProps {
  sent: boolean
  delivered: boolean
  read: boolean
}

export function ReadReceipt({ sent, delivered, read }: ReadReceiptProps) {
  if (read) return <span class="sh-receipt sh-receipt--read" title="Read">✓✓</span>
  if (delivered) return <span class="sh-receipt sh-receipt--delivered" title="Delivered">✓✓</span>
  if (sent) return <span class="sh-receipt sh-receipt--sent" title="Sent">✓</span>
  return <span class="sh-receipt sh-receipt--pending" title="Sending">○</span>
}

/**
 * ReadReceiptsOptIn — privacy toggle (§23.70).
 */
import { signal } from '@preact/signals'

export const readReceiptsEnabled = signal(
  localStorage.getItem('sh_read_receipts') !== 'off'
)

export function ReadReceiptsToggle() {
  const toggle = () => {
    readReceiptsEnabled.value = !readReceiptsEnabled.value
    localStorage.setItem('sh_read_receipts', readReceiptsEnabled.value ? 'on' : 'off')
  }
  return (
    <label class="sh-toggle-row">
      <input type="checkbox" checked={readReceiptsEnabled.value} onChange={toggle} />
      Send read receipts
    </label>
  )
}
