"use client"

import { useEffect, useRef } from "react"
import { Copy, Pencil, Trash } from "lucide-react"

interface TaskContextMenuProps {
  x: number
  y: number
  taskId: string
  selectedCount: number
  onClose: () => void
  onChangeColor: (taskId: string, color: string) => void
  onCopyTasks: () => void
  onDeleteTask: (taskId: string) => void
  onRenameTask: (taskId: string) => void
}

export function TaskContextMenu({
  x,
  y,
  taskId,
  selectedCount,
  onClose,
  onChangeColor,
  onCopyTasks,
  onDeleteTask,
  onRenameTask,
}: TaskContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Available colors
  const colors = [
    { name: "Blue", value: "bg-blue-500" },
    { name: "Green", value: "bg-green-500" },
    { name: "Red", value: "bg-red-500" },
    { name: "Purple", value: "bg-purple-500" },
    { name: "Yellow", value: "bg-yellow-500" },
    { name: "Indigo", value: "bg-indigo-500" },
    { name: "Pink", value: "bg-pink-500" },
    { name: "Gray", value: "bg-gray-500" },
  ]

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Adjust position if menu would go off screen
  let adjustedX = x
  let adjustedY = y

  if (menuRef.current) {
    const menuWidth = menuRef.current.offsetWidth
    const menuHeight = menuRef.current.offsetHeight

    if (x + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - 10
    }

    if (y + menuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - 10
    }
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 min-w-[180px] bg-popover text-popover-foreground rounded-md shadow-md border p-1"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="py-1 px-2 text-xs font-medium text-muted-foreground">
        {selectedCount > 1 ? `${selectedCount} Tasks Selected` : "Task Options"}
      </div>

      <div className="py-1 px-2 text-xs font-medium text-muted-foreground mt-1">
        Change Color {selectedCount > 1 ? `(All ${selectedCount})` : ""}
      </div>
      <div className="grid grid-cols-4 gap-1 p-1">
        {colors.map((color) => (
          <button
            key={color.value}
            className={`w-6 h-6 rounded-full ${color.value}`}
            title={color.name}
            onClick={() => onChangeColor(taskId, color.value)}
          />
        ))}
      </div>

      <div className="h-px bg-muted my-1" />

      <button
        className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
        onClick={onCopyTasks}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy {selectedCount > 1 ? `Tasks (${selectedCount})` : "Task"}
      </button>

      {selectedCount === 1 && (
        <button
          className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
          onClick={() => onRenameTask(taskId)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </button>
      )}

      <button
        className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm text-destructive hover:text-destructive"
        onClick={() => onDeleteTask(taskId)}
      >
        <Trash className="mr-2 h-4 w-4" />
        Delete {selectedCount > 1 ? `Tasks (${selectedCount})` : "Task"}
      </button>
    </div>
  )
}

