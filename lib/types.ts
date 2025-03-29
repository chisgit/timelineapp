export type Task = {
  id: string
  title: string
  startDay: number
  duration: number
  color: string
  laneId: string
  dependencies: string[]
  verticalPosition?: number
}

export type Lane = {
  id: string
  title: string
  isExpanded: boolean
}

export type TimelineMilestone = {
  id: string
  title: string
  day: number
}

export type ContextMenu = {
  isOpen: boolean
  x: number
  y: number
  taskId: string
} | null

export type DragInfo = {
  isDragging: boolean
  taskIds: string[]
  startX: number
  originalPositions: Array<{ id: string; startDay: number }>
  snappedPositions?: Record<string, number>
} | null

export type MousePosition = {
  x: number
  y: number
  lastY?: number
} | null