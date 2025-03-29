import { useState } from "react"
import { ContextMenu } from "@/lib/types"

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenu>(null)

  const handleTaskContextMenu = (taskId: string, event: React.MouseEvent, selectedTasks: string[], setSelectedTasks: (tasks: string[]) => void) => {
    event.preventDefault()

    if (!selectedTasks.includes(taskId)) {
      setSelectedTasks([taskId])
    }

    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      taskId,
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  return {
    contextMenu,
    handleTaskContextMenu,
    closeContextMenu,
  }
}