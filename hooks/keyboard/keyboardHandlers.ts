import { 
  KeyboardState, 
  KeyboardCallbacks,
  isSelectAllCommand,
  isDeleteCommand,
  isEscapeCommand,
  shouldPreventDefault
} from "./keyboardUtils"

export function createKeyboardHandler(
  state: KeyboardState,
  callbacks: KeyboardCallbacks
) {
  return function handleKeyDown(event: KeyboardEvent) {
    if (state.editingTaskId) return

    if (shouldPreventDefault(event)) {
      event.preventDefault()
    }

    // Handle Select All (Ctrl/Cmd + A)
    if (isSelectAllCommand(event)) {
      callbacks.setSelectedTasks(state.tasks.map(t => t.id))
      return
    }

    // Handle Delete/Backspace
    if (isDeleteCommand(event) && state.selectedTasks.length > 0) {
      callbacks.deleteSelectedTasks()
      return
    }

    // Handle Escape
    if (isEscapeCommand(event)) {
      callbacks.clearContextMenu()
      callbacks.setSelectedTasks([])
      return
    }
  }
}