import type { Task } from '../types'

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

interface Props {
  task: Task
  onClick?: (task: Task) => void
  tabIndex?: number
  onArrowDown?: () => void
  onArrowUp?: () => void
}

export function Card({
  task,
  onClick,
  tabIndex = 0,
  onArrowDown,
  onArrowUp,
}: Props) {
  return (
    <article
      className={`card priority-${task.priority}`}
      draggable
      role="button"
      tabIndex={tabIndex}
      aria-label={`${task.title}, 우선순위 ${PRIORITY_LABEL[task.priority]}. 눌러서 수정`}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
      onClick={() => onClick?.(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(task)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          onArrowDown?.()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          onArrowUp?.()
        }
      }}
    >
      <div className="card-title">{task.title}</div>
      <div className="card-meta">
        <span className={`badge badge-${task.priority}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        <span className="date">
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>
    </article>
  )
}
