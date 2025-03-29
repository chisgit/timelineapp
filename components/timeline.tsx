"use client"

import { useRef } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskBar } from "@/components/task-bar"
import { Milestone } from "@/components/milestone"
import { DependencyLine } from "@/components/dependency-line"
import { TimelineHeader } from "@/components/timeline-header"
import { SwimLane } from "@/components/swim-lane"
import { TaskContextMenu } from "@/components/task-context-menu"
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts"
import { useTasks } from "../hooks/useTasks"
import { useLanes } from "../hooks/useLanes"
import { useMilestones } from "../hooks/useMilestones"
import { useContextMenu } from "../hooks/useContextMenu"

const INITIAL_LANES = [
  { id: "lane-1", title: "Design", isExpanded: true },
  { id: "lane-2", title: "Development", isExpanded: true },
  { id: "lane-3", title: "Testing", isExpanded: true },
]

const INITIAL_TASKS = [
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
]

const INITIAL_MILESTONES = [
  { id: "milestone-1", title: "Design Complete", day: 22 },
  { id: "milestone-2", title: "MVP Release", day: 42 },
]

export function Timeline() {
  const timelineRef = useRef<HTMLDivElement>(null)
  const totalDays = 60

  const { lanes, toggleLaneExpansion, addNewLane } = useLanes(INITIAL_LANES)
  const { milestones, addNewMilestone } = useMilestones(INITIAL_MILESTONES)
  const {
    tasks,
    selectedTasks,
    editingTaskId,
    dragInfo,
    handleTaskClick,
    handleTaskDragStart,
    handleRenameTask,
    handleRenameComplete,
    deleteTasks,
    deleteSelectedTasks,
    addNewTask,
    copyTasks,
    changeTaskColor,
    getTaskVirtualLane,
    setSelectedTasks,
  } = useTasks(INITIAL_TASKS)

  const { contextMenu, handleTaskContextMenu, closeContextMenu } = useContextMenu()

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    selectedTasks,
    editingTaskId,
    lanes,
    tasks,
    deleteSelectedTasks,
    setSelectedTasks,
    setContextMenu: closeContextMenu,
  })

  // Get width of a single day based on timeline width
  const getDayWidth = () => {
    if (!timelineRef.current) return 0
    return timelineRef.current.getBoundingClientRect().width / totalDays
  }

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
                      onDragStart={(e) => handleTaskDragStart(task.id, e, timelineRef.current?.getBoundingClientRect().width || 0, totalDays)}
                      onContextMenu={(e) => handleTaskContextMenu(task.id, e, selectedTasks, setSelectedTasks)}
                      onRenameComplete={handleRenameComplete}
                    />
                  ))}
            </SwimLane>
          ))}

          {tasks
            .flatMap((task) =>
              task.dependencies.map((depId) => {
                const sourceTask = tasks.find((t) => t.id === depId)
                if (!sourceTask) return null

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

          {milestones.map((milestone) => (
            <Milestone key={milestone.id} milestone={milestone} totalDays={totalDays} />
          ))}
        </div>
      </div>

      {contextMenu && contextMenu.isOpen && (
        <TaskContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          taskId={contextMenu.taskId}
          onClose={closeContextMenu}
          onChangeColor={(color) => changeTaskColor(contextMenu.taskId, color, selectedTasks)}
          onCopyTasks={() => copyTasks(selectedTasks.includes(contextMenu.taskId) ? selectedTasks : [contextMenu.taskId])}
          onDeleteTask={() => deleteTasks(selectedTasks.includes(contextMenu.taskId) ? selectedTasks : [contextMenu.taskId])}
          onRenameTask={handleRenameTask}
          selectedCount={selectedTasks.includes(contextMenu.taskId) ? selectedTasks.length : 1}
        />
      )}
    </div>
  )
}

