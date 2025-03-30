import { useState, useRef } from "react";
import { Task, DragInfo, MousePosition } from "@/lib/types";
import { getDayWidth, getTaskVirtualLane } from "./taskUtils";
import { getOverlappingTasks, createNewVirtualLane } from "./taskUtils";

export function useTaskDrag(
  tasks: Task[],
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void,
  selectedTasks: string[]
) {
  const [dragInfo, setDragInfo] = useState<DragInfo>(null);
  const [currentMousePosition, setCurrentMousePosition] = useState<MousePosition>(null);
  const dragInfoRef = useRef<DragInfo>(null);

  const handleTaskDragStart = (
    taskId: string,
    event: React.MouseEvent,
    timelineWidth: number,
    totalDays: number
  ) => {
    event.preventDefault();

    const tasksToDrag = selectedTasks.includes(taskId) ? selectedTasks : [taskId];
    const dragInfoValue = {
      isDragging: true,
      taskIds: tasksToDrag,
      startX: event.clientX,
      startY: event.clientY,
      originalPositions: tasksToDrag.map((id) => {
        const task = tasks.find((t) => t.id === id);
        return {
          id,
          startDay: task?.startDay || 0,
          verticalPosition: task?.verticalPosition || 0,
        };
      }),
    };

    // Set current mouse position at start
    setCurrentMousePosition({
      x: event.clientX,
      y: event.clientY,
      lastY: event.clientY
    });

    setDragInfo(dragInfoValue);
    dragInfoRef.current = dragInfoValue;
    
    console.log("[DEBUG] Drag started:", dragInfoValue);

    const handleMove = (e: MouseEvent) => handleTaskDragMove(e, timelineWidth, totalDays);
    const handleEnd = (e: MouseEvent) => {
      console.log("[DEBUG] Mouse up event triggered");
      handleTaskDragEnd(e, timelineWidth, totalDays);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
  };

  const handleTaskDragMove = (event: MouseEvent, timelineWidth: number, totalDays: number) => {
    if (!dragInfoRef.current?.isDragging) return;

    event.preventDefault();

    setCurrentMousePosition({
      x: event.clientX,
      y: event.clientY,
      lastY: currentMousePosition?.y,
    });

    const dayWidth = getDayWidth(timelineWidth, totalDays);
    if (dayWidth === 0) return;

    const deltaX = event.clientX - dragInfoRef.current.startX;
    const deltaY = event.clientY - dragInfoRef.current.startY;
    const dayDelta = Math.round(deltaX / dayWidth);
    const verticalDelta = Math.round(deltaY / 48); // Assuming 48px per virtual lane

    setTasks((prevTasks: Task[]) => {
      const newTasks = [...prevTasks];
      const dragInfo = dragInfoRef.current;

      if (!dragInfo?.taskIds) return newTasks;

      dragInfo.taskIds.forEach((taskId) => {
        const taskIndex = newTasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) return;

        const originalPosition = dragInfo.originalPositions.find((p) => p.id === taskId);
        if (!originalPosition) return;

        const task = newTasks[taskIndex];
        const newStartDay = Math.max(0, originalPosition.startDay + dayDelta);
        const newVerticalPosition = Math.max(0, originalPosition.verticalPosition + verticalDelta);

        // Only check for overlaps when we're in the same vertical position
        // or when we're actually moving horizontally (changing the task's time)
        if (newVerticalPosition === task.verticalPosition) {
          // Detect overlapping tasks only when we're not changing vertical position
          const overlappingTasks = getOverlappingTasks(newTasks, task, newStartDay, newVerticalPosition);
          if (overlappingTasks.length > 0) {
            // Handle horizontal overlaps as before
            // Note: We don't actually create new virtual lanes during drag move
            // That only happens on drag end
          }
        }

        // Update the task position regardless of overlap
        newTasks[taskIndex] = {
          ...task,
          startDay: newStartDay,
          verticalPosition: newVerticalPosition,
        };
      });

      return newTasks;
    });
  };

  const handleTaskDragEnd = (event: MouseEvent, timelineWidth: number, totalDays: number) => {
    try {
      console.log("[DEBUG] handleTaskDragEnd called with dragInfoRef:", dragInfoRef.current);
      
      if (!dragInfoRef.current) {
        console.log("[DEBUG] No drag info available, cleaning up");
        return cleanupDragState();
      }

      // Handle the creation of a new virtual lane for overlapping tasks on mouse release
      const dragInfo = dragInfoRef.current;
      const dayWidth = getDayWidth(timelineWidth, totalDays);
      
      // Only log drag info for brevity
      console.log("[DEBUG] handleTaskDragEnd - Processing tasks:", dragInfo.taskIds);
      
      if (dayWidth > 0 && dragInfo.taskIds.length > 0) {
        setTasks((prevTasks: Task[]) => {
          try {
            const newTasks = [...prevTasks];
            const relevantLaneIds = new Set<string>();
            
            // First identify relevant lanes (those containing dragged tasks)
            dragInfo.taskIds.forEach(taskId => {
              const task = prevTasks.find(t => t.id === taskId);
              if (task) {
                relevantLaneIds.add(task.laneId);
              }
            });
            
            // Process each dragged task only once
            for (const taskId of dragInfo.taskIds) {
              const taskIndex = newTasks.findIndex(t => t.id === taskId);
              if (taskIndex === -1) {
                continue;
              }
              
              const task = {...newTasks[taskIndex]};
              
              // Get tasks in the same lane
              const laneTasks = newTasks.filter(t => t.laneId === task.laneId);
              console.log(`[DEBUG] Task ${task.id} (${task.title}) in lane ${task.laneId}, Virtual Lane: ${task.verticalPosition}`);
              
              // Check if task moved to a new vertical lane
              const originalPosition = dragInfo.originalPositions.find(p => p.id === taskId);
              
              if (originalPosition) {
                console.log(`[DEBUG] Task ${task.id} moved from VL:${originalPosition.verticalPosition} to VL:${task.verticalPosition}`);
              }
              
              // Find tasks that overlap with this task in its CURRENT virtual lane ONLY
              const overlappingTasks = laneTasks.filter(t => {
                // Skip self-comparison and tasks in different virtual lanes
                if (t.id === task.id || (t.verticalPosition ?? 0) !== (task.verticalPosition ?? 0)) {
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

                // Only log detailed information for tasks that actually overlap
                if (timeOverlap) {
                  console.log(`[DEBUG] Overlap Found - Task ${task.id} with ${t.id}:
                    Virtual Lane: ${task.verticalPosition},
                    Time Range: ${taskStart}-${taskEnd} overlaps with ${otherStart}-${otherEnd}`);
                } else if (Math.abs(taskStart - otherEnd) <= 1 || Math.abs(otherStart - taskEnd) <= 1) {
                  // If they're just touching (off by 1 or less), log this for debugging
                  console.log(`[DEBUG] Tasks almost touching but not overlapping - Task ${task.id} with ${t.id}:
                    Virtual Lane: ${task.verticalPosition},
                    Time Range: ${taskStart}-${taskEnd} vs ${otherStart}-${otherEnd}`);
                }

                return timeOverlap;
              });
              
              if (overlappingTasks.length > 0) {
                console.log(`[DEBUG] Creating new virtual lane for task ${task.id} at position ${task.verticalPosition}`);
                
                // Shift down any existing tasks that are at or below the new position
                const tasksToShift = new Set<string>();
                
                laneTasks.forEach(laneTask => {
                  // Only shift tasks that are in the same lane position or below
                  // And don't shift the task being dragged itself
                  if (laneTask.verticalPosition >= task.verticalPosition && laneTask.id !== task.id) {
                    tasksToShift.add(laneTask.id);
                  }
                });
                
                // Apply the shifts
                laneTasks.forEach(laneTask => {
                  if (tasksToShift.has(laneTask.id)) {
                    const idx = newTasks.findIndex(t => t.id === laneTask.id);
                    if (idx !== -1) {
                      newTasks[idx] = {
                        ...laneTask,
                        verticalPosition: laneTask.verticalPosition + 1
                      };
                    }
                  }
                });
                
                // Keep the dragged task at the same position
                newTasks[taskIndex] = {
                  ...task,
                  verticalPosition: task.verticalPosition
                };
              } else {
                // No need to log detailed messages when there's no overlap
              }
            }
            
            return newTasks;
          } catch (error) {
            console.error("[DEBUG] Error in setTasks callback:", error);
            return prevTasks;
          }
        });
      }
    } catch (error) {
      console.error("[DEBUG] Error in handleTaskDragEnd:", error);
    } finally {
      cleanupDragState();
    }
  };

  const cleanupDragState = () => {
    setDragInfo(null);
    dragInfoRef.current = null;
    setCurrentMousePosition(null);
  };

  return {
    dragInfo,
    currentMousePosition,
    handleTaskDragStart,
    handleTaskDragMove,
    handleTaskDragEnd
  };
}