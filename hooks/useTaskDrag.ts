import { useState, useRef } from "react"
import { Task, DragInfo, MousePosition } from "@/lib/types"
import { getDayWidth, getTaskVirtualLane } from "./taskUtils"

export function useTaskDrag(tasks: Task[], setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void, selectedTasks: string[]) {
  const [dragInfo, setDragInfo] = useState<DragInfo>(null)
  const [currentMousePosition, setCurrentMousePosition] = useState<MousePosition>(null)
  const dragInfoRef = useRef<DragInfo>(null)

  const handleTaskDragStart = (taskId: string, event: React.MouseEvent, timelineWidth: number, totalDays: number) => {
    event.preventDefault()

    const tasksToDrag = selectedTasks.includes(taskId) ? selectedTasks : [taskId]
    const originalPositions = tasksToDrag.map((id) => {
      const task = tasks.find((t) => t.id === id)
      return { id, startDay: task?.startDay || 0 }
    })

    const dragInfoValue = {
      isDragging: true,
      taskIds: tasksToDrag,
      startX: event.clientX,
      originalPositions,
    }
    
    setDragInfo(dragInfoValue)
    dragInfoRef.current = dragInfoValue

    const handleMove = (e: MouseEvent) => handleTaskDragMove(e, timelineWidth, totalDays)
    const handleEnd = (e: MouseEvent) => {
      handleTaskDragEnd(e, timelineWidth, totalDays)
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleEnd)
    }

    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseup", handleEnd)
  }

  const handleTaskDragMove = (event: MouseEvent, timelineWidth: number, totalDays: number) => {
    if (!dragInfoRef.current?.isDragging) return

    event.preventDefault()
    
    setCurrentMousePosition({ 
      x: event.clientX,
      y: event.clientY,
      lastY: currentMousePosition?.y
    })
    
    const dayWidth = getDayWidth(timelineWidth, totalDays)
    if (dayWidth === 0) return

    const deltaX = event.clientX - dragInfoRef.current.startX
    const dayDelta = Math.round(deltaX / dayWidth)

    setTasks((prevTasks: Task[]) => {
      const newTasks = [...prevTasks]
      const dragInfo = dragInfoRef.current
      
      if (!dragInfo?.taskIds) return newTasks

      dragInfo.taskIds.forEach(taskId => {
        const taskIndex = newTasks.findIndex(t => t.id === taskId)
        if (taskIndex === -1) return

        const originalPosition = dragInfo.originalPositions.find(p => p.id === taskId)
        if (!originalPosition) return

        const task = newTasks[taskIndex]
        const newStartDay = Math.max(0, originalPosition.startDay + dayDelta)
        
        const laneTasks = newTasks.filter(t => t.laneId === task.laneId)
        const overlappingTasks = laneTasks.filter(t => {
          if (t.id === taskId || dragInfoRef.current?.taskIds.includes(t.id)) return false
          const taskStart = newStartDay
          const taskEnd = newStartDay + task.duration
          const existingStart = t.startDay
          const existingEnd = t.startDay + t.duration
          return taskStart < existingEnd && taskEnd > existingStart
        }).sort((a, b) => (a.verticalPosition || 0) - (b.verticalPosition || 0))

        let verticalPosition = task.verticalPosition || 0
        
        if (overlappingTasks.length > 0) {
          const occupiedPositions = new Set(laneTasks
            .filter(t => t.id !== taskId && !dragInfoRef.current?.taskIds.includes(t.id))
            .map(t => t.verticalPosition || 0))
          
          let newPosition = 0
          while (occupiedPositions.has(newPosition)) {
            newPosition++
          }
          
          verticalPosition = newPosition
          
          if (!dragInfoRef.current!.snappedPositions) {
            dragInfoRef.current!.snappedPositions = {}
          }
          dragInfoRef.current!.snappedPositions[taskId] = verticalPosition
        }

        newTasks[taskIndex] = {
          ...task,
          startDay: newStartDay,
          verticalPosition
        }
      })

      return newTasks
    })
  }

  const handleTaskDragEnd = (event: MouseEvent, timelineWidth: number, totalDays: number) => {
    if (!dragInfoRef.current || !currentMousePosition) {
      return cleanupDragState()
    }

    const tasksToUpdate = dragInfoRef.current.taskIds
    
    setTasks((prevTasks: Task[]) => {
      const newTasks = [...prevTasks]
      tasksToUpdate.forEach(taskId => {
        const taskIndex = newTasks.findIndex(t => t.id === taskId)
        if (taskIndex === -1) return

        const task = newTasks[taskIndex]
        const originalPosition = dragInfoRef.current!.originalPositions.find(p => p.id === taskId)
        if (!originalPosition) return

        const deltaX = event.clientX - dragInfoRef.current!.startX
        const dayDelta = Math.round(deltaX / getDayWidth(timelineWidth, totalDays))
        const newStartDay = Math.max(0, originalPosition.startDay + dayDelta)

        const laneTasks = newTasks.filter(t => t.laneId === task.laneId)
        const currentVirtualLane = getTaskVirtualLane(taskId, laneTasks)

        newTasks[taskIndex] = {
          ...task,
          startDay: newStartDay,
          verticalPosition: currentVirtualLane
        }
      })
      return newTasks
    })

    cleanupDragState()
  }

  const cleanupDragState = () => {
    setDragInfo(null)
    dragInfoRef.current = null
    setCurrentMousePosition(null)
  }

  return {
    dragInfo,
    handleTaskDragStart
  }
}