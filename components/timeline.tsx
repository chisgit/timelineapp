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
import { useTaskDrag } from "../hooks/useTaskDrag"
import TaskOverlapIndicator from "./task-overlap-indicator"
import { INITIAL_LANES, INITIAL_TASKS, INITIAL_MILESTONES } from "@/lib/constants"

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
    currentMousePosition,
    handleTaskClick,
    handleTaskDragStart,
    handleTaskDragEnd,
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
                  .map((task) => {
                    const virtualLanePosition = getTaskVirtualLane(task.id, tasks.filter(t => t.laneId === lane.id));
                    
                    // Only log debug info if the task is selected or being dragged
                    const shouldLogInfo = selectedTasks.includes(task.id) || dragInfo?.taskIds.includes(task.id);
                    
                    // Calculate if the task is being dragged
                    const isBeingDragged = dragInfo?.taskIds.includes(task.id) || false;
                    const isMovingVertically = isBeingDragged && dragInfo && currentMousePosition && 
                      Math.abs(dragInfo.startY - currentMousePosition.y) > 10; // 10px threshold for vertical movement
                    
                    // Calculate if this task overlaps with any other task in the same lane AND the same virtual lane position
                    const isOverlapping = !isMovingVertically && tasks.some(t => {
                      // Get the current virtual lane positions directly from tasks array
                      // This ensures we're always using the most up-to-date positions
                      const thisVirtualLane = task.verticalPosition ?? 0;
                      const otherVirtualLane = t.verticalPosition ?? 0;
                      
                      // Only check for overlaps if tasks are in the same swimlane and virtual lane
                      if (t.laneId !== task.laneId || 
                          t.id === task.id || 
                          thisVirtualLane !== otherVirtualLane) {
                        return false;
                      }

                      // More precise time-based overlap check
                      const taskStart = task.startDay;
                      const taskEnd = task.startDay + task.duration;
                      const otherStart = t.startDay;
                      const otherEnd = t.startDay + t.duration;
                      
                      // Two tasks overlap if one starts before the other ends
                      // AND the second starts before the first ends
                      const timeOverlap = taskStart < otherEnd && otherStart < taskEnd;

                      // Only log if this is the selected/dragged task or the task it overlaps with
                      if (shouldLogInfo || selectedTasks.includes(t.id) || dragInfo?.taskIds.includes(t.id)) {
                        console.log(`[DEBUG] Overlap Check - Task ${task.id} with ${t.id}: 
                          Same Lane: true, 
                          Task VL: ${thisVirtualLane}, 
                          Other VL: ${otherVirtualLane}, 
                          Time Range: ${taskStart}-${taskEnd} vs ${otherStart}-${otherEnd}, 
                          Time Overlap: ${timeOverlap}`);
                      }
                      
                      return timeOverlap;
                    });
                    
                    // Also check for potential overlaps during drag operations, but only within the same virtual lane
                    const hasPotentialOverlap = isBeingDragged && tasks.some(t => 
                      // Tasks must be in the same swimlane
                      t.laneId === task.laneId && 
                      // Not comparing with itself
                      t.id !== task.id &&
                      // Don't check against other tasks being dragged
                      !dragInfo?.taskIds.includes(t.id) &&
                      // Must be in the same virtual lane
                      (getTaskVirtualLane(t.id, tasks.filter(tt => tt.laneId === lane.id)) === virtualLanePosition) &&
                      // Tasks must actually overlap in time (one starts before the other ends)
                      t.startDay < (task.startDay + task.duration) &&
                      (t.startDay + t.duration) > task.startDay &&
                      // Ensure they're not just touching at the endpoints
                      !(t.startDay + t.duration === task.startDay || task.startDay + task.duration === t.startDay)
                    );

                    return (
                      <div key={task.id} className="relative" style={{
                        top: `${virtualLanePosition * 48}px`,
                        position: 'absolute',
                        width: '100%'
                      }}>
                        {/* Only show overlap indicator when tasks actually overlap and aren't just being manipulated */}
                        {((isOverlapping && !isBeingDragged) || hasPotentialOverlap) && (
                          <TaskOverlapIndicator
                            position={"above"}
                            isVisible={true}
                          />
                        )}
                        <TaskBar
                          task={task}
                          totalDays={totalDays}
                          isSelected={selectedTasks.includes(task.id)}
                          isEditing={editingTaskId === task.id}
                          isDragging={dragInfo?.taskIds.includes(task.id) || false}
                          style={{
                            top: '4px'
                          }}
                          onClick={(e) => handleTaskClick(task.id, e)}
                          onDragStart={(e) => handleTaskDragStart(task.id, e, timelineRef.current?.getBoundingClientRect().width || 0, totalDays)}
                          onContextMenu={(e) => handleTaskContextMenu(task.id, e, selectedTasks, setSelectedTasks)}
                          onRenameComplete={handleRenameComplete}
                        />
                      </div>
                    );
                  })}
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
