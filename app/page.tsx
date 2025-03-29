import { Timeline } from "@/components/timeline"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b bg-background px-6 py-3">
        <h1 className="text-xl font-semibold">Timeline Project Manager</h1>
      </header>
      <div className="flex-1 overflow-auto p-6">
        <Timeline />
      </div>
    </main>
  )
}

