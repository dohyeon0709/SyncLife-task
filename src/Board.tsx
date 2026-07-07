import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Task, Status, Priority } from './types'
import {
  ApiError,
  createTask,
  deleteTask,
  getTasks,
  updateTask,
} from './api/client'
import { Column } from './components/Column'
import { Toast } from './components/Toast'
import { Modal } from './components/Modal'
import { TaskForm, type TaskFormValues } from './components/TaskForm'
import { ConfirmDialog } from './components/ConfirmDialog'

const COLUMNS: { status: Status; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
]

export default function Board() {
  const queryClient = useQueryClient()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const moveSeqRef = useRef(new Map<string, number>())

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
    mutationFn: async ({
      id,
      status,
      version,
    }: {
      id: string
      status: Status
      version: number
      title: string
      seq: number
    }) => {
      try {
        return await updateTask(id, { status, version })
      } catch (err) {
        // 409(버전 충돌)면 서버가 알려준 최신 version으로 한 번만 재시도한다.
        if (err instanceof ApiError && err.status === 409) {
          const current = (err.payload as { current: Task }).current
          return await updateTask(id, { status, version: current.version })
        }
        throw err
      }
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<Task[]>(['tasks'])
      queryClient.setQueryData<Task[]>(['tasks'], (prev) =>
        prev?.map((t) => (t.id === id ? { ...t, status } : t)),
      )
      return { previous }
    },
    onError: (_err, vars, context) => {
      if (moveSeqRef.current.get(vars.id) !== vars.seq) return
      queryClient.setQueryData(['tasks'], context?.previous)
      setToastMessage(
        `"${vars.title}" 이동에 실패했습니다. 이전 상태로 되돌렸습니다.`,
      )
    },
    onSuccess: (serverTask, vars) => {
      if (moveSeqRef.current.get(vars.id) !== vars.seq) return
      queryClient.setQueryData<Task[]>(['tasks'], (prev) =>
        prev?.map((t) => (t.id === serverTask.id ? serverTask : t)),
      )
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: TaskFormValues) =>
      createTask({
        title: values.title,
        priority: values.priority,
        description: values.description || undefined,
        status: 'todo',
      }),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<Task[]>(['tasks'])
      const tempId = `temp-${crypto.randomUUID()}`
      const now = new Date().toISOString()
      const optimisticTask: Task = {
        id: tempId,
        title: values.title,
        description: values.description || undefined,
        status: 'todo',
        priority: values.priority,
        createdAt: now,
        updatedAt: now,
        version: 0,
      }
      queryClient.setQueryData<Task[]>(['tasks'], (prev) => [
        optimisticTask,
        ...(prev ?? []),
      ])
      return { previous, tempId }
    },
    onError: (_err, values, context) => {
      queryClient.setQueryData(['tasks'], context?.previous)
      setToastMessage(`"${values.title}" 생성에 실패했습니다.`)
    },
    onSuccess: (serverTask, _values, context) => {
      queryClient.setQueryData<Task[]>(['tasks'], (prev) =>
        prev?.map((t) => (t.id === context?.tempId ? serverTask : t)),
      )
    },
  })

  const editMutation = useMutation({
    mutationFn: ({
      id,
      version,
      title,
      priority,
      description,
    }: {
      id: string
      version: number
      title: string
      priority: Priority
      description: string
    }) =>
      updateTask(id, {
        title,
        priority,
        description: description || undefined,
        version,
      }),
    onMutate: async ({ id, title, priority, description }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<Task[]>(['tasks'])
      queryClient.setQueryData<Task[]>(['tasks'], (prev) =>
        prev?.map((t) =>
          t.id === id
            ? { ...t, title, priority, description: description || undefined }
            : t,
        ),
      )
      return { previous }
    },
    onError: (_err, vars, context) => {
      queryClient.setQueryData(['tasks'], context?.previous)
      setToastMessage(`"${vars.title}" 수정에 실패했습니다.`)
    },
    onSuccess: (serverTask) => {
      queryClient.setQueryData<Task[]>(['tasks'], (prev) =>
        prev?.map((t) => (t.id === serverTask.id ? serverTask : t)),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (task: Task) => deleteTask(task.id),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<Task[]>(['tasks'])
      queryClient.setQueryData<Task[]>(['tasks'], (prev) =>
        prev?.filter((t) => t.id !== task.id),
      )
      return { previous }
    },
    onError: (_err, task, context) => {
      queryClient.setQueryData(['tasks'], context?.previous)
      setToastMessage(`"${task.title}" 삭제에 실패했습니다.`)
    },
  })

  const moveTask = (id: string, status: Status) => {
    const task = tasks?.find((t) => t.id === id)
    if (!task) return
    const seq = (moveSeqRef.current.get(id) ?? 0) + 1
    moveSeqRef.current.set(id, seq)
    moveMutation.mutate({
      id,
      status,
      version: task.version,
      title: task.title,
      seq,
    })
  }

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (tasks ?? []).filter((t) => {
      const matchesSearch = term === '' || t.title.toLowerCase().includes(term)
      const matchesPriority =
        priorityFilter === 'all' || t.priority === priorityFilter
      return matchesSearch && matchesPriority
    })
  }, [tasks, search, priorityFilter])

  const byStatus = useMemo(() => {
    const map: Record<Status, Task[]> = {
      'todo': [],
      'in-progress': [],
      'done': [],
    }
    for (const t of filteredTasks) map[t.status].push(t)
    return map
  }, [filteredTasks])

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
      <div className="toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="제목 검색…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(e.target.value as Priority | 'all')
          }
        >
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
          + 새 태스크
        </button>
      </div>
      {isCreateOpen && (
        <Modal title="새 태스크" onClose={() => setIsCreateOpen(false)}>
          <TaskForm
            submitLabel="생성"
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={(values) => {
              createMutation.mutate(values)
              setIsCreateOpen(false)
            }}
          />
        </Modal>
      )}
      {editingTask && (
        <Modal title="태스크 수정" onClose={() => setEditingTask(null)}>
          <TaskForm
            initial={{
              title: editingTask.title,
              priority: editingTask.priority,
              description: editingTask.description ?? '',
            }}
            submitLabel="저장"
            onCancel={() => setEditingTask(null)}
            onSubmit={(values) => {
              editMutation.mutate({
                id: editingTask.id,
                version: editingTask.version,
                ...values,
              })
              setEditingTask(null)
            }}
          />
          <button
            type="button"
            className="btn-danger-link"
            onClick={() => {
              setDeleteTarget(editingTask)
              setEditingTask(null)
            }}
          >
            이 태스크 삭제
          </button>
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`"${deleteTarget.title}"를 삭제할까요?`}
          onConfirm={() => {
            deleteMutation.mutate(deleteTarget)
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <div className="board">
        {COLUMNS.map((col) => (
          <Column
            key={col.status}
            title={col.title}
            status={col.status}
            tasks={byStatus[col.status]}
            onMove={moveTask}
            onEdit={setEditingTask}
          />
        ))}
      </div>
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  )
}
