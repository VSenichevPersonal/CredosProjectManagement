"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"

interface ComplianceProgressCellProps {
  complianceId: string
}

interface ProgressData {
  progress: number
  measures: {
    total: number
    completed: number
  }
}

export function ComplianceProgressCell({ complianceId }: ComplianceProgressCellProps) {
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch(`/api/compliance/${complianceId}/progress`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [complianceId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 w-32">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Загрузка...</span>
      </div>
    )
  }

  if (!data) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const progress = data.progress
  
  // Определяем цвет на основе прогресса
  const getProgressColor = () => {
    if (progress === 100) return "bg-green-500"
    if (progress >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getProgressTextColor = () => {
    if (progress === 100) return "text-green-700"
    if (progress >= 50) return "text-yellow-700"
    return "text-red-700"
  }

  return (
    <div className="flex items-center gap-2 w-full min-w-[140px]">
      <div className="flex-1">
        {progress === 0 ? (
          // Красная точка для 0%
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-600 font-medium">Не начато</span>
          </div>
        ) : (
          // Прогресс бар для остальных случаев
          <div className="space-y-1">
            <Progress 
              value={progress} 
              className="h-2"
              indicatorClassName={getProgressColor()}
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${getProgressTextColor()}`}>
                {progress}%
              </span>
              <span className="text-xs text-muted-foreground">
                {data.measures.completed}/{data.measures.total}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

