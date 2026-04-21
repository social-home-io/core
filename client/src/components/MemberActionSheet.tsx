/**
 * MemberActionSheet — role/ban actions on space members (§23.98).
 */
import { signal } from '@preact/signals'
import { api } from '@/api'
import { Modal } from './Modal'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'
import { showToast } from './Toast'

const open = signal(false)
const memberUserId = signal('')
const memberRole = signal('')
const spaceId = signal('')
const showBanConfirm = signal(false)

export function openMemberActions(sid: string, userId: string, role: string) {
  spaceId.value = sid; memberUserId.value = userId; memberRole.value = role
  open.value = true
}

export function MemberActionSheet({ onUpdate }: { onUpdate: () => void }) {
  const setRole = async (role: string) => {
    try {
      await api.patch(`/api/spaces/${spaceId.value}/members/${memberUserId.value}`, { role })
      showToast(`Role changed to ${role}`, 'success')
      open.value = false; onUpdate()
    } catch (e: any) { showToast(e.message || 'Failed', 'error') }
  }

  const ban = async () => {
    try {
      await api.post(`/api/spaces/${spaceId.value}/ban`, { user_id: memberUserId.value })
      showToast('Member banned', 'info')
      showBanConfirm.value = false; open.value = false; onUpdate()
    } catch (e: any) { showToast(e.message || 'Failed', 'error') }
  }

  const remove = async () => {
    try {
      await api.delete(`/api/spaces/${spaceId.value}/members/${memberUserId.value}`)
      showToast('Member removed', 'info')
      open.value = false; onUpdate()
    } catch (e: any) { showToast(e.message || 'Failed', 'error') }
  }

  return (
    <>
      <Modal open={open.value} onClose={() => open.value = false} title="Member Actions">
        <div class="sh-member-actions">
          {memberRole.value !== 'admin' && (
            <Button variant="secondary" onClick={() => setRole('admin')}>Promote to admin</Button>
          )}
          {memberRole.value === 'admin' && (
            <Button variant="secondary" onClick={() => setRole('member')}>Demote to member</Button>
          )}
          <Button variant="secondary" onClick={remove}>Remove from space</Button>
          <Button variant="danger" onClick={() => showBanConfirm.value = true}>Ban</Button>
        </div>
      </Modal>
      <ConfirmDialog open={showBanConfirm.value} title="Ban member?"
        message="This member will be removed and cannot rejoin until unbanned."
        confirmLabel="Ban" destructive onConfirm={ban}
        onCancel={() => showBanConfirm.value = false} />
    </>
  )
}
