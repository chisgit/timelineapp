import { useState, useRef } from "react";
import { Task, DragInfo, MousePosition } from "@/lib/types";
import { 
  getDayWidth, 
  getTaskVirtualLane,
  getOverlappingTasks, 
  createNewVirtualLane,
  findEmptyTopVirtualLanes,
  removeEmptyTopVirtualLanes
} from "./taskUtils";

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
    
    // Calculate raw vertical delta in pixels, then convert to lane units (48px per lane)
    const verticalDeltaPx = deltaY;
    const verticalDelta = Math.round(verticalDeltaPx / 48);

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
        
        // Calculate the proposed new vertical position
        let newVerticalPosition = Math.max(0, originalPosition.verticalPosition + verticalDelta);
        
        // Get all tasks in the same lane for collision detection
        const laneTasks = newTasks.filter(t => t.laneId === task.laneId && t.id !== task.id);
        
        // Check if we need a new virtual lane at the top (negative position)
        if (originalPosition.verticalPosition + verticalDelta < 0) {
          // We're trying to go above position 0
          
          // Check if there are tasks at position 0 that would cause overlapping
          const tasksAtZero = laneTasks.filter(t => {
            const vPos = t.verticalPosition ?? 0;
            return vPos === 0;
          });
          
          if (tasksAtZero.length > 0) {
            // Need to create space at the top
            // First, shift all tasks down by 1
            newTasks.forEach((t, idx) => {
              if (t.laneId === task.laneId && t.id !== task.id) {
                newTasks[idx] = {
                  ...t,
                  verticalPosition: (t.verticalPosition ?? 0) + 1
                };
              }
            });
            
            // Then set the dragged task to position 0
            newVerticalPosition = 0;
          } else {
            // No overlapping at top, just set to 0
            newVerticalPosition = 0;
          }
        }

        // Update the task position
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
            let newTasks = [...prevTasks];
            
            // Process each dragged task only once
            for (const taskId of dragInfo.taskIds) {
              const taskIndex = newTasks.findIndex(t => t.id === taskId);
              if (taskIndex === -1) continue;
              
              const task = {...newTasks[taskIndex]};
              
              // Get tasks in the same lane
              const laneTasks = newTasks.filter(t => t.laneId === task.laneId);
              console.log(`[DEBUG] Task ${task.id} (${task.title}) in lane ${task.laneId}, Virtual Lane: ${task.verticalPosition ?? 0}`);
              
              // Check if task moved to a new vertical lane
              const originalPosition = dragInfo.originalPositions.find(p => p.id === taskId);
              
              if (originalPosition) {
                console.log(`[DEBUG] Task ${task.id} moved from VL:${originalPosition.verticalPosition} to VL:${task.verticalPosition ?? 0}`);
                
                // If we moved up, check if the original lane is now empty
                if (task.verticalPosition < originalPosition.verticalPosition) {
                  const originalVirtualLane = originalPosition.verticalPosition;
                  const tasksInOriginalLane = laneTasks.filter(t => 
                    t.id !== task.id && (t.verticalPosition ?? 0) === originalVirtualLane
                  );
                  
                  // If original lane is now empty, collapse lanes by moving all tasks above it down
                  if (tasksInOriginalLane.length === 0) {
                    console.log(`[DEBUG] Empty virtual lane detected at position ${originalVirtualLane}, collapsing`);
                    
                    // Shift all tasks that are above the now-empty lane down by one
                    laneTasks.forEach(laneTask => {
                      if ((laneTask.verticalPosition ?? 0) > originalVirtualLane) {
                        const idx = newTasks.findIndex(t => t.id === laneTask.id);
                        if (idx !== -1) {
                          newTasks[idx] = {
                            ...laneTask,
                            verticalPosition: (laneTask.verticalPosition ?? 0) - 1
                          };
                        }
                      }
                    });
                  }
                }
              }
              
              // Find tasks that overlap with this task in its CURRENT virtual lane
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
                    Virtual Lane: ${task.verticalPosition ?? 0},
                    Time Range: ${taskStart}-${taskEnd} overlaps with ${otherStart}-${otherEnd}`);
                }

                return timeOverlap;
              });
              
              if (overlappingTasks.length > 0) {
                console.log(`[DEBUG] Creating new virtual lane for task ${task.id} at position ${task.verticalPosition ?? 0}`);
                
                // Determine the current virtual lane position (defaulting to 0 if undefined)
                const currentVirtualLane = task.verticalPosition ?? 0;
                
                // Shift down any existing tasks that are at or below the new position
                laneTasks.forEach(laneTask => {
                  // Only shift tasks that are in the same lane position or below
                  // And don't shift the task being dragged itself
                  if ((laneTask.verticalPosition ?? 0) >= currentVirtualLane && laneTask.id !== task.id) {
                    const idx = newTasks.findIndex(t => t.id === laneTask.id);
                    if (idx !== -1) {
                      newTasks[idx] = {
                        ...laneTask,
                        verticalPosition: (laneTask.verticalPosition ?? 0) + 1
                      };
                    }
                  }
                });
                
                // Keep the dragged task at the same position
                newTasks[taskIndex] = {
                  ...task,
                  verticalPosition: currentVirtualLane
                };
                
                console.log(`[DEBUG] Overlap resolved - Created new virtual lane at position ${currentVirtualLane}`);
              } else {
                console.log(`[DEBUG] No overlap detected for task ${task.id}`);
              }
            }
            
            // After processing all dragged tasks, check for empty lanes at the top of each affected swim lane
            const affectedLaneIds = new Set(dragInfo.taskIds.map(id => {
              const task = newTasks.find(t => t.id === id);
              return task?.laneId;
            }).filter(Boolean));
            
            // Process each affected lane
            affectedLaneIds.forEach(laneId => {
              // Check for empty virtual lanes at the top
              const emptyTopLaneCount = findEmptyTopVirtualLanes(newTasks, laneId);
              
              if (emptyTopLaneCount > 0) {
                console.log(`[DEBUG] Found ${emptyTopLaneCount} empty virtual lanes at the top of lane ${laneId}, removing them`);
                // Remove empty top lanes by shifting all tasks up
                newTasks = removeEmptyTopVirtualLanes(newTasks, laneId, emptyTopLaneCount);
              }
            });
            
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