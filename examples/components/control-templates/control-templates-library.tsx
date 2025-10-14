"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ControlTemplateCard } from "./control-template-card"
import { ControlTemplatesTableView } from "./control-templates-table-view"
import { CreateControlTemplateDialog } from "./create-control-template-dialog"
import { ViewControlTemplateDialog } from "./view-control-template-dialog"
import { EditControlTemplateDialog } from "./edit-control-template-dialog"
import { ReferenceBookLayout } from "@/components/ui/reference-book-layout"
import type { ControlTemplate } from "@/types/domain/control-template"
import type { ColumnDefinition } from "@/components/ui/column-visibility-toggle"

const TABLE_COLUMNS: ColumnDefinition[] = [
  { id: "code", label: "Код", defaultVisible: true },
  { id: "title", label: "Название", defaultVisible: true },
  { id: "type", label: "Тип", defaultVisible: true },
  { id: "category", label: "Категория", defaultVisible: true },
  { id: "frequency", label: "Частота", defaultVisible: true },
  { id: "status", label: "Статус", defaultVisible: true },
]

export function ControlTemplatesLibrary() {
  const [templates, setTemplates] = useState<ControlTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<ControlTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewingTemplate, setViewingTemplate] = useState<ControlTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<ControlTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("control-templates-visible-columns")
      if (saved) {
        return new Set(JSON.parse(saved))
      }
    }
    return new Set(TABLE_COLUMNS.filter((col) => col.defaultVisible !== false).map((col) => col.id))
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("control-templates-visible-columns", JSON.stringify(Array.from(visibleColumns)))
    }
  }, [visibleColumns])

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchQuery, selectedType, selectedCategory])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/control-templates")
      const data = await response.json()
      setTemplates(data.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch control templates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (searchQuery) {
      filtered = filtered.filter(
        (template) =>
          template.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((template) => template.controlType === selectedType)
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((template) => template.category === selectedCategory)
    }

    setFilteredTemplates(filtered)
  }

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (visible) {
        next.add(columnId)
      } else {
        next.delete(columnId)
      }
      return next
    })
  }

  const handleDelete = async (template: ControlTemplate) => {
    if (!confirm("Вы уверены, что хотите удалить эту типовую меру?")) {
      return
    }

    try {
      const response = await fetch(`/api/control-templates/${template.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete template")
      }

      fetchTemplates()
    } catch (error) {
      console.error("[v0] Failed to delete template:", error)
      alert("Не удалось удалить типовую меру")
    }
  }

  const handleTemplateCreated = () => {
    fetchTemplates()
    setIsCreateDialogOpen(false)
  }

  const handleTemplateUpdated = () => {
    fetchTemplates()
    setEditingTemplate(null)
  }

  if (isLoading) {
    return <div>Загрузка типовых мер...</div>
  }

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean)))

  return (
    <>
      <ReferenceBookLayout
        title="Типовые меры защиты"
        description="Библиотека типовых мер защиты информации для применения к требованиям"
        searchPlaceholder="Поиск по коду, названию, описанию..."
        onSearch={setSearchQuery}
        onCreateClick={() => setIsCreateDialogOpen(true)}
        createButtonLabel="Создать типовую меру"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        columns={TABLE_COLUMNS}
        visibleColumns={visibleColumns}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        filters={
          <>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Тип меры" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="preventive">Превентивные</SelectItem>
                <SelectItem value="detective">Детективные</SelectItem>
                <SelectItem value="corrective">Корректирующие</SelectItem>
                <SelectItem value="compensating">Компенсирующие</SelectItem>
              </SelectContent>
            </Select>

            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category!}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        }
        stats={
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{templates.length}</div>
              <div className="text-sm text-muted-foreground">Всего типовых мер</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{templates.filter((t) => t.controlType === "preventive").length}</div>
              <div className="text-sm text-muted-foreground">Превентивных</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{templates.filter((t) => t.controlType === "detective").length}</div>
              <div className="text-sm text-muted-foreground">Детективных</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{templates.filter((t) => t.isPublic).length}</div>
              <div className="text-sm text-muted-foreground">Публичных</div>
            </div>
          </div>
        }
      >
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <p className="text-lg font-medium">Типовые меры не найдены</p>
            <p className="text-sm text-muted-foreground">Попробуйте изменить фильтры или создайте новую типовую меру</p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => router.push(`/control-templates/${template.id}`)}
                className="cursor-pointer"
              >
                <ControlTemplateCard template={template} onUpdate={fetchTemplates} />
              </div>
            ))}
          </div>
        ) : (
          <ControlTemplatesTableView
            templates={filteredTemplates}
            onView={(template) => router.push(`/control-templates/${template.id}`)}
            onEdit={setEditingTemplate}
            onDelete={handleDelete}
            visibleColumns={visibleColumns}
          />
        )}
      </ReferenceBookLayout>

      <CreateControlTemplateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleTemplateCreated}
      />

      <ViewControlTemplateDialog
        template={viewingTemplate}
        open={!!viewingTemplate}
        onOpenChange={(open) => !open && setViewingTemplate(null)}
      />

      <EditControlTemplateDialog
        template={editingTemplate}
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        onSuccess={handleTemplateUpdated}
      />
    </>
  )
}
