"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { ControlCard } from "./control-card"
import { CreateControlDialog } from "./create-control-dialog"
import { ControlTypeFilter } from "./control-type-filter"
import { ControlFrequencyFilter } from "./control-frequency-filter"
import type { Control } from "@/types/domain/control"

export function ControlsLibrary() {
  const [controls, setControls] = useState<Control[]>([])
  const [filteredControls, setFilteredControls] = useState<Control[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedFrequency, setSelectedFrequency] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchControls()
  }, [])

  useEffect(() => {
    filterControls()
  }, [controls, searchQuery, selectedType, selectedFrequency])

  const fetchControls = async () => {
    try {
      const response = await fetch("/api/controls")
      const data = await response.json()
      setControls(data.data || [])
    } catch (error) {
      console.error("Failed to fetch controls:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterControls = () => {
    let filtered = controls

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (control) =>
          control.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          control.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          control.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((control) => control.type === selectedType)
    }

    // Filter by frequency
    if (selectedFrequency !== "all") {
      filtered = filtered.filter((control) => control.frequency === selectedFrequency)
    }

    setFilteredControls(filtered)
  }

  const handleControlCreated = () => {
    fetchControls()
    setIsCreateDialogOpen(false)
  }

  if (isLoading) {
    return <div>Загрузка мер...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск мер..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <ControlTypeFilter value={selectedType} onChange={setSelectedType} />
          <ControlFrequencyFilter value={selectedFrequency} onChange={setSelectedFrequency} />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Создать меру
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold">{controls.length}</div>
          <div className="text-sm text-muted-foreground">Всего мер</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold">{controls.filter((c) => c.type === "preventive").length}</div>
          <div className="text-sm text-muted-foreground">Превентивных</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold">{controls.filter((c) => c.type === "detective").length}</div>
          <div className="text-sm text-muted-foreground">Детективных</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold">{controls.filter((c) => c.type === "corrective").length}</div>
          <div className="text-sm text-muted-foreground">Корректирующих</div>
        </div>
      </div>

      {/* Controls grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredControls.map((control) => (
          <ControlCard key={control.id} control={control} onUpdate={fetchControls} />
        ))}
      </div>

      {filteredControls.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-lg font-medium">Меры не найдены</p>
          <p className="text-sm text-muted-foreground">Попробуйте изменить фильтры или создайте новую меру</p>
        </div>
      )}

      <CreateControlDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleControlCreated}
      />
    </div>
  )
}
