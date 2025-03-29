import { useState } from "react"
import { TimelineMilestone } from "@/lib/types"

export function useMilestones(initialMilestones: TimelineMilestone[] = []) {
  const [milestones, setMilestones] = useState<TimelineMilestone[]>(initialMilestones)

  const addNewMilestone = () => {
    const newMilestoneId = `milestone-${milestones.length + 1}`
    setMilestones([
      ...milestones,
      {
        id: newMilestoneId,
        title: "New Milestone",
        day: 30,
      },
    ])
  }

  return {
    milestones,
    addNewMilestone,
  }
}