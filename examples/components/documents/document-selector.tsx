/**
 * @intent: Selector for choosing existing document
 * @llm-note: Used when linking document to evidence
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Document } from "@/types/domain/document"
import { formatMeasureDate } from "@/lib/utils/control-measure-utils"

interface DocumentSelectorProps {
  onSelect: (document: Document) => void
  disabled?: boolean
}

export function DocumentSelector({ onSelect, disabled }: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([])
  const [search, setSearch] = useState("")
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("active")
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  useEffect(() => {
    fetchDocuments()
  }, [])
  
  useEffect(() => {
    filterDocuments()
  }, [documents, search, lifecycleFilter])
  
  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      const data = await response.json()
      setDocuments(data.data || [])
    } catch (error) {
      console.error('[DocumentSelector] Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const filterDocuments = () => {
    let filtered = documents
    
    // Filter by lifecycle
    if (lifecycleFilter && lifecycleFilter !== 'all') {
      filtered = filtered.filter(d => d.lifecycleStatus === lifecycleFilter)
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(searchLower) ||
        d.documentNumber?.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower)
      )
    }
    
    setFilteredDocs(filtered)
  }
  
  if (loading) {
    return <div className="text-center py-8">Загрузка документов...</div>
  }
  
  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию, номеру..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="draft">Черновики</SelectItem>
            <SelectItem value="archived">Архивированные</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Список документов */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredDocs.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Документы не найдены</p>
                <p className="text-sm mt-2">Попробуйте изменить фильтры или создайте новый документ</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredDocs.map(doc => (
            <Card 
              key={doc.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedId === doc.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedId(doc.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {doc.documentNumber && (
                        <span className="mr-2">{doc.documentNumber}</span>
                      )}
                      {doc.documentDate && (
                        <span>от {formatMeasureDate(doc.documentDate)}</span>
                      )}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      doc.lifecycleStatus === 'active' ? 'default' :
                      doc.lifecycleStatus === 'draft' ? 'secondary' :
                      'outline'
                    }>
                      {doc.lifecycleStatus}
                    </Badge>
                    {selectedId === doc.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {doc.currentVersion && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Версия: {doc.currentVersion.versionNumber}</span>
                    {doc.evidenceUsages && doc.evidenceUsages.length > 0 && (
                      <span>Используется в: {doc.evidenceUsages.length} мер</span>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
      
      {/* Кнопка подтверждения */}
      {selectedId && (
        <div className="flex justify-end">
          <Button 
            onClick={() => {
              const selected = filteredDocs.find(d => d.id === selectedId)
              if (selected) onSelect(selected)
            }}
            disabled={disabled || isCreating}
          >
            {isCreating ? "Создание..." : "Использовать выбранный документ"}
          </Button>
        </div>
      )}
    </div>
  )
}

