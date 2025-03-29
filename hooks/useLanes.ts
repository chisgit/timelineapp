import { useState } from "react"
import { Lane } from "@/lib/types"

export function useLanes(initialLanes: Lane[] = []) {
  const [lanes, setLanes] = useState<Lane[]>(initialLanes)

  const toggleLaneExpansion = (laneId: string) => {
    setLanes((prevLanes) =>
      prevLanes.map((lane) => (lane.id === laneId ? { ...lane, isExpanded: !lane.isExpanded } : lane)),
    )
  }

  const addNewLane = () => {
    const newLaneId = `lane-${lanes.length + 1}`
    setLanes([
      ...lanes,
      {
        id: newLaneId,
        title: `New Lane ${lanes.length + 1}`,
        isExpanded: true,
      },
    ])
  }

  return {
    lanes,
    toggleLaneExpansion,
    addNewLane,
  }
}