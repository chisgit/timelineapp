import { Lane, Task } from "@/lib/types"

type DeleteKeys = 'Delete' | 'Backspace'
type SelectAllKey = 'a'
type EscapeKey = 'Escape'

// Define key mappings
export const KEY_MAPPINGS = {
  DELETE: ['Delete', 'Backspace'] as DeleteKeys[],
  SELECT_ALL: 'a' as SelectAllKey,
  ESCAPE: 'Escape' as EscapeKey
} as const

export interface KeyboardState {
  selectedTasks: string[]
  editingTaskId: string | null
  lanes: Lane[]
  tasks: Task[]
}

export interface KeyboardCallbacks {
  deleteSelectedTasks: () => void
  setSelectedTasks: (tasks: string[]) => void
  clearContextMenu: () => void
}

export function shouldPreventDefault(event: KeyboardEvent): boolean {
  // Prevent default for specific key combinations we want to handle
  if (event.ctrlKey || event.metaKey) {
    return event.key.toLowerCase() === KEY_MAPPINGS.SELECT_ALL
  }
  return KEY_MAPPINGS.DELETE.includes(event.key as DeleteKeys)
}

export function isSelectAllCommand(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === KEY_MAPPINGS.SELECT_ALL
}

export function isDeleteCommand(event: KeyboardEvent): boolean {
  return KEY_MAPPINGS.DELETE.includes(event.key as DeleteKeys)
}

export function isEscapeCommand(event: KeyboardEvent): boolean {
  return event.key === KEY_MAPPINGS.ESCAPE
}