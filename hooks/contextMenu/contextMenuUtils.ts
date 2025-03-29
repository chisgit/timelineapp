interface Position {
  x: number
  y: number
}

export function adjustMenuPosition<T extends HTMLElement>(
  position: Position, 
  menuRef: React.RefObject<T>
): Position {
  let { x, y } = position

  if (menuRef.current) {
    const menuWidth = menuRef.current.offsetWidth
    const menuHeight = menuRef.current.offsetHeight

    // Adjust horizontal position if menu would go off screen
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }

    // Adjust vertical position if menu would go off screen
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }

    // Ensure menu doesn't go off screen to the left or top
    x = Math.max(10, x)
    y = Math.max(10, y)
  }

  return { x, y }
}