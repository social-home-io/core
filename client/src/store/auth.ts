import { signal, computed } from '@preact/signals'
import type { User } from '@/types'

export const token       = signal<string | null>(localStorage.getItem('sh_token'))
export const currentUser = signal<User | null>(null)
export const isAuthed    = computed(() => token.value !== null && currentUser.value !== null)

export function setToken(t: string) {
  token.value = t
  localStorage.setItem('sh_token', t)
}

export function logout() {
  token.value = null
  currentUser.value = null
  localStorage.removeItem('sh_token')
}
