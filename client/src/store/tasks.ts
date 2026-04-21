/**
 * Tasks store — keeps the current task-list + task grid in sync with
 * WS frames from the backend.
 *
 * Emitted events the store subscribes to:
 *
 *  * ``task.created``      — a new task appears in some list
 *  * ``task.updated``      — any field changed (title, status, due,
 *                            assignees, position, description)
 *  * ``task.deleted``      — task row removed
 *  * ``task.assigned``     — a user newly assigned (fires alongside
 *                            ``task.updated`` for UI side-effects)
 *  * ``task.completed``    — transitioned to DONE
 *  * ``task.deadline_due`` — the deadline scheduler fired
 *  * ``task_list.created`` / ``.updated`` / ``.deleted`` — list
 *                            sidebar changes
 *
 * The page component writes the initial REST response into ``tasks``
 * and ``lists`` and then lets this store merge live updates.
 */
import { signal } from '@preact/signals'
import { ws } from '@/ws'
import type { TaskItem, TaskListEntry } from '@/types'

export const lists = signal<TaskListEntry[]>([])
export const tasks = signal<TaskItem[]>([])

export function wireTasksWs(): void {
  ws.on('task.created', (e) => {
    const t = (e.data as { task: TaskItem }).task
    if (!t) return
    if (!tasks.value.some((x) => x.id === t.id)) {
      tasks.value = [...tasks.value, t]
    }
  })
  ws.on('task.updated', (e) => {
    const t = (e.data as { task: TaskItem }).task
    if (!t) return
    if (tasks.value.some((x) => x.id === t.id)) {
      tasks.value = tasks.value.map((x) => (x.id === t.id ? t : x))
    } else {
      tasks.value = [...tasks.value, t]
    }
  })
  ws.on('task.deleted', (e) => {
    const { task_id } = e.data as { task_id: string }
    if (!task_id) return
    tasks.value = tasks.value.filter((x) => x.id !== task_id)
  })
  ws.on('task.completed', (e) => {
    const { task_id } = e.data as { task_id: string }
    tasks.value = tasks.value.map((x) =>
      x.id === task_id ? { ...x, status: 'done' } : x,
    )
  })
  ws.on('task.deadline_due', (_e) => {
    // Notification service already writes a row; store hook kept for
    // consumers that want to highlight the task inline.
  })

  ws.on('task_list.created', (e) => {
    const { list_id, name } = e.data as { list_id: string; name: string }
    if (!list_id) return
    if (!lists.value.some((x) => x.id === list_id)) {
      lists.value = [...lists.value, { id: list_id, name }]
    }
  })
  ws.on('task_list.updated', (e) => {
    const { list_id, name } = e.data as { list_id: string; name: string }
    if (!list_id) return
    lists.value = lists.value.map((x) =>
      x.id === list_id ? { ...x, name } : x,
    )
  })
  ws.on('task_list.deleted', (e) => {
    const { list_id } = e.data as { list_id: string }
    if (!list_id) return
    lists.value = lists.value.filter((x) => x.id !== list_id)
    tasks.value = tasks.value.filter((x) => x.list_id !== list_id)
  })
}
