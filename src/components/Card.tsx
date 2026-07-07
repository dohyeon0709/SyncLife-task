import type { Task } from '../types'

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

interface Props {
  task: Task
  onClick?: (task: Task) => void
}

export function Card({ task, onClick }: Props) {
  return (
    <article
      className={`card priority-${task.priority}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
      onClick={() => onClick?.(task)}
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
