import { useState } from "react"
import { Task } from "@/lib/types"

export function useTaskSelection(tasks: Task[]) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

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

  return {
    selectedTasks,
    setSelectedTasks,
    editingTaskId,
    setEditingTaskId,
    handleTaskClick
  }
}