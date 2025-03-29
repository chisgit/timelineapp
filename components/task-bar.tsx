"use client"

import type React from "react"

import type { Task } from "./timeline"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"

interface TaskBarProps {
  task: Task
  totalDays: number
  isSelected: boolean
  isEditing: boolean
  isDragging?: boolean
  onClick: (event: React.MouseEvent) => void
  onDragStart: (event: React.MouseEvent) => void
  onContextMenu: (event: React.MouseEvent) => void
  onRenameComplete: (taskId: string, newTitle: string) => void
}

export function TaskBar({
  task,
  totalDays,
  isSelected,
  isEditing,
  isDragging = false,
  onClick,
  onDragStart,
  onContextMenu,
  onRenameComplete,
}: TaskBarProps) {
  const [editTitle, setEditTitle] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)

  // Calculate position and width based on timeline
  const dayWidth = 100 / totalDays
  const left = `${task.startDay * dayWidth}%`
  const width = `${task.duration * dayWidth}%`

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Handle saving the new title
  const handleRenameComplete = () => {
    onRenameComplete(task.id, editTitle)
  }

  // Handle key press events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameComplete()
    } else if (e.key === "Escape") {
      setEditTitle(task.title) // Reset to original
      handleRenameComplete()
    }

    // Prevent event propagation to avoid triggering other handlers
    e.stopPropagation()
  }

  return (
    <div
      className={`absolute top-1 bottom-1 rounded-md ${task.color} ${
        isSelected ? "ring-2 ring-primary ring-offset-1" : ""
      } ${isDragging ? "opacity-80 shadow-lg scale-105 z-10" : ""} 
      cursor-move flex items-center px-2 overflow-hidden text-white text-sm shadow-md 
      select-none touch-none`}
      style={{ 
        left, 
        width,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: isEditing ? 'text' : 'move'
      }}
      onClick={(e) => {
        console.log('TaskBar: onClick', { taskId: task.id });
        onClick(e);
      }}
      onMouseDown={(e) => {
        console.log('TaskBar: onMouseDown', { 
          taskId: task.id, 
          isEditing,
          button: e.button,
          clientX: e.clientX,
          clientY: e.clientY
        });
        if (!isEditing) {
          e.preventDefault();
          e.stopPropagation();
          onDragStart(e);
        }
      }}
      onContextMenu={(e) => {
        console.log('TaskBar: onContextMenu', { taskId: task.id });
        onContextMenu(e);
      }}
    >
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRenameComplete}
          onKeyDown={handleKeyDown}
          className="h-6 w-full bg-transparent border-none text-white placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate">{task.title}</span>
      )}
    </div>
  )
}

