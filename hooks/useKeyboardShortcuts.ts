import { useEffect } from "react";
import type { Lane, Task } from "@/components/timeline";

type ContextMenu = {
  isOpen: boolean
  x: number
  y: number
  taskId: string
} | null

type KeyboardShortcutsProps = {
  selectedTasks: string[];
  editingTaskId: string | null;
  lanes: Lane[];
  tasks: Task[];
  deleteSelectedTasks: () => void;
  setSelectedTasks: (tasks: string[]) => void;
  setContextMenu: (contextMenu: ContextMenu) => void;
};

export function useKeyboardShortcuts({
  selectedTasks,
  editingTaskId,
  lanes,
  tasks,
  deleteSelectedTasks,
  setSelectedTasks,
  setContextMenu,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (editingTaskId) return;

      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelectedTasks();
      } else if (event.key === "Escape") {
        setSelectedTasks([]);
        setContextMenu(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingTaskId, deleteSelectedTasks, setSelectedTasks, setContextMenu]);
}