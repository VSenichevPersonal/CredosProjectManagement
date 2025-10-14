"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Download, 
  Trash2, 
  Calendar, 
  LinkIcon, 
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react"
import type { Evidence } from "@/types/domain/evidence"
import { formatDate } from "@/lib/utils/date"
import { cn } from "@/lib/utils"

interface ComplianceEvidenceTabProps {
  complianceId: string
  requirement?: {
    evidenceTypeMode?: "flexible" | "restricted"
    allowedEvidenceTypeIds?: string[]
  }
}

export function ComplianceEvidenceTab({ complianceId, requirement }: ComplianceEvidenceTabProps) {
  const [measures, setMeasures] = useState<any[]>([])
  const [evidenceLinks, setEvidenceLinks] = useState<any[]>([])
  const [evidenceTypes, setEvidenceTypes] = useState<Array<{ id: string; code: string; title: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const evidenceTypeMode = requirement?.evidenceTypeMode || "flexible"

  const fetchData = async () => {
    try {
      // Load measures with evidence links
      const measuresRes = await fetch(
        `/api/compliance/${complianceId}/measures?includeEvidenceTypes=true&includeLinkedEvidence=true`,
      )
      if (measuresRes.ok) {
        const measuresData = await measuresRes.json()
        setMeasures(Array.isArray(measuresData) ? measuresData : measuresData.data || [])
      }

      // Load evidence types
      const typesRes = await fetch("/api/dictionaries/evidence-types")
      if (typesRes.ok) {
        const typesData = await typesRes.json()
        setEvidenceTypes(Array.isArray(typesData) ? typesData : typesData.data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch evidence data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [complianceId])

  // Collect all unique evidence from all measures
  const allEvidence = useMemo(() => {
    const evidenceMap = new Map<string, any>()
    
    measures.forEach((measure) => {
      measure.linkedEvidence?.forEach((link: any) => {
        if (link.evidence) {
          const evidenceId = link.evidence.id
          if (!evidenceMap.has(evidenceId)) {
            evidenceMap.set(evidenceId, {
              ...link.evidence,
              linkedMeasures: [],
              linkCount: 0
            })
          }
          evidenceMap.get(evidenceId).linkedMeasures.push({
            measureId: measure.id,
            measureTitle: measure.title,
            linkId: link.id
          })
          evidenceMap.get(evidenceId).linkCount++
        }
      })
    })
    
    return Array.from(evidenceMap.values())
  }, [measures])

  // Group evidence by type
  const evidenceByType = useMemo(() => {
    const grouped = new Map<string, any>()
    
    evidenceTypes.forEach(type => {
      grouped.set(type.id, {
        ...type,
        evidence: [],
        count: 0,
        totalLinks: 0
      })
    })
    
    allEvidence.forEach((evidence) => {
      const typeId = evidence.evidence_type_id
      if (grouped.has(typeId)) {
        grouped.get(typeId).evidence.push(evidence)
        grouped.get(typeId).count++
        grouped.get(typeId).totalLinks += evidence.linkCount || 0
      }
    })
    
    return Array.from(grouped.values()).filter(g => g.count > 0)
  }, [allEvidence, evidenceTypes])

  // Statistics
  const stats = useMemo(() => {
    const reusedEvidence = allEvidence.filter(e => e.linkCount > 1)
    const byStatus = {
      approved: allEvidence.filter(e => e.status === 'approved').length,
      pending: allEvidence.filter(e => e.status === 'pending').length,
      rejected: allEvidence.filter(e => e.status === 'rejected').length
    }
    
    return {
      total: allEvidence.length,
      reused: reusedEvidence.length,
      reusedPercent: allEvidence.length > 0 ? Math.round((reusedEvidence.length / allEvidence.length) * 100) : 0,
      totalLinks: allEvidence.reduce((sum, e) => sum + (e.linkCount || 0), 0),
      byStatus
    }
  }, [allEvidence])

  // Filtered evidence
  const filteredEvidence = useMemo(() => {
    return allEvidence.filter((e) => {
      // Status filter
      if (statusFilter !== "all" && e.status !== statusFilter) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          e.title?.toLowerCase().includes(query) ||
          e.file_name?.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }, [allEvidence, statusFilter, searchQuery])

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Всего доказательств</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold">{stats.reused}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Переиспользуется ({stats.reusedPercent}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalLinks}</div>
            <p className="text-xs text-muted-foreground">Связей с мерами</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold">{stats.byStatus.approved}</div>
            </div>
            <p className="text-xs text-muted-foreground">Одобрено</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 text-sm text-blue-900">
            <FileText className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Аналитический просмотр доказательств</p>
              <p className="text-blue-800 mt-1">
                Загружать доказательства нужно во вкладке <strong>"Меры"</strong> → раскрыть меру → кнопка "Загрузить" 
                рядом с требуемым типом доказательства. Здесь показан сводный view всех загруженных доказательств.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Все доказательства</CardTitle>
              <CardDescription>
                {filteredEvidence.length} доказательств • Сгруппировано по типам
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию, файлу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Badge 
                variant={statusFilter === "all" ? "outline" : "default"}
                className="cursor-pointer"
                onClick={() => setStatusFilter("all")}
              >
                Все
              </Badge>
              <Badge 
                variant={statusFilter === "approved" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setStatusFilter("approved")}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Одобрено
              </Badge>
              <Badge 
                variant={statusFilter === "pending" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setStatusFilter("pending")}
              >
                <Clock className="h-3 w-3 mr-1" />
                На проверке
              </Badge>
              <Badge 
                variant={statusFilter === "rejected" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setStatusFilter("rejected")}
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Отклонено
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEvidence.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Доказательства не найдены</p>
              <p className="text-sm mt-2">
                {searchQuery || statusFilter !== "all" 
                  ? "Попробуйте изменить фильтры или поисковый запрос" 
                  : "Загрузите доказательства во вкладке \"Меры\" для каждой конкретной меры"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Evidence by Type */}
              {evidenceByType.map((typeGroup) => (
                <div key={typeGroup.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {typeGroup.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">{typeGroup.count} док.</Badge>
                      <Badge variant="outline">{typeGroup.totalLinks} связей</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {typeGroup.evidence
                      .filter((e: any) => {
                        if (statusFilter !== "all" && e.status !== statusFilter) return false
                        if (searchQuery) {
                          const query = searchQuery.toLowerCase()
                          return (
                            e.title?.toLowerCase().includes(query) ||
                            e.file_name?.toLowerCase().includes(query)
                          )
                        }
                        return true
                      })
                      .map((ev: any) => (
                        <Card key={ev.id} className={cn(
                          "transition-all",
                          ev.linkCount > 1 && "border-l-4 border-l-green-600"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-medium">{ev.title || ev.file_name}</h5>
                                    
                                    {ev.status === 'approved' && (
                                      <Badge variant="default" className="bg-green-600">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Одобрено
                                      </Badge>
                                    )}
                                    {ev.status === 'pending' && (
                                      <Badge variant="secondary">
                                        <Clock className="h-3 w-3 mr-1" />
                                        На проверке
                                      </Badge>
                                    )}
                                    {ev.status === 'rejected' && (
                                      <Badge variant="destructive">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Отклонено
                                      </Badge>
                                    )}
                                    
                                    {ev.linkCount > 1 && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        Переиспользуется
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(ev.uploaded_at)}
                                    </span>
                                    <span>{(ev.file_size / 1024).toFixed(1)} КБ</span>
                                  </div>
                                  
                                  {/* Linked Measures */}
                                  {ev.linkedMeasures && ev.linkedMeasures.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <p className="text-xs font-medium text-muted-foreground mb-2">
                                        Связано с мерами ({ev.linkedMeasures.length}):
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {ev.linkedMeasures.map((link: any) => (
                                          <Badge key={link.linkId} variant="outline" className="text-xs">
                                            {link.measureTitle}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(ev.file_url, '_blank')}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
