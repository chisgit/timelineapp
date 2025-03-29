# Timeline Project Manager - System Instructions

## CORE PRINCIPLES
- Never remove existing functionality
- Maintain data model integrity
- Preserve all event handlers and state management
- Keep performance optimizations
- Update VECTOR_CONTEXT.json when modifying functionality to maintain accurate feature tracking

## KEY COMPONENTS

### Timeline (Main Controller)
- State Management: tasks, lanes, milestones, selections
- Drag & Drop System with collision detection
- Dependency Management
- Context Menu System
- Keyboard Shortcuts Integration

## DATA MODELS

### Task
```typescript
{
  id: string
  title: string
  startDay: number
  duration: number
  color: string
  laneId: string
  dependencies: string[]
  verticalPosition?: number
}
```

### Lane
```typescript
{
  id: string
  title: string
  isExpanded: boolean
}
```

### TimelineMilestone
```typescript
{
  id: string
  title: string
  day: number
}
```