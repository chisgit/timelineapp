export function TimelineHeader({ totalDays }: { totalDays: number }) {
  // Generate day numbers for the timeline header
  const days = Array.from({ length: totalDays }, (_, i) => i)

  return (
    <div className="flex border-b">
      <div className="w-48 min-w-48 border-r p-2 bg-muted/20">
        <span className="font-medium">Swim Lanes</span>
      </div>
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-10">
          {days.map((day) => (
            <div
              key={day}
              className="flex-shrink-0 w-10 border-r flex items-center justify-center text-xs text-muted-foreground"
            >
              {day + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

