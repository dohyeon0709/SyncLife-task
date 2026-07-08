import { useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Task, Status } from '../types'
import { Card } from './Card'

interface Props {
  title: string
  status: Status
  tasks: Task[]
  onMove: (id: string, status: Status) => void
  onEdit: (task: Task) => void
}

const ESTIMATED_ROW_HEIGHT = 78

export function Column({ title, status, tasks, onMove, onEdit }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
  })

  const focusCardAt = (index: number) => {
    const clamped = Math.max(0, Math.min(index, tasks.length - 1))
    setFocusedIndex(clamped)
    virtualizer.scrollToIndex(clamped)
    requestAnimationFrame(() => {
      parentRef.current
        ?.querySelector<HTMLElement>(`[data-index="${clamped}"] .card`)
        ?.focus()
    })
  }

  const safeFocusedIndex =
    tasks.length === 0 ? -1 : Math.min(focusedIndex, tasks.length - 1)

  return (
    <section
      className="column"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData('text/plain')
        if (id) onMove(id, status)
      }}
    >
      <h2 className="column-title">
        {title} <span className="count">{tasks.length}</span>
      </h2>
      <div ref={parentRef} className="column-body">
        <div
          style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const task = tasks[virtualRow.index]
            return (
              <div
                key={task.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  paddingBottom: 8,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Card
                  task={task}
                  onClick={onEdit}
                  tabIndex={virtualRow.index === safeFocusedIndex ? 0 : -1}
                  onArrowDown={() => focusCardAt(virtualRow.index + 1)}
                  onArrowUp={() => focusCardAt(virtualRow.index - 1)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
