import React, { useState, useRef } from "react"
import { Task } from "@/lib/types"

export interface TaskBarProps {
  task: Task
  totalDays: number
  isSelected?: boolean
  isEditing?: boolean
  isDragging?: boolean
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent) => void
  onDragStart?: (e: React.MouseEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
  onRenameComplete?: (taskId: string, newTitle: string) => void
}

export function TaskBar({
  task,
  totalDays,
  isSelected = false,
  isEditing = false,
  isDragging = false,
  style = {},
  onClick,
  onDragStart,
  onContextMenu,
  onRenameComplete,
}: TaskBarProps) {
  const [title, setTitle] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const left = (task.startDay / totalDays) * 100
  const width = (task.duration / totalDays) * 100

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      e.preventDefault() // Prevent text selection
      if (onDragStart) onDragStart(e);
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onContextMenu) onContextMenu(e)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onRenameComplete) {
      onRenameComplete(task.id, title)
    } else if (e.key === "Escape" && onRenameComplete) {
      setTitle(task.title) // Reset to original title
      onRenameComplete(task.id, task.title)
    }
  }

  const handleBlur = () => {
    if (onRenameComplete) {
      onRenameComplete(task.id, title)
    }
  }

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  return (
    <div
      className={`absolute h-10 rounded-md flex items-center px-2 cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-blue-500" : ""
      } ${isDragging ? "opacity-70" : ""} ${task.color}`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        ...style,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      draggable={false}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="bg-transparent text-white w-full outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <div className="text-sm text-white font-medium truncate">{task.title}</div>
      )}
    </div>
  )
}

