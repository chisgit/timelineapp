import { useState, useRef } from "react"
import { Task, DragInfo, MousePosition } from "@/lib/types"
import { generateId } from "@/lib/utils"

export function useTasks(initialTasks: Task[] = []) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [dragInfo, setDragInfo] = useState<DragInfo>(null)
  const [currentMousePosition, setCurrentMousePosition] = useState<MousePosition>(null)
  const dragInfoRef = useRef<DragInfo>(null)

  const handleTaskClick = (taskId: string, event: React.MouseEvent) => {
    if (editingTaskId) return

    if (event.shiftKey) {
      const clickedTask = tasks.find(t => t.id === taskId)
      if (!clickedTask) return

      const lastSelectedId = selectedTasks[selectedTasks.length - 1]
      const laneTasks = tasks.filter(t => t.laneId === clickedTask.laneId)

      if (lastSelectedId) {
        const lastSelectedIndex = laneTasks.findIndex(t => t.id === lastSelectedId)
        const currentIndex = laneTasks.findIndex(t => t.id === taskId)

        if (lastSelectedIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastSelectedIndex, currentIndex)
          const end = Math.max(lastSelectedIndex, currentIndex)
          const tasksInRange = laneTasks.slice(start, end + 1).map(t => t.id)
          
          setSelectedTasks(prev => [...new Set([...prev, ...tasksInRange])])
        }
      }
    } else if (event.ctrlKey || event.metaKey) {
      setSelectedTasks(prev => 
        prev.includes(taskId) 
          ? prev.filter(id => id !== taskId)
          : [...prev, taskId]
      )
    } else {
      setSelectedTasks([taskId])
    }
  }

  const getDayWidth = (timelineWidth: number, totalDays: number) => {
    return timelineWidth / totalDays
  }

  const handleTaskDragStart = (taskId: string, event: React.MouseEvent, timelineWidth: number, totalDays: number) => {
    if (editingTaskId) return
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

    setTasks(prevTasks => {
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
    
    setTasks(prevTasks => {
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

  const handleRenameTask = (taskId: string) => {
    setEditingTaskId(taskId)
  }

  const handleRenameComplete = (taskId: string, newTitle: string) => {
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, title: newTitle } : task
    ))
    setEditingTaskId(null)
  }

  const deleteTasks = (taskIds: string[]) => {
    let updatedTasks = [...tasks]

    taskIds.forEach((taskId) => {
      updatedTasks = updatedTasks.map((task) => ({
        ...task,
        dependencies: task.dependencies.filter((id) => id !== taskId),
      }))

      updatedTasks = updatedTasks.filter((task) => task.id !== taskId)
    })

    setTasks(updatedTasks)
    setSelectedTasks((prev) => prev.filter((id) => !taskIds.includes(id)))
  }

  const deleteSelectedTasks = () => {
    if (selectedTasks.length === 0) return
    deleteTasks(selectedTasks)
  }

  const addNewTask = (laneId: string) => {
    const newTaskId = `task-${tasks.length + 1}`
    setTasks([
      ...tasks,
      {
        id: newTaskId,
        title: "New Task",
        startDay: 0,
        duration: 5,
        color: "bg-gray-500",
        laneId,
        dependencies: [],
      },
    ])
  }

  const copyTasks = (taskIds: string[]) => {
    const newTasks = [...tasks]

    taskIds.forEach((taskId) => {
      const originalTask = tasks.find((t) => t.id === taskId)
      if (originalTask) {
        const newTaskId = generateId()
        newTasks.push({
          ...originalTask,
          id: newTaskId,
          title: `${originalTask.title} (Copy)`,
          startDay: originalTask.startDay + 2,
          dependencies: [],
        })
      }
    })

    setTasks(newTasks)
  }

  const changeTaskColor = (taskId: string, color: string, selectedTaskIds: string[]) => {
    if (selectedTaskIds.includes(taskId)) {
      setTasks(prevTasks => prevTasks.map(task => 
        selectedTaskIds.includes(task.id) ? { ...task, color } : task
      ))
    } else {
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, color } : task
      ))
    }
  }

  const getTaskVirtualLane = (taskId: string, laneTasks: Task[]): number => {
    const task = laneTasks.find(t => t.id === taskId)
    return task?.verticalPosition ?? 0
  }

  return {
    tasks,
    selectedTasks,
    editingTaskId,
    dragInfo,
    handleTaskClick,
    handleTaskDragStart,
    handleRenameTask,
    handleRenameComplete,
    deleteTasks,
    deleteSelectedTasks,
    addNewTask,
    copyTasks,
    changeTaskColor,
    getTaskVirtualLane,
    setSelectedTasks,
  }
}