"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, Search, Filter, AlertTriangle, LayoutGrid, List } from "lucide-react"
import { EvidenceCard } from "./evidence-card"
import { EvidenceUploadDialog } from "./evidence-upload-dialog"
import { calculateEvidenceFreshness } from "@/lib/utils/evidence-freshness"
import { EvidenceTableView } from "./evidence-table-view"

interface EvidenceLibraryProps {
  initialEvidence: any[]
}

export function EvidenceLibrary({ initialEvidence }: EvidenceLibraryProps) {
  const [evidence, setEvidence] = useState(initialEvidence)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [freshnessFilter, setFreshnessFilter] = useState<string>("all")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")

  const filteredEvidence = evidence.filter((item) => {
    const matchesSearch =
      item.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    let matchesFreshness = true
    if (freshnessFilter !== "all") {
      const freshness = calculateEvidenceFreshness(
        new Date(item.updated_at),
        item.expires_at ? new Date(item.expires_at) : undefined,
      )
      matchesFreshness = freshness.status === freshnessFilter
    }

    return matchesSearch && matchesStatus && matchesFreshness
  })

  const statusCounts = {
    all: evidence.length,
    pending: evidence.filter((e) => e.status === "pending").length,
    approved: evidence.filter((e) => e.status === "approved").length,
    rejected: evidence.filter((e) => e.status === "rejected").length,
    archived: evidence.filter((e) => e.status === "archived").length,
  }

  const freshnessCounts = {
    all: evidence.length,
    fresh: evidence.filter((e) => {
      const f = calculateEvidenceFreshness(new Date(e.updated_at), e.expires_at ? new Date(e.expires_at) : undefined)
      return f.status === "fresh"
    }).length,
    aging: evidence.filter((e) => {
      const f = calculateEvidenceFreshness(new Date(e.updated_at), e.expires_at ? new Date(e.expires_at) : undefined)
      return f.status === "aging"
    }).length,
    stale: evidence.filter((e) => {
      const f = calculateEvidenceFreshness(new Date(e.updated_at), e.expires_at ? new Date(e.expires_at) : undefined)
      return f.status === "stale"
    }).length,
    expired: evidence.filter((e) => {
      const f = calculateEvidenceFreshness(new Date(e.updated_at), e.expires_at ? new Date(e.expires_at) : undefined)
      return f.status === "expired"
    }).length,
  }

  const handleUploadSuccess = () => {
    // Refresh evidence list
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию, описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все ({statusCounts.all})</SelectItem>
              <SelectItem value="pending">На проверке ({statusCounts.pending})</SelectItem>
              <SelectItem value="approved">Одобрено ({statusCounts.approved})</SelectItem>
              <SelectItem value="rejected">Отклонено ({statusCounts.rejected})</SelectItem>
              <SelectItem value="archived">Архив ({statusCounts.archived})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={freshnessFilter} onValueChange={setFreshnessFilter}>
            <SelectTrigger className="w-[180px]">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Актуальность" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все ({freshnessCounts.all})</SelectItem>
              <SelectItem value="fresh">Актуальные ({freshnessCounts.fresh})</SelectItem>
              <SelectItem value="aging">Устаревающие ({freshnessCounts.aging})</SelectItem>
              <SelectItem value="stale">Устаревшие ({freshnessCounts.stale})</SelectItem>
              <SelectItem value="expired">Истекшие ({freshnessCounts.expired})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Загрузить доказательство
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary">Всего: {statusCounts.all}</Badge>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          На проверке: {statusCounts.pending}
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Одобрено: {statusCounts.approved}
        </Badge>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Отклонено: {statusCounts.rejected}
        </Badge>
        <div className="h-4 w-px bg-border mx-2" />
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          Требуют обновления: {freshnessCounts.stale + freshnessCounts.expired}
        </Badge>
      </div>

      {/* Evidence Display */}
      {filteredEvidence.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery || statusFilter !== "all" || freshnessFilter !== "all"
            ? "Доказательства не найдены"
            : "Доказательства еще не загружены"}
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvidence.map((item) => (
            <EvidenceCard key={item.id} evidence={item} />
          ))}
        </div>
      ) : (
        <EvidenceTableView evidence={filteredEvidence} />
      )}

      <EvidenceUploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} onSuccess={handleUploadSuccess} />
    </div>
  )
}
