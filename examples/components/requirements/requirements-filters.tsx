"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DocumentStatusFilter } from "@/components/documents/document-status-filter"
import { Search } from "lucide-react"
import type { RegulatoryFramework } from "@/types/domain/regulatory-framework"

interface RequirementsFiltersProps {
  onFilterChange: (filters: any) => void
}

export function RequirementsFilters({ onFilterChange }: RequirementsFiltersProps) {
  const [frameworks, setFrameworks] = useState<RegulatoryFramework[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [regulators, setRegulators] = useState<any[]>([])

  useEffect(() => {
    fetchFrameworks()
    fetchCategories()
    fetchRegulators()
  }, [])

  const fetchFrameworks = async () => {
    try {
      const response = await fetch("/api/dictionaries/regulatory-frameworks")
      const data = await response.json()
      setFrameworks(data.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch regulatory frameworks:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/dictionaries/categories")
      const data = await response.json()
      setCategories(data.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch categories:", error)
    }
  }

  const fetchRegulators = async () => {
    try {
      const response = await fetch("/api/dictionaries/regulators")
      const data = await response.json()
      setRegulators(data.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch regulators:", error)
    }
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Поиск с иконкой */}
          <div className="relative flex-1 min-w-[240px] max-w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по коду или названию..."
              className="pl-9 h-9"
              onChange={(e) => onFilterChange({ search: e.target.value })}
            />
          </div>

          {/* Нормативная база */}
          <Select
            onValueChange={(value) => onFilterChange({ regulatory_framework_id: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Все законы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все законы</SelectItem>
              {frameworks.map((fw) => (
                <SelectItem key={fw.id} value={fw.id}>
                  {fw.badgeText || fw.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Статус документа */}
          <div className="w-[160px]">
            <DocumentStatusFilter
              value="all"
              onChange={(value) => onFilterChange({ document_status: value === "all" ? undefined : value })}
            />
          </div>

          {/* Категория */}
          <Select onValueChange={(value) => onFilterChange({ category_id: value === "all" ? undefined : value })}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Критичность */}
          <Select onValueChange={(value) => onFilterChange({ criticality_level: value === "all" ? undefined : value })}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Критичность" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уровни</SelectItem>
              <SelectItem value="critical">Критический</SelectItem>
              <SelectItem value="high">Высокий</SelectItem>
              <SelectItem value="medium">Средний</SelectItem>
              <SelectItem value="low">Низкий</SelectItem>
            </SelectContent>
          </Select>

          {/* Регулятор */}
          <Select onValueChange={(value) => onFilterChange({ regulator_id: value === "all" ? undefined : value })}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Регулятор" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все регуляторы</SelectItem>
              {regulators.map((reg) => (
                <SelectItem key={reg.id} value={reg.id}>
                  {reg.short_name || reg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
