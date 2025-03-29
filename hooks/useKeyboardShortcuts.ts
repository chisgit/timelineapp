import { useEffect } from "react"
import type { Lane, Task } from "@/lib/types"
import type { ContextMenu } from "@/lib/types"
import { createKeyboardHandler } from "./keyboard/keyboardHandlers"

type KeyboardShortcutsProps = {
  selectedTasks: string[]
  editingTaskId: string | null
  lanes: Lane[]
  tasks: Task[]
  deleteSelectedTasks: () => void
  setSelectedTasks: (tasks: string[]) => void
  setContextMenu: (contextMenu: ContextMenu) => void
}

export function useKeyboardShortcuts({
  selectedTasks,
  editingTaskId,
  lanes,
  tasks,
  deleteSelectedTasks,
  setSelectedTasks,
  setContextMenu,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = createKeyboardHandler(
      { selectedTasks, editingTaskId, lanes, tasks },
      { 
        deleteSelectedTasks,
        setSelectedTasks,
        clearContextMenu: () => setContextMenu(null)
      }
    )

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedTasks, editingTaskId, lanes, tasks, deleteSelectedTasks, setSelectedTasks, setContextMenu])
}