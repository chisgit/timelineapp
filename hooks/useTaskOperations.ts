import { Task } from "@/lib/types"
import { generateId } from "@/lib/utils"

export function useTaskOperations(
  tasks: Task[], 
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void, 
  selectedTasks: string[], 
  setSelectedTasks: (tasks: string[] | ((prev: string[]) => string[])) => void
) {
  const handleRenameTask = (taskId: string, newTitle: string) => {
    setTasks((prevTasks: Task[]) => prevTasks.map((task: Task) => 
      task.id === taskId ? { ...task, title: newTitle } : task
    ))
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
    setSelectedTasks((prev: string[]) => prev.filter((id: string) => !taskIds.includes(id)))
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
      setTasks((prevTasks: Task[]) => prevTasks.map((task: Task) => 
        selectedTaskIds.includes(task.id) ? { ...task, color } : task
      ))
    } else {
      setTasks((prevTasks: Task[]) => prevTasks.map((task: Task) => 
        task.id === taskId ? { ...task, color } : task
      ))
    }
  }

  return {
    handleRenameTask,
    deleteTasks,
    deleteSelectedTasks,
    addNewTask,
    copyTasks,
    changeTaskColor
  }
}