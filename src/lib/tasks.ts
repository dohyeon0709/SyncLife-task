import type { Task, Status, Priority } from '../types'

export function updateTaskFields(
  tasks: Task[],
  id: string,
  fields: Partial<Task>,
): Task[] {
  return tasks.map((t) => (t.id === id ? { ...t, ...fields } : t))
}

export function moveTask(tasks: Task[], id: string, status: Status): Task[] {
  return updateTaskFields(tasks, id, { status })
}

export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((t) => t.id !== id)
}

export function insertTask(tasks: Task[], task: Task): Task[] {
  return [task, ...tasks]
}

export function replaceTask(
  tasks: Task[],
  matchId: string,
  replacement: Task,
): Task[] {
  return tasks.map((t) => (t.id === matchId ? replacement : t))
}

export function filterByTitle(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase()
  if (!q) return tasks
  return tasks.filter((t) => t.title.toLowerCase().includes(q))
}

export function filterTasks(
  tasks: Task[],
  { search, priority }: { search: string; priority: Priority | 'all' },
): Task[] {
  const bySearch = filterByTitle(tasks, search)
  if (priority === 'all') return bySearch
  return bySearch.filter((t) => t.priority === priority)
}

export function groupByStatus(tasks: Task[]): Record<Status, Task[]> {
  const map: Record<Status, Task[]> = {
    'todo': [],
    'in-progress': [],
    'done': [],
  }
  for (const t of tasks) map[t.status].push(t)
  return map
}
