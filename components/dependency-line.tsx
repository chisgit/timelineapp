import type { Task, Lane } from "./timeline"

interface DependencyLineProps {
  sourceTask: Task
  targetTask: Task
  totalDays: number
  lanes: Lane[]
}

export function DependencyLine({ sourceTask, targetTask, totalDays, lanes }: DependencyLineProps) {
  // Calculate positions
  const dayWidth = 100 / totalDays

  // Source task end point
  const sourceEndX = (sourceTask.startDay + sourceTask.duration) * dayWidth

  // Target task start point
  const targetStartX = targetTask.startDay * dayWidth

  // Find lane indices to calculate vertical positions
  const sourceLaneIndex = lanes.findIndex((l) => l.id === sourceTask.laneId)
  const targetLaneIndex = lanes.findIndex((l) => l.id === targetTask.laneId)

  // Calculate path for the arrow
  let path = ""

  // If source is before target (normal case)
  if (sourceEndX <= targetStartX) {
    // Direct line with arrow
    const midX = (sourceEndX + targetStartX) / 2

    if (sourceLaneIndex === targetLaneIndex) {
      // Same lane - simple horizontal line
      path = `M${sourceEndX},50 L${targetStartX},50`
    } else {
      // Different lanes - line with vertical segment
      path = `M${sourceEndX},50 L${midX},50 L${midX},${targetLaneIndex > sourceLaneIndex ? '100 L' + midX + ',0' : '0 L' + midX + ',100'} L${midX},50 L${targetStartX},50`
    }
  } else {
    // Source ends after target starts (unusual case)
    // Create a path that goes around
    const buffer = 1 * dayWidth // Buffer space

    if (sourceLaneIndex === targetLaneIndex) {
      // Same lane
      path = `M${sourceEndX},50 L${sourceEndX + buffer},50 L${sourceEndX + buffer},25 L${targetStartX - buffer},25 L${targetStartX - buffer},50 L${targetStartX},50`
    } else {
      // Different lanes
      path = `M${sourceEndX},50 L${sourceEndX + buffer},50 L${sourceEndX + buffer},${targetLaneIndex > sourceLaneIndex ? '100 L' : '0 L'}${targetStartX - buffer},${targetLaneIndex > sourceLaneIndex ? '0' : '100'} L${targetStartX - buffer},50 L${targetStartX},50`
    }
  }

  // Add arrow head
  const arrowPath = `M${targetStartX},50 L${targetStartX - 0.5},45 L${targetStartX - 0.5},55 Z`

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="4 2" />
      <path d={arrowPath} fill="var(--primary)" />
    </svg>
  )
}

