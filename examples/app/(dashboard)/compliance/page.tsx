"use client"

import { useState, useEffect } from "react"
import { ComplianceTable } from "@/components/compliance/compliance-table"
import type { Compliance } from "@/types/domain/compliance"

export default function CompliancePage() {
  const [compliance, setCompliance] = useState<Compliance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompliance()
  }, [])

  const fetchCompliance = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/compliance`)
      const data = await response.json()
      setCompliance(data.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch compliance:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ComplianceTable now handles all UI: header, search, filters, pagination */}
      <ComplianceTable items={compliance} />
    </div>
  )
}
