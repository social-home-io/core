import { signal } from '@preact/signals'
import type { Space } from '@/types'

export const spaces       = signal<Space[]>([])
export const activeSpace  = signal<Space | null>(null)
