import { useRef } from "react"
import type { ContextMenuState } from "./contextMenu/useContextMenuState"
import { useContextMenuState } from "./contextMenu/useContextMenuState"
import { useContextMenuHandlers } from "./contextMenu/useContextMenuHandlers"
import { adjustMenuPosition } from "./contextMenu/contextMenuUtils"

export function useContextMenu() {
  const menuRef = useRef<HTMLDivElement>(null)
  const contextMenuState = useContextMenuState()
  const { contextMenu, openMenu, closeMenu } = contextMenuState

  const { handleTaskContextMenu } = useContextMenuHandlers({
    menuRef,
    state: contextMenuState,
    onTaskSelect: (taskId: string) => {
      const position = { x: contextMenu?.x || 0, y: contextMenu?.y || 0 }
      const adjustedPosition = adjustMenuPosition<HTMLDivElement>(position, menuRef)
      openMenu(adjustedPosition.x, adjustedPosition.y, taskId)
    }
  })

  return {
    menuRef,
    contextMenu,
    handleTaskContextMenu,
    closeContextMenu: closeMenu
  }
}