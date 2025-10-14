"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface SyncMeasuresButtonProps {
  complianceId: string
}

export function SyncMeasuresButton({ complianceId }: SyncMeasuresButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSync = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/compliance/${complianceId}/sync-measures`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync measures")
      }

      toast({
        title: "Меры синхронизированы",
        description: data.message,
      })

      router.refresh()
    } catch (error: any) {
      console.error("Failed to sync measures:", error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось синхронизировать меры",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={isLoading} variant="outline" size="sm">
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Синхронизация..." : "Синхронизировать меры"}
    </Button>
  )
}
