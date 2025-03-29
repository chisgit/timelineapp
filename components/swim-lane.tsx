"use client"

import type React from "react"

import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Lane } from "./timeline"

interface SwimLaneProps {
  lane: Lane
  children: React.ReactNode
  onToggleExpansion: () => void
  onAddTask: () => void
}

export function SwimLane({ lane, children, onToggleExpansion, onAddTask }: SwimLaneProps) {
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
      <div className="flex-1 relative min-h-[40px]">{children}</div>
    </div>
  )
}

