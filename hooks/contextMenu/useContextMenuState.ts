import { useState } from "react"
import { ContextMenu } from "@/lib/types"

export interface ContextMenuState {
  contextMenu: ContextMenu
  openMenu: (x: number, y: number, taskId: string) => void
  closeMenu: () => void
}

export function useContextMenuState(): ContextMenuState {
  const [contextMenu, setContextMenu] = useState<ContextMenu>(null)

  const openMenu = (x: number, y: number, taskId: string) => {
    setContextMenu({
      isOpen: true,
      x,
      y,
      taskId,
    })
  }

  const closeMenu = () => {
    setContextMenu(null)
  }

  return {
    contextMenu,
    openMenu,
    closeMenu,
  }
}