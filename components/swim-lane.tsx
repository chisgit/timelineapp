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
  // Calculate the maximum virtual lane used in this swim lane
  const calculateLaneHeight = () => {
    const laneTasks = tasks.filter(t => t.laneId === lane.id);
    if (laneTasks.length === 0) return 1;

    // Find the highest virtual position in use
    const maxVirtualLane = Math.max(...laneTasks.map(t => t.verticalPosition || 0));
    return maxVirtualLane + 1; // Add 1 since we're 0-based
  };

  const virtualLaneCount = lane.isExpanded ? calculateLaneHeight() : 0;
  const minHeight = Math.max(40, virtualLaneCount * 48); // 40px minimum height, 48px per virtual lane

  return (
    <div className="flex border-b" data-lane-id={lane.id}>
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
  );
}

