"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Filter } from "lucide-react"
import type { Requirement } from "@/types/domain/requirement"
import type { RegulatoryFramework } from "@/types/domain/regulatory-framework"

interface AddRequirementsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onSuccess: () => void
}

export function AddRequirementsDialog({ open, onOpenChange, organizationId, onSuccess }: AddRequirementsDialogProps) {
  const [mode, setMode] = useState<"manual" | "filter">("manual")
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [frameworks, setFrameworks] = useState<RegulatoryFramework[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Filter state
  const [filterFramework, setFilterFramework] = useState<string>("all")
  const [filterCriticality, setFilterCriticality] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  useEffect(() => {
    if (open) {
      fetchRequirements()
      fetchFrameworks()
    }
  }, [open])

  const fetchRequirements = async () => {
    try {
      const response = await fetch("/api/requirements")
      const data = await response.json()
      setRequirements(data)
    } catch (error) {
      console.error("[v0] Failed to fetch requirements:", error)
    }
  }

  const fetchFrameworks = async () => {
    try {
      const response = await fetch("/api/dictionaries/regulatory-frameworks")
      if (!response.ok) {
        console.error("[v0] Failed to fetch frameworks:", response.statusText)
        setFrameworks([])
        return
      }
      const data = await response.json()
      setFrameworks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Failed to fetch frameworks:", error)
      setFrameworks([])
    }
  }

  const filteredRequirements = Array.isArray(requirements)
    ? requirements.filter((req) => {
        const matchesSearch =
          req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.code.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
      })
    : []

  const toggleRequirement = (id: string) => {
    const newSelected = new Set(selectedRequirements)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRequirements(newSelected)
  }

  const handleAddManual = async () => {
    if (selectedRequirements.size === 0) return

    setIsLoading(true)
    try {
      for (const requirementId of selectedRequirements) {
        await fetch(`/api/organizations/${organizationId}/requirements/manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_single",
            requirementId,
            reason,
          }),
        })
      }
      onSuccess()
      resetDialog()
    } catch (error) {
      console.error("[v0] Failed to add requirements:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddByFilter = async () => {
    setIsLoading(true)
    try {
      const filters: any = {}
      if (filterFramework !== "all") filters.regulatoryFrameworkId = filterFramework
      if (filterCriticality !== "all") filters.criticality = filterCriticality
      if (filterCategory !== "all") filters.category = filterCategory

      await fetch(`/api/organizations/${organizationId}/requirements/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_by_filter",
          filters,
          reason,
        }),
      })
      onSuccess()
      resetDialog()
    } catch (error) {
      console.error("[v0] Failed to add requirements by filter:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetDialog = () => {
    setMode("manual")
    setSearchQuery("")
    setSelectedRequirements(new Set())
    setReason("")
    setFilterFramework("all")
    setFilterCriticality("all")
    setFilterCategory("all")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить требования</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "filter")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Выбрать вручную</TabsTrigger>
            <TabsTrigger value="filter">По фильтрам</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск требований по коду или названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="secondary">{selectedRequirements.size} выбрано</Badge>
            </div>

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {filteredRequirements.map((req) => (
                <div
                  key={req.id}
                  className="flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleRequirement(req.id)}
                >
                  <Checkbox
                    checked={selectedRequirements.has(req.id)}
                    onCheckedChange={() => toggleRequirement(req.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{req.code}</code>
                      <span className="text-sm font-medium truncate">{req.title}</span>
                    </div>
                    {req.regulatoryFramework && (
                      <span className="text-xs text-muted-foreground">{req.regulatoryFramework.name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-reason">Причина добавления</Label>
              <Textarea
                id="manual-reason"
                placeholder="Укажите причину ручного добавления требований..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="filter" className="space-y-4">
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Фильтры требований</h4>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Нормативная база</Label>
                  <Select value={filterFramework} onValueChange={setFilterFramework}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все документы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все документы</SelectItem>
                      {Array.isArray(frameworks) &&
                        frameworks.map((fw) => (
                          <SelectItem key={fw.id} value={fw.id}>
                            {fw.code} - {fw.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Критичность</Label>
                  <Select value={filterCriticality} onValueChange={setFilterCriticality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все уровни" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все уровни</SelectItem>
                      <SelectItem value="critical">Критическая</SelectItem>
                      <SelectItem value="high">Высокая</SelectItem>
                      <SelectItem value="medium">Средняя</SelectItem>
                      <SelectItem value="low">Низкая</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      <SelectItem value="technical">Технические</SelectItem>
                      <SelectItem value="organizational">Организационные</SelectItem>
                      <SelectItem value="legal">Правовые</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-800">
                  Будут добавлены все требования, соответствующие выбранным фильтрам
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-reason">Причина добавления</Label>
              <Textarea
                id="filter-reason"
                placeholder="Укажите причину массового добавления требований..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Отмена
          </Button>
          <Button
            onClick={mode === "manual" ? handleAddManual : handleAddByFilter}
            disabled={isLoading || (mode === "manual" && selectedRequirements.size === 0)}
          >
            {isLoading
              ? "Добавление..."
              : mode === "manual"
                ? `Добавить (${selectedRequirements.size})`
                : "Добавить по фильтрам"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
