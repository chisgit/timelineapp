import React from "react";

type TaskOverlapIndicatorProps = {
  position: "above" | "below";
  isVisible: boolean;
};

const TaskOverlapIndicator: React.FC<TaskOverlapIndicatorProps> = ({ position, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      className={`absolute w-full h-2 bg-blue-500 opacity-75 ${
        position === "above" ? "-top-1" : "-bottom-1"
      }`}
    />
  );
};

export default TaskOverlapIndicator;
