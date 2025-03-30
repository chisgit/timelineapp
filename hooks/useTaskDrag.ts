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

    setDragInfo(dragInfoValue);
    dragInfoRef.current = dragInfoValue;

    const handleMove = (e: MouseEvent) => handleTaskDragMove(e, timelineWidth, totalDays);
    const handleEnd = (e: MouseEvent) => {
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

        // Detect overlapping tasks
        const overlappingTasks = getOverlappingTasks(newTasks, task, newStartDay, newVerticalPosition);
        if (overlappingTasks.length > 1) {
          createNewVirtualLane(newTasks, overlappingTasks);
        }

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
    if (!dragInfoRef.current || !currentMousePosition) {
      return cleanupDragState();
    }

    cleanupDragState();
  };

  const cleanupDragState = () => {
    setDragInfo(null);
    dragInfoRef.current = null;
    setCurrentMousePosition(null);
  };

  return {
    dragInfo,
    handleTaskDragStart,
    handleTaskDragMove, // Ensure this is exported
  };
}