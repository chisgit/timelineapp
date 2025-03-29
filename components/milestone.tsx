import type { TimelineMilestone } from "./timeline"

interface MilestoneProps {
  milestone: TimelineMilestone
  totalDays: number
}

export function Milestone({ milestone, totalDays }: MilestoneProps) {
  // Calculate position
  const dayWidth = 100 / totalDays
  const left = `${milestone.day * dayWidth}%`

  return (
    <div className="absolute top-0 bottom-0 w-0 border-l-2 border-dashed border-red-500 z-10" style={{ left }}>
      <div className="absolute -left-3 top-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
      <div className="absolute -left-20 top-7 w-40 text-center text-xs font-medium text-red-500">{milestone.title}</div>
    </div>
  )
}

