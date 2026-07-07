import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Task, Status } from './types'
import { getTasks, updateTask } from './api/client'
import { Column } from './components/Column'
import { Toast } from './components/Toast'

const COLUMNS: { status: Status; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
]

export default function Board() {
  const queryClient = useQueryClient()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const {
    data: tasks,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: ({ signal }) => getTasks(signal),
  })

  const moveMutation = useMutation({
    mutationFn: ({
      id,
      status,
      version,
    }: {
      id: string
      status: Status
      version: number
      title: string
    }) => updateTask(id, { status, version }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<Task[]>(['tasks'])
      queryClient.setQueryData<Task[]>(['tasks'], (prev) =>
        prev?.map((t) => (t.id === id ? { ...t, status } : t)),
      )
      return { previous }
    },
    onError: (_err, vars, context) => {
      queryClient.setQueryData(['tasks'], context?.previous)
      setToastMessage(
        `"${vars.title}" 이동에 실패했습니다. 이전 상태로 되돌렸습니다.`,
      )
    },
    onSuccess: (serverTask) => {
      queryClient.setQueryData<Task[]>(['tasks'], (prev) =>
        prev?.map((t) => (t.id === serverTask.id ? serverTask : t)),
      )
    },
  })

  const moveTask = (id: string, status: Status) => {
    const task = tasks?.find((t) => t.id === id)
    if (!task) return
    moveMutation.mutate({
      id,
      status,
      version: task.version,
      title: task.title,
    })
  }

  const byStatus = useMemo(() => {
    const map: Record<Status, Task[]> = {
      'todo': [],
      'in-progress': [],
      'done': [],
    }
    for (const t of tasks ?? []) map[t.status].push(t)
    return map
  }, [tasks])

  if (isPending) {
    return <p className="hint">불러오는 중…</p>
  }

  if (isError) {
    return (
      <div className="state-message state-error" role="alert">
        <p>
          태스크를 불러오지 못했습니다
          {error instanceof Error ? `: ${error.message}` : ''}
        </p>
        <button onClick={() => refetch()}>다시 시도</button>
      </div>
    )
  }

  if (tasks.length === 0) {
    return <p className="state-message">표시할 태스크가 없습니다.</p>
  }

  return (
    <>
      <div className="board">
        {COLUMNS.map((col) => (
          <Column
            key={col.status}
            title={col.title}
            status={col.status}
            tasks={byStatus[col.status]}
            onMove={moveTask}
          />
        ))}
      </div>
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  )
}
