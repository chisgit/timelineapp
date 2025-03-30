import { Task } from "@/lib/types"

export const getDayWidth = (timelineWidth: number, totalDays: number) => {
  return timelineWidth / totalDays
}

export const getTaskVirtualLane = (taskId: string, laneTasks: Task[]): number => {
  const task = laneTasks.find(t => t.id === taskId)
  return task?.verticalPosition ?? 0
}

export const getOverlappingTasks = (tasks: Task[], targetTask: Task, startDay: number, verticalPosition: number): Task[] => {
  return tasks.filter(task =>
    task.laneId === targetTask.laneId &&
    task.id !== targetTask.id &&
    task.verticalPosition === verticalPosition &&
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