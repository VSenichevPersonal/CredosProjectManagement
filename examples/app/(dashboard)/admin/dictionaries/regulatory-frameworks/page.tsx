"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Scale, Pencil, Trash2, Search, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react"
import { RegulatoryFrameworkBadge } from "@/components/ui/regulatory-framework-badge"
import { RegulatoryFrameworkFormDialog } from "@/components/admin/regulatory-framework-form-dialog"
import type { RegulatoryFramework } from "@/types/domain/regulatory-framework"

export default function RegulatoryFrameworksPage() {
  const [frameworks, setFrameworks] = useState<RegulatoryFramework[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFramework, setSelectedFramework] = useState<RegulatoryFramework | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  useEffect(() => {
    fetchFrameworks()
  }, [])

  const fetchFrameworks = async () => {
    try {
      const response = await fetch("/api/dictionaries/regulatory-frameworks")
      const data = await response.json()
      setFrameworks(data.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch regulatory frameworks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }

  const filteredData = frameworks.filter((fw) => {
    if (!searchQuery) return true
    return (
      fw.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fw.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fw.badgeText?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0
    const aValue = a[sortColumn as keyof RegulatoryFramework]
    const bValue = b[sortColumn as keyof RegulatoryFramework]
    const modifier = sortDirection === "asc" ? 1 : -1
    return aValue > bValue ? modifier : -modifier
  })

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = itemsPerPage === -1 ? sortedData : sortedData.slice(startIndex, endIndex)

  const handleCreate = () => {
    setSelectedFramework(null)
    setDialogOpen(true)
  }

  const handleEdit = (framework: RegulatoryFramework) => {
    setSelectedFramework(framework)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот нормативный документ?")) return

    try {
      const response = await fetch(`/api/dictionaries/regulatory-frameworks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete framework")

      fetchFrameworks()
    } catch (error) {
      console.error("[v0] Failed to delete framework:", error)
      alert("Не удалось удалить нормативный документ")
    }
  }

  const handleRowClick = (id: string) => {
    window.location.href = `/admin/dictionaries/regulatory-frameworks/${id}`
  }

  const SortableHeader = ({ column, label }: { column: string; label: string }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
    >
      {label}
      {sortColumn === column ? (
        sortDirection === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )
      ) : (
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      )}
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Нормативные документы</h1>
          <p className="text-muted-foreground mt-2">Управление законами и нормативными актами</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить нормативный документ
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <CardTitle>Список нормативных документов</CardTitle>
          </div>
          <CardDescription>
            Законы и нормативные акты, которые вводят требования по информационной безопасности
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или коду..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9"
              />
            </div>
            {sortedData.length > 20 && (
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 записей</SelectItem>
                  <SelectItem value="50">50 записей</SelectItem>
                  <SelectItem value="100">100 записей</SelectItem>
                  <SelectItem value="-1">Показать все</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">Загрузка...</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">
                        <SortableHeader column="badgeText" label="Бедж" />
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="name" label="Название" />
                      </TableHead>
                      <TableHead className="max-w-[300px]">Описание</TableHead>
                      <TableHead className="w-[140px]">
                        <SortableHeader column="effectiveDate" label="Дата вступления" />
                      </TableHead>
                      <TableHead className="w-[100px]">Статус</TableHead>
                      <TableHead className="w-[100px]">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {searchQuery ? "Ничего не найдено" : "Нет данных"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((fw) => (
                        <TableRow
                          key={fw.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(fw.id)}
                        >
                          <TableCell>
                            <RegulatoryFrameworkBadge
                              code={fw.code}
                              badgeText={fw.badgeText}
                              badgeColor={fw.badgeColor}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="max-w-[400px] truncate" title={fw.name}>
                              {fw.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="max-w-[300px] truncate text-sm text-muted-foreground"
                              title={fw.description}
                            >
                              {fw.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            {fw.effectiveDate ? (
                              <span className="text-sm">{new Date(fw.effectiveDate).toLocaleDateString("ru-RU")}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              Действует
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(fw)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(fw.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && itemsPerPage !== -1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Показано {startIndex + 1}-{Math.min(endIndex, sortedData.length)} из {sortedData.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Назад
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-9"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Вперед
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <RegulatoryFrameworkFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        framework={selectedFramework}
        onSuccess={fetchFrameworks}
      />
    </div>
  )
}
