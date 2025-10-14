"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, Search, Filter } from "lucide-react"
import { DocumentCard } from "./document-card"
import { UploadDocumentDialog } from "./upload-document-dialog"
import type { Document } from "@/types/domain/document"

interface DocumentsLibraryProps {
  initialDocuments: Document[]
}

export function DocumentsLibrary({ initialDocuments }: DocumentsLibraryProps) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || doc.documentStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: documents.length,
    active: documents.filter((d) => d.documentStatus === "active").length,
    expiring: documents.filter((d) => d.documentStatus === "expiring").length,
    expired: documents.filter((d) => d.documentStatus === "expired").length,
    archived: documents.filter((d) => d.documentStatus === "archived").length,
  }

  const handleUploadSuccess = (newDoc: Document) => {
    setDocuments((prev) => [newDoc, ...prev])
    setIsUploadOpen(false)
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
              <SelectItem value="active">Активные ({statusCounts.active})</SelectItem>
              <SelectItem value="expiring">Истекают ({statusCounts.expiring})</SelectItem>
              <SelectItem value="expired">Истекшие ({statusCounts.expired})</SelectItem>
              <SelectItem value="archived">Архив ({statusCounts.archived})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Загрузить документ
        </Button>
      </div>

      {/* Status Summary */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Всего: {statusCounts.all}</Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Активные: {statusCounts.active}
        </Badge>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Истекают: {statusCounts.expiring}
        </Badge>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Истекшие: {statusCounts.expired}
        </Badge>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery || statusFilter !== "all" ? "Документы не найдены" : "Документы еще не загружены"}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}

      <UploadDocumentDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} onSuccess={handleUploadSuccess} />
    </div>
  )
}
