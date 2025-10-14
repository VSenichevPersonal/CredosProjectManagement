"use client"

import { useState, useEffect } from "react"
import { RequirementsTable } from "@/components/dashboard/requirements-table"
import type { Requirement } from "@/types/domain/requirement"

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequirements()
  }, [])

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/requirements`)
      const data = await response.json()
      setRequirements(data.data || [])
      console.log("[v0] Requirements loaded:", { count: data.data?.length })
    } catch (error) {
      console.error("[v0] Failed to fetch requirements:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* RequirementsTable now handles all UI via UniversalDataTable */}
      <RequirementsTable requirements={requirements} />
    </div>
  )
}
