"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskBar } from "@/components/task-bar"
import { Milestone } from "@/components/milestone"
import { DependencyLine } from "@/components/dependency-line"
import { TimelineHeader } from "@/components/timeline-header"
import { SwimLane } from "@/components/swim-lane"
import { TaskContextMenu } from "@/components/task-context-menu"
import { generateId } from "@/lib/utils"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export type Task = {
  id: string
  title: string
  startDay: number
  duration: number
  color: string
  laneId: string
  dependencies: string[]
  verticalPosition?: number
}

export type Lane = {
  id: string
  title: string
  isExpanded: boolean
}

export type TimelineMilestone = {
  id: string
  title: string
  day: number
}

export function Timeline() {
  const [lanes, setLanes] = useState<Lane[]>([
    { id: "lane-1", title: "Design", isExpanded: true },
    { id: "lane-2", title: "Development", isExpanded: true },
    { id: "lane-3", title: "Testing", isExpanded: true },
  ])

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "task-1",
      title: "Research",
      startDay: 0,
      duration: 5,
      color: "bg-blue-500",
      laneId: "lane-1",
      dependencies: [],
    },
    {
      id: "task-2",
      title: "Wireframes",
      startDay: 5,
      duration: 7,
      color: "bg-blue-500",
      laneId: "lane-1",
      dependencies: ["task-1"],
    },
    {
      id: "task-3",
      title: "UI Design",
      startDay: 12,
      duration: 10,
      color: "bg-blue-500",
      laneId: "lane-1",
      dependencies: ["task-2"],
    },
    {
      id: "task-4",
      title: "Frontend Setup",
      startDay: 8,
      duration: 6,
      color: "bg-green-500",
      laneId: "lane-2",
      dependencies: ["task-2"],
    },
    {
      id: "task-5",
      title: "Backend API",
      startDay: 14,
      duration: 12,
      color: "bg-green-500",
      laneId: "lane-2",
      dependencies: ["task-4"],
    },
    {
      id: "task-6",
      title: "Integration",
      startDay: 26,
      duration: 8,
      color: "bg-green-500",
      laneId: "lane-2",
      dependencies: ["task-5", "task-3"],
    },
    {
      id: "task-7",
      title: "Unit Tests",
      startDay: 20,
      duration: 10,
      color: "bg-purple-500",
      laneId: "lane-3",
      dependencies: [],
    },
    {
      id: "task-8",
      title: "QA Testing",
      startDay: 34,
      duration: 8,
      color: "bg-purple-500",
      laneId: "lane-3",
      dependencies: ["task-6", "task-7"],
    },
  ])

  const [milestones, setMilestones] = useState<TimelineMilestone[]>([
    { id: "milestone-1", title: "Design Complete", day: 22 },
    { id: "milestone-2", title: "MVP Release", day: 42 },
  ])

  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [dragInfo, setDragInfo] = useState<{
    isDragging: boolean;
    taskIds: string[];
    startX: number;
    originalPositions: Array<{ id: string; startDay: number }>;
    snappedPositions?: Record<string, number>; // Track snapped vertical positions
  } | null>(null)

  // Add mouse position tracking state
  const [currentMousePosition, setCurrentMousePosition] = useState<{ 
    x: number;
    y: number;
    lastY?: number;
  } | null>(null)

  // Add ref to track current drag state
  const dragInfoRef = useRef<typeof dragInfo>(null)

  const timelineRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    x: number
    y: number
    taskId: string
  } | null>(null)

  // Add state for tracking which task is being edited
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  // Number of days to display in the timeline
  const totalDays = 60

  // Calculate day width based on timeline width
  const getDayWidth = () => {
    if (!timelineRef.current) return 0
    const width = timelineRef.current.getBoundingClientRect().width
    return width / totalDays
  }

  // Handle click on task (for selection)
  const handleTaskClick = (taskId: string, event: React.MouseEvent) => {
    if (editingTaskId) return

    if (event.shiftKey) {
      // Find the last selected task in the same lane
      const clickedTask = tasks.find(t => t.id === taskId)
      if (!clickedTask) return

      const lastSelectedId = selectedTasks[selectedTasks.length - 1]
      const laneTasks = tasks.filter(t => t.laneId === clickedTask.laneId)

      if (lastSelectedId) {
        // Range selection
        const lastSelectedIndex = laneTasks.findIndex(t => t.id === lastSelectedId)
        const currentIndex = laneTasks.findIndex(t => t.id === taskId)

        if (lastSelectedIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastSelectedIndex, currentIndex)
          const end = Math.max(lastSelectedIndex, currentIndex)
          const tasksInRange = laneTasks.slice(start, end + 1).map(t => t.id)
          
          setSelectedTasks(prev => [...new Set([...prev, ...tasksInRange])])
        }
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      setSelectedTasks(prev => 
        prev.includes(taskId) 
          ? prev.filter(id => id !== taskId)
          : [...prev, taskId]
      )
    } else {
      // Single select
      setSelectedTasks([taskId])
    }
  }

  // Start task dragging
  const handleTaskDragStart = (taskId: string, event: React.MouseEvent) => {
    console.log('Timeline: handleTaskDragStart', {
      taskId,
      editingTaskId,
      clientX: event.clientX,
      selectedTasks
    });

    // If we're editing, don't start dragging
    if (editingTaskId) return

    // Prevent default browser drag behavior
    event.preventDefault()

    // Determine which tasks to drag (selected tasks or just this one)
    const tasksToDrag = selectedTasks.includes(taskId) ? selectedTasks : [taskId]

    // Store original positions for all tasks being dragged
    const originalPositions = tasksToDrag.map((id) => {
      const task = tasks.find((t) => t.id === id)
      return { id, startDay: task?.startDay || 0 }
    })

    const dragInfoValue = {
      isDragging: true,
      taskIds: tasksToDrag,
      startX: event.clientX,
      originalPositions,
    }
    
    console.log('Timeline: setting dragInfo', dragInfoValue);
    
    // Update both state and ref
    setDragInfo(dragInfoValue)
    dragInfoRef.current = dragInfoValue

    // Add event listeners for drag move and end
    document.addEventListener("mousemove", handleTaskDragMove)
    document.addEventListener("mouseup", handleTaskDragEnd)
  }

  // Handle task dragging
  const handleTaskDragMove = (event: MouseEvent) => {
    if (!dragInfoRef.current || !timelineRef.current || !dragInfoRef.current.isDragging) return

    event.preventDefault()
    
    setCurrentMousePosition({ 
      x: event.clientX,
      y: event.clientY,
      lastY: currentMousePosition?.y
    })
    
    const dayWidth = getDayWidth()
    if (dayWidth === 0) return

    const deltaX = event.clientX - dragInfoRef.current.startX
    const dayDelta = Math.round(deltaX / dayWidth)

    // Update task positions
    setTasks(prevTasks => {
      const newTasks = [...prevTasks]

      dragInfoRef.current!.taskIds.forEach(taskId => {
        const taskIndex = newTasks.findIndex(t => t.id === taskId)
        if (taskIndex === -1) return

        const originalPosition = dragInfoRef.current!.originalPositions.find(p => p.id === taskId)
        if (!originalPosition) return

        const task = newTasks[taskIndex]
        const newStartDay = Math.max(0, originalPosition.startDay + dayDelta)
        
        // Only get tasks from the same swim lane
        const laneTasks = newTasks.filter(t => t.laneId === task.laneId)
        const overlappingTasks = laneTasks.filter(t => {
          if (t.id === taskId || dragInfoRef.current?.taskIds.includes(t.id)) return false
          const taskStart = newStartDay
          const taskEnd = newStartDay + task.duration
          const existingStart = t.startDay
          const existingEnd = t.startDay + t.duration
          return taskStart < existingEnd && taskEnd > existingStart
        }).sort((a, b) => (a.verticalPosition || 0) - (b.verticalPosition || 0))

        let verticalPosition = task.verticalPosition || 0
        
        if (overlappingTasks.length > 0) {
          // Find all occupied positions in this lane
          const occupiedPositions = new Set(laneTasks
            .filter(t => t.id !== taskId && !dragInfoRef.current?.taskIds.includes(t.id))
            .map(t => t.verticalPosition || 0))
          
          // Find the first available position
          let newPosition = 0
          while (occupiedPositions.has(newPosition)) {
            newPosition++
          }
          
          verticalPosition = newPosition
          
          // Store the snapped position
          if (!dragInfoRef.current!.snappedPositions) {
            dragInfoRef.current!.snappedPositions = {}
          }
          dragInfoRef.current!.snappedPositions[taskId] = verticalPosition
        }

        // Update task with new position
        newTasks[taskIndex] = {
          ...task,
          startDay: newStartDay,
          verticalPosition
        }
      })

      return newTasks
    })
  }

  // End task dragging
  const handleTaskDragEnd = (event: MouseEvent) => {
    if (!dragInfoRef.current || !currentMousePosition) {
      return cleanupDragState();
    }

    const tasksToUpdate = dragInfoRef.current.taskIds;
    
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      tasksToUpdate.forEach(taskId => {
        const taskIndex = newTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const task = newTasks[taskIndex];
        const originalPosition = dragInfoRef.current!.originalPositions.find(p => p.id === taskId);
        if (!originalPosition) return;

        // Calculate final horizontal position
        const deltaX = event.clientX - dragInfoRef.current!.startX;
        const dayDelta = Math.round(deltaX / getDayWidth());
        const newStartDay = Math.max(0, originalPosition.startDay + dayDelta);

        // Get the current virtual lane position that the task is in during drag
        const laneTasks = newTasks.filter(t => t.laneId === task.laneId);
        const currentVirtualLane = getTaskVirtualLane(taskId, laneTasks);

        // Update the task with both its new horizontal position and preserve its current virtual lane
        newTasks[taskIndex] = {
          ...task,
          startDay: newStartDay,
          verticalPosition: currentVirtualLane
        };
      });
      return newTasks;
    });

    cleanupDragState();
  }

  // Helper to clean up drag state
  const cleanupDragState = () => {
    document.removeEventListener("mousemove", handleTaskDragMove);
    document.removeEventListener("mouseup", handleTaskDragEnd);
    setDragInfo(null);
    dragInfoRef.current = null;
    setCurrentMousePosition(null);
  }

  // Handle right-click on task for context menu
  const handleTaskContextMenu = (taskId: string, event: React.MouseEvent) => {
    event.preventDefault()

    // If not already selected, select just this task
    if (!selectedTasks.includes(taskId)) {
      setSelectedTasks([taskId])
    }

    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      taskId,
    })
  }

  // Close context menu
  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  // Change task color
  const handleChangeTaskColor = (taskId: string, color: string) => {
    // If the task is part of the selection, change color for all selected tasks
    if (selectedTasks.includes(taskId)) {
      setTasks((prevTasks) => prevTasks.map((task) => (selectedTasks.includes(task.id) ? { ...task, color } : task)))
    } else {
      // Otherwise just change this one task
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, color } : task)))
    }
    setContextMenu(null)
  }

  // Copy selected task(s)
  const handleCopyTasks = () => {
    if (!contextMenu) return

    const tasksToCopy = selectedTasks.includes(contextMenu.taskId) ? selectedTasks : [contextMenu.taskId]

    const newTasks = [...tasks]

    tasksToCopy.forEach((taskId) => {
      const originalTask = tasks.find((t) => t.id === taskId)
      if (originalTask) {
        const newTaskId = generateId()
        newTasks.push({
          ...originalTask,
          id: newTaskId,
          title: `${originalTask.title} (Copy)`,
          startDay: originalTask.startDay + 2,
          dependencies: [],
        })
      }
    })

    setTasks(newTasks)
    setContextMenu(null)
  }

  // Toggle lane expansion
  const toggleLaneExpansion = (laneId: string) => {
    setLanes((prevLanes) =>
      prevLanes.map((lane) => (lane.id === laneId ? { ...lane, isExpanded: !lane.isExpanded } : lane)),
    )
  }

  // Add a new lane
  const addNewLane = () => {
    const newLaneId = `lane-${lanes.length + 1}`
    setLanes([
      ...lanes,
      {
        id: newLaneId,
        title: `New Lane ${lanes.length + 1}`,
        isExpanded: true,
      },
    ])
  }

  // Add a new task to a lane
  const addNewTask = (laneId: string) => {
    const newTaskId = `task-${tasks.length + 1}`
    setTasks([
      ...tasks,
      {
        id: newTaskId,
        title: "New Task",
        startDay: 0,
        duration: 5,
        color: "bg-gray-500",
        laneId,
        dependencies: [],
      },
    ])
  }

  // Add a new milestone
  const addNewMilestone = () => {
    const newMilestoneId = `milestone-${milestones.length + 1}`
    setMilestones([
      ...milestones,
      {
        id: newMilestoneId,
        title: "New Milestone",
        day: 30,
      },
    ])
  }

  // Add handlers for renaming and deleting tasks
  const handleRenameTask = (taskId: string) => {
    setEditingTaskId(taskId)
    setContextMenu(null)
  }

  const handleRenameComplete = (taskId: string, newTitle: string) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, title: newTitle } : task)))
    setEditingTaskId(null)
  }

  const handleDeleteTask = (taskId: string) => {
    // If the task is part of the selection, delete all selected tasks
    if (selectedTasks.includes(taskId)) {
      deleteSelectedTasks()
    } else {
      // Otherwise just delete this one task
      deleteTasks([taskId])
    }
    setContextMenu(null)
  }

  // Helper function to delete multiple tasks
  const deleteTasks = (taskIds: string[]) => {
    // Create a copy of tasks to modify
    let updatedTasks = [...tasks]

    // Process each task to delete
    taskIds.forEach((taskId) => {
      // Remove dependencies to this task
      updatedTasks = updatedTasks.map((task) => {
        if (task.dependencies.includes(taskId)) {
          return {
            ...task,
            dependencies: task.dependencies.filter((id) => id !== taskId),
          }
        }
        return task
      })

      // Remove the task itself
      updatedTasks = updatedTasks.filter((task) => task.id !== taskId)
    })

    setTasks(updatedTasks)

    // Update selected tasks if needed
    setSelectedTasks((prev) => prev.filter((id) => !taskIds.includes(id)))
  }

  // Delete all selected tasks
  const deleteSelectedTasks = () => {
    if (selectedTasks.length === 0) return
    deleteTasks(selectedTasks)
  }

  // Remove: existing useEffect for keyboard shortcuts
  // Add call to our new custom hook here:
  useKeyboardShortcuts({
    selectedTasks,
    editingTaskId,
    lanes,
    tasks,
    deleteSelectedTasks,
    setSelectedTasks,
    setContextMenu,
  })

  const getTaskVirtualLane = (taskId: string, laneTasks: Task[]): number => {
    const task = laneTasks.find(t => t.id === taskId);
    return task?.verticalPosition ?? 0;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <Button onClick={addNewLane} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Lane
          </Button>
          <Button onClick={addNewMilestone} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Milestone
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedTasks([])}
            disabled={selectedTasks.length === 0}
          >
            Clear Selection
          </Button>
          {selectedTasks.length > 0 && (
            <Button size="sm" variant="destructive" onClick={deleteSelectedTasks}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete {selectedTasks.length > 1 ? `(${selectedTasks.length})` : ""}
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <TimelineHeader totalDays={totalDays} />
        <div ref={timelineRef} className="relative">
          {lanes.map((lane) => (
            <SwimLane
              key={lane.id}
              lane={lane}
              tasks={tasks}
              onToggleExpansion={() => toggleLaneExpansion(lane.id)}
              onAddTask={() => addNewTask(lane.id)}
            >
              {lane.isExpanded &&
                tasks
                  .filter((task) => task.laneId === lane.id)
                  .map((task) => (
                    <TaskBar
                      key={task.id}
                      task={task}
                      totalDays={totalDays}
                      isSelected={selectedTasks.includes(task.id)}
                      isEditing={editingTaskId === task.id}
                      isDragging={dragInfo?.taskIds.includes(task.id) || false}
                      style={{
                        top: `${getTaskVirtualLane(task.id, tasks.filter(t => t.laneId === lane.id)) * 48 + 4}px`
                      }}
                      onClick={(e) => handleTaskClick(task.id, e)}
                      onDragStart={(e) => handleTaskDragStart(task.id, e)}
                      onContextMenu={(e) => handleTaskContextMenu(task.id, e)}
                      onRenameComplete={handleRenameComplete}
                    />
                  ))}
            </SwimLane>
          ))}

          {/* Render dependency lines */}
          {tasks
            .flatMap((task) =>
              task.dependencies.map((depId) => {
                const sourceTask = tasks.find((t) => t.id === depId)
                if (!sourceTask) return null

                // Only render if both tasks' lanes are expanded
                const sourceLane = lanes.find((l) => l.id === sourceTask.laneId)
                const targetLane = lanes.find((l) => l.id === task.laneId)

                if (!sourceLane?.isExpanded || !targetLane?.isExpanded) return null

                return (
                  <DependencyLine
                    key={`${depId}-${task.id}`}
                    sourceTask={sourceTask}
                    targetTask={task}
                    totalDays={totalDays}
                    lanes={lanes}
                  />
                )
              })
            )
            .filter(Boolean)}

          {/* Render milestones */}
          {milestones.map((milestone) => (
            <Milestone key={milestone.id} milestone={milestone} totalDays={totalDays} />
          ))}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && contextMenu.isOpen && (
        <TaskContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          taskId={contextMenu.taskId}
          onClose={handleCloseContextMenu}
          onChangeColor={handleChangeTaskColor}
          onCopyTasks={handleCopyTasks}
          onDeleteTask={handleDeleteTask}
          onRenameTask={handleRenameTask}
          selectedCount={selectedTasks.includes(contextMenu.taskId) ? selectedTasks.length : 1}
        />
      )}
    </div>
  )
}

