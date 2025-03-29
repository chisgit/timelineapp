import { useState } from "react"
import { Task } from "@/lib/types"
import { useTaskSelection } from "./useTaskSelection"
import { useTaskDrag } from "./useTaskDrag"
import { useTaskOperations } from "./useTaskOperations"
import { getTaskVirtualLane } from "./taskUtils"

export function useTasks(initialTasks: Task[] = []) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  
  const {
    selectedTasks,
    setSelectedTasks,
    editingTaskId,
    setEditingTaskId,
    handleTaskClick
  } = useTaskSelection(tasks)

  const {
    dragInfo,
    handleTaskDragStart
  } = useTaskDrag(tasks, setTasks, selectedTasks)

  const {
    handleRenameTask: handleRenameTaskOperation,
    deleteTasks,
    deleteSelectedTasks,
    addNewTask,
    copyTasks,
    changeTaskColor
  } = useTaskOperations(tasks, setTasks, selectedTasks, setSelectedTasks)

  const handleRenameTask = (taskId: string) => {
    setEditingTaskId(taskId)
  }

  const handleRenameComplete = (taskId: string, newTitle: string) => {
    handleRenameTaskOperation(taskId, newTitle)
    setEditingTaskId(null)
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