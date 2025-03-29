import { useCallback, useEffect } from "react"
import type { ContextMenuState } from "./useContextMenuState"

interface UseContextMenuHandlersProps {
  menuRef: React.RefObject<HTMLElement | null>
  state: ContextMenuState
  onTaskSelect: (taskId: string) => void
}

export function useContextMenuHandlers({
  menuRef,
  state: { closeMenu },
  onTaskSelect
}: UseContextMenuHandlersProps) {
  const handleTaskContextMenu = useCallback((
    taskId: string, 
    event: React.MouseEvent,
    selectedTasks: string[],
    setSelectedTasks: (tasks: string[]) => void
  ) => {
    event.preventDefault()

    if (!selectedTasks.includes(taskId)) {
      setSelectedTasks([taskId])
    }

    onTaskSelect(taskId)
  }, [onTaskSelect])

  // Handle clicking outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [closeMenu, menuRef])

  return {
    handleTaskContextMenu
  }
}