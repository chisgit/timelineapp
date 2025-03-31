import { Task } from "@/lib/types"

export const getDayWidth = (timelineWidth: number, totalDays: number) => {
  return timelineWidth / totalDays
}

export const getTaskVirtualLane = (taskId: string, laneTasks: Task[]): number => {
  const task = laneTasks.find(t => t.id === taskId);
  if (!task) return 0; // Default to first virtual lane if task not found
  
  // Ensure verticalPosition is at least 0 (first virtual lane)
  return task.verticalPosition ?? 0;
}

export const getOverlappingTasks = (tasks: Task[], targetTask: Task, startDay: number, verticalPosition: number): Task[] => {
  // Ensure we're comparing with the actual vertical position or default 0
  const targetPosition = verticalPosition ?? 0;
  
  return tasks.filter(task =>
    task.laneId === targetTask.laneId &&
    task.id !== targetTask.id &&
    (task.verticalPosition ?? 0) === targetPosition && // Compare with default 0 if not defined
    task.startDay < (startDay + targetTask.duration) &&
    (task.startDay + task.duration) > startDay
  );
};

export const createNewVirtualLane = (tasks: Task[], overlappingTasks: Task[]): void => {
  const maxVerticalPosition = Math.max(...tasks.map(task => task.verticalPosition || 0));
  overlappingTasks.forEach(task => {
    task.verticalPosition = maxVerticalPosition + 1;
  });
};

export const shiftTasksDown = (tasks: Task[], laneId: string, fromPosition: number = 0): Task[] => {
  // Create a new array to avoid mutating the input
  const newTasks = [...tasks];
  
  // Shift all tasks in the same lane that are at or above the specified position
  newTasks.forEach((task, index) => {
    if (task.laneId === laneId && (task.verticalPosition ?? 0) >= fromPosition) {
      newTasks[index] = {
        ...task,
        verticalPosition: (task.verticalPosition ?? 0) + 1
      };
    }
  });
  
  return newTasks;
};

export const findEmptyVirtualLanes = (tasks: Task[], laneId: string): number[] => {
  // Find all occupied virtual lanes in this lane
  const occupiedLanes = tasks
    .filter(t => t.laneId === laneId)
    .map(t => t.verticalPosition ?? 0);
  
  // If no tasks, no empty lanes to worry about
  if (occupiedLanes.length === 0) return [];
  
  // Find the maximum virtual lane used
  const maxLane = Math.max(...occupiedLanes);
  
  // Create an array of all possible lane indices from 0 to max
  const allPossibleLanes = Array.from({ length: maxLane + 1 }, (_, i) => i);
  
  // Return the lanes that are not occupied
  return allPossibleLanes.filter(lane => !occupiedLanes.includes(lane));
};

export const collapseEmptyVirtualLane = (tasks: Task[], laneId: string, emptyLanePosition: number): Task[] => {
  // Create a new array to avoid mutating the input
  const newTasks = [...tasks];
  
  // Move all tasks that are above the empty lane down by one
  newTasks.forEach((task, index) => {
    if (task.laneId === laneId && (task.verticalPosition ?? 0) > emptyLanePosition) {
      newTasks[index] = {
        ...task,
        verticalPosition: (task.verticalPosition ?? 0) - 1
      };
    }
  });
  
  return newTasks;
};

export const findEmptyTopVirtualLanes = (tasks: Task[], laneId: string): number => {
  // Get all tasks in the specified lane
  const laneTasks = tasks.filter(t => t.laneId === laneId);
  
  // If no tasks, no empty lanes to worry about
  if (laneTasks.length === 0) return 0;
  
  // Find consecutive empty virtual lanes at the top
  let emptyLanes = 0;
  
  // Check each virtual lane position from 0 upwards
  for (let position = 0; position < 100; position++) { // 100 is arbitrary upper limit
    const tasksInLane = laneTasks.filter(t => (t.verticalPosition ?? 0) === position);
    
    // If we found a lane with tasks, we've reached the end of empty lanes
    if (tasksInLane.length > 0) {
      break;
    }
    
    // This lane is empty
    emptyLanes++;
  }
  
  return emptyLanes;
};

export const removeEmptyTopVirtualLanes = (tasks: Task[], laneId: string, emptyLaneCount: number): Task[] => {
  // If no empty lanes, no changes needed
  if (emptyLaneCount <= 0) return [...tasks];
  
  // Create a new array to avoid mutating the input
  const newTasks = [...tasks];
  
  // Shift all tasks in the specified lane up by the number of empty lanes
  newTasks.forEach((task, index) => {
    if (task.laneId === laneId) {
      newTasks[index] = {
        ...task,
        verticalPosition: Math.max(0, (task.verticalPosition ?? 0) - emptyLaneCount)
      };
    }
  });
  
  return newTasks;
};