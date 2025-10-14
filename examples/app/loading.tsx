/**
 * @intent: Root loading state for the application
 * @llm-note: Improves perceived performance during initial load
 */

import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  )
}
