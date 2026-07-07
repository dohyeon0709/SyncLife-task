import { useState, type FormEvent } from 'react'
import type { Priority } from '../types'

export interface TaskFormValues {
  title: string
  priority: Priority
  description: string
}

interface Props {
  initial?: Partial<TaskFormValues>
  submitLabel: string
  onSubmit: (values: TaskFormValues) => void
  onCancel: () => void
}

export function TaskForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? 'medium',
  )
  const [description, setDescription] = useState(initial?.description ?? '')
  const [titleError, setTitleError] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError(true)
      return
    }
    onSubmit({ title: title.trim(), priority, description: description.trim() })
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label>
        제목 *
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setTitleError(false)
          }}
        />
        {titleError && (
          <span className="field-error">제목을 입력해주세요.</span>
        )}
      </label>
      <label>
        우선순위 *
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </label>
      <label>
        설명
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <div className="form-actions">
        <button type="button" onClick={onCancel}>
          취소
        </button>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}
