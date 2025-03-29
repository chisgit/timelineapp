"use client"

import type React from "react"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Lane, Task } from "./timeline"

interface SwimLaneProps {
  lane: Lane
  children: React.ReactNode
  onToggleExpansion: () => void
  onAddTask: () => void
  tasks: Task[]
}

export function SwimLane({ lane, children, onToggleExpansion, onAddTask, tasks }: SwimLaneProps) {
  // Calculate the number of overlapping tasks to determine height
  const calculateLaneHeight = () => {
    const laneTasks = tasks.filter(t => t.laneId === lane.id)
    const virtualLanes: Task[][] = []

    laneTasks.forEach(task => {
      // Find a virtual lane where this task can fit
      let placed = false
      for (const vLane of virtualLanes) {
        const canFit = !vLane.some(existingTask => {
          const taskStart = task.startDay
          const taskEnd = task.startDay + task.duration
          const existingStart = existingTask.startDay
          const existingEnd = existingTask.startDay + existingTask.duration
          return taskStart < existingEnd && taskEnd > existingStart
        })

        if (canFit) {
          vLane.push(task)
          placed = true
          break
        }
      }

      // If task couldn't fit in any existing virtual lane, create a new one
      if (!placed) {
        virtualLanes.push([task])
      }
    })

    return virtualLanes.length
  }

  const virtualLaneCount = lane.isExpanded ? calculateLaneHeight() : 0
  const minHeight = Math.max(40, virtualLaneCount * 48) // 40px minimum, 48px per virtual lane

  return (
    <div className="flex border-b">
      <div className="w-48 min-w-48 border-r p-2 flex items-center justify-between bg-muted/10">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-5 w-5 mr-1" onClick={onToggleExpansion}>
            {lane.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <span className="font-medium">{lane.title}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddTask}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div 
        className="flex-1 relative" 
        style={{ 
          minHeight: `${minHeight}px`,
          transition: 'min-height 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  )
}

