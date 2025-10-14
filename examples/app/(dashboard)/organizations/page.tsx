"use client"

import { useEffect, useState } from "react"
import { OrganizationTree } from "@/components/organizations/organization-tree"
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog"
import { TableImportExportButtons } from "@/components/shared/table-import-export-buttons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Network, TableIcon, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"

type ViewMode = "hierarchy" | "table"

type SortField = "name" | "level" | "employee_count" | "created_at"
type SortDirection = "asc" | "desc"

export default function OrganizationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("hierarchy")
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, withPdn: 0, withKii: 0 })

  // Table view state
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Load view mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("organizations-view-mode") as ViewMode
    if (savedMode) {
      setViewMode(savedMode)
    }
  }, [])

  // Save view mode to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem("organizations-view-mode", mode)
  }

  // Fetch organizations
  useEffect(() => {
    fetchOrganizations()
    fetchStats()
  }, [])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      console.log("[v0] [Organizations Page] Fetching organizations...")
      const response = await fetch("/api/organizations")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] [Organizations Page] API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] [Organizations Page] Received organizations:", {
        count: data.length,
        sample: data[0] ? { id: data[0].id, name: data[0].name } : null,
      })
      setOrganizations(data)
    } catch (error) {
      console.error("[v0] [Organizations Page] Failed to fetch organizations:", error)
      alert(`Не удалось загрузить организации: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/organizations/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  // Build tree for hierarchy view
  const buildTree = (items: any[], parentId: string | null = null): any[] => {
    const itemsWithParent = items.filter((item) => item.parent_id === parentId || item.parentId === parentId)

    console.log("[v0] [Organizations Page] Building tree", {
      totalItems: items.length,
      parentId,
      itemsWithThisParent: itemsWithParent.length,
    })

    return itemsWithParent.map((item) => ({
      ...item,
      children: buildTree(items, item.id),
    }))
  }

  const getTreeData = () => {
    if (organizations.length === 0) return []

    console.log("[v0] [Organizations Page] All organizations", {
      count: organizations.length,
      sample: organizations
        .slice(0, 3)
        .map((o) => ({ id: o.id, name: o.name, parent_id: o.parent_id, parentId: o.parentId })),
    })

    let rootTree = buildTree(organizations, null)

    console.log("[v0] [Organizations Page] Initial tree build attempt", {
      rootNodes: rootTree.length,
      totalOrganizations: organizations.length,
    })

    if (rootTree.length > 0) {
      return rootTree
    }

    const minLevel = Math.min(...organizations.map((org) => org.level || 0))
    const topLevelOrgs = organizations.filter((org) => (org.level || 0) === minLevel)

    console.log("[v0] [Organizations Page] No root nodes found, using top-level organizations", {
      minLevel,
      topLevelCount: topLevelOrgs.length,
      topLevelOrgIds: topLevelOrgs.map((o) => o.id),
    })

    // Build tree starting from each top-level organization
    rootTree = topLevelOrgs.map((org) => {
      const children = buildTree(organizations, org.id)
      console.log("[v0] [Organizations Page] Building tree for org", {
        orgId: org.id,
        orgName: org.name,
        childrenCount: children.length,
      })
      return {
        ...org,
        children,
      }
    })

    console.log("[v0] [Organizations Page] Final tree structure", {
      rootNodes: rootTree.length,
      totalOrganizations: organizations.length,
    })

    return rootTree
  }

  const tree = getTreeData()

  // Filter and sort for table view
  const filteredOrganizations = organizations
    .filter((org) => {
      const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLevel = levelFilter === "all" || org.level.toString() === levelFilter
      return matchesSearch && matchesLevel
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const direction = sortDirection === "asc" ? 1 : -1

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === "string") {
        return aValue.localeCompare(bValue) * direction
      }
      return (aValue - bValue) * direction
    })

  const paginatedOrganizations = filteredOrganizations.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filteredOrganizations.length / pageSize)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-2 h-4 w-4" />
    return sortDirection === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
  }

  const handleImport = async (importedData: any[]) => {
    console.log("[v0] Importing organizations:", importedData)
    // TODO: Implement import logic with API call
    // await fetch("/api/organizations/import", { method: "POST", body: JSON.stringify(importedData) })
    await fetchOrganizations()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Организации</h1>
          <p className="text-muted-foreground">Управление иерархической структурой организаций</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Import/Export buttons */}
          {viewMode === "table" && (
            <TableImportExportButtons
              data={filteredOrganizations}
              filename="organizations"
              onImport={handleImport}
              canExport={true}
              canImport={true}
            />
          )}
          {/* View mode toggle */}
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={viewMode === "hierarchy" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("hierarchy")}
              className="h-8"
            >
              <Network className="h-4 w-4 mr-2" />
              Иерархия
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("table")}
              className="h-8"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Таблица
            </Button>
          </div>
          <CreateOrganizationDialog organizations={organizations} onSuccess={fetchOrganizations} />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-0.5 pt-1.5 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Всего организаций</CardTitle>
          </CardHeader>
          <CardContent className="pb-1.5 pt-0 px-3">
            <div className="text-xl font-bold">{stats.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0.5 pt-1.5 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">С ПДн</CardTitle>
          </CardHeader>
          <CardContent className="pb-1.5 pt-0 px-3">
            <div className="text-xl font-bold">{stats.withPdn || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0.5 pt-1.5 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">С КИИ</CardTitle>
          </CardHeader>
          <CardContent className="pb-1.5 pt-0 px-3">
            <div className="text-xl font-bold">{stats.withKii || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy view */}
      {viewMode === "hierarchy" && (
        <Card>
          <CardHeader>
            <CardTitle>Иерархия организаций</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Загрузка...</div>
              </div>
            ) : (
              <OrganizationTree data={tree} allOrganizations={organizations} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <Card>
          <CardHeader>
            <CardTitle>Список организаций</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Уровень" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все уровни</SelectItem>
                  <SelectItem value="0">Уровень 0</SelectItem>
                  <SelectItem value="1">Уровень 1</SelectItem>
                  <SelectItem value="2">Уровень 2</SelectItem>
                  <SelectItem value="3">Уровень 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center font-medium hover:text-foreground"
                      >
                        Название
                        <SortIcon field="name" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("level")}
                        className="flex items-center font-medium hover:text-foreground"
                      >
                        Уровень
                        <SortIcon field="level" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("employee_count")}
                        className="flex items-center font-medium hover:text-foreground"
                      >
                        Сотрудников
                        <SortIcon field="employee_count" />
                      </button>
                    </TableHead>
                    <TableHead>Родительская</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("created_at")}
                        className="flex items-center font-medium hover:text-foreground"
                      >
                        Создана
                        <SortIcon field="created_at" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Загрузка...
                      </TableCell>
                    </TableRow>
                  ) : paginatedOrganizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Нет данных
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrganizations.map((org) => {
                      const parent = organizations.find((o) => o.id === org.parent_id)
                      return (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell>{org.level}</TableCell>
                          <TableCell>{org.employee_count || "—"}</TableCell>
                          <TableCell>{parent?.name || "—"}</TableCell>
                          <TableCell>{new Date(org.created_at).toLocaleDateString("ru-RU")}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Показано {Math.min((page - 1) * pageSize + 1, filteredOrganizations.length)}-
                {Math.min(page * pageSize, filteredOrganizations.length)} из {filteredOrganizations.length}
              </div>
              <div className="flex items-center gap-2">
                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-9 w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 на странице</SelectItem>
                    <SelectItem value="50">50 на странице</SelectItem>
                    <SelectItem value="100">100 на странице</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="h-9">
                    Первая
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="h-9"
                  >
                    Назад
                  </Button>
                  <span className="px-3 text-sm">
                    Страница {page} из {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="h-9"
                  >
                    Вперед
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="h-9"
                  >
                    Последняя
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
