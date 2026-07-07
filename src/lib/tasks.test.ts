import { describe, it, expect } from 'vitest'
import {
  moveTask,
  filterByTitle,
  updateTaskFields,
  removeTask,
  insertTask,
  replaceTask,
  filterTasks,
  groupByStatus,
} from './tasks'
import type { Task } from '../types'

const make = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  title: `Task ${id}`,
  status: 'todo',
  priority: 'medium',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
  ...over,
})

describe('moveTask', () => {
  it('대상 태스크의 status 만 바꾸고 나머지는 그대로 둔다', () => {
    const tasks = [make('a'), make('b')]
    const next = moveTask(tasks, 'a', 'done')
    expect(next.find((t) => t.id === 'a')?.status).toBe('done')
    expect(next.find((t) => t.id === 'b')?.status).toBe('todo')
  })

  it('불변성을 지킨다 (원본 배열/객체를 변경하지 않는다)', () => {
    const tasks = [make('a')]
    const next = moveTask(tasks, 'a', 'done')
    expect(tasks[0].status).toBe('todo')
    expect(next).not.toBe(tasks)
  })
})

describe('filterByTitle', () => {
  it('대소문자 구분 없이 제목으로 필터링한다', () => {
    const tasks = [
      make('a', { title: 'Fix login bug' }),
      make('b', { title: 'Write docs' }),
    ]
    expect(filterByTitle(tasks, 'FIX')).toHaveLength(1)
  })

  it('빈 검색어면 전체를 반환한다', () => {
    const tasks = [make('a'), make('b')]
    expect(filterByTitle(tasks, '   ')).toHaveLength(2)
  })
})

describe('updateTaskFields', () => {
  it('대상 태스크의 지정한 필드만 바꾸고 나머지는 그대로 둔다', () => {
    const tasks = [make('a', { title: 'old' }), make('b')]
    const next = updateTaskFields(tasks, 'a', {
      title: 'new',
      priority: 'high',
    })
    expect(next.find((t) => t.id === 'a')).toMatchObject({
      title: 'new',
      priority: 'high',
    })
    expect(next.find((t) => t.id === 'b')?.title).toBe('Task b')
  })

  it('불변성을 지킨다', () => {
    const tasks = [make('a')]
    const next = updateTaskFields(tasks, 'a', { title: 'new' })
    expect(tasks[0].title).toBe('Task a')
    expect(next).not.toBe(tasks)
  })

  it('일치하는 id가 없으면 아무것도 바꾸지 않는다', () => {
    const tasks = [make('a')]
    const next = updateTaskFields(tasks, 'nope', { title: 'new' })
    expect(next).toEqual(tasks)
  })
})

describe('removeTask', () => {
  it('대상 id만 제거하고 나머지는 유지한다', () => {
    const tasks = [make('a'), make('b'), make('c')]
    const next = removeTask(tasks, 'b')
    expect(next.map((t) => t.id)).toEqual(['a', 'c'])
  })
})

describe('insertTask', () => {
  it('새 태스크를 맨 앞에 추가한다', () => {
    const tasks = [make('a')]
    const next = insertTask(tasks, make('new'))
    expect(next.map((t) => t.id)).toEqual(['new', 'a'])
  })
})

describe('replaceTask', () => {
  it('일치하는 id의 태스크를 통째로 교체한다', () => {
    const tasks = [make('temp-1'), make('b')]
    const replacement = make('real-1')
    const next = replaceTask(tasks, 'temp-1', replacement)
    expect(next.map((t) => t.id)).toEqual(['real-1', 'b'])
  })
})

describe('filterTasks', () => {
  const tasks = [
    make('a', { title: 'Fix login bug', priority: 'high' }),
    make('b', { title: 'Write docs', priority: 'low' }),
    make('c', { title: 'Fix docs typo', priority: 'low' }),
  ]

  it('검색어와 우선순위를 동시에 적용한다', () => {
    const result = filterTasks(tasks, { search: 'fix', priority: 'low' })
    expect(result.map((t) => t.id)).toEqual(['c'])
  })

  it('우선순위가 all이면 검색어만 적용한다', () => {
    const result = filterTasks(tasks, { search: 'fix', priority: 'all' })
    expect(result.map((t) => t.id)).toEqual(['a', 'c'])
  })
})

describe('groupByStatus', () => {
  it('상태별로 정확히 나눈다', () => {
    const tasks = [
      make('a', { status: 'todo' }),
      make('b', { status: 'in-progress' }),
      make('c', { status: 'todo' }),
    ]
    const grouped = groupByStatus(tasks)
    expect(grouped.todo.map((t) => t.id)).toEqual(['a', 'c'])
    expect(grouped['in-progress'].map((t) => t.id)).toEqual(['b'])
    expect(grouped.done).toEqual([])
  })
})
