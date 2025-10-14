"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Check, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SaveDocumentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documents: any[]
  onSave: (selectedDocs: any[], options: SaveOptions) => Promise<void>
}

interface SaveOptions {
  organizationId?: string
  documentTypeId?: string
  confidentialityLevel: string
}

export function SaveDocumentsDialog({
  open,
  onOpenChange,
  documents,
  onSave
}: SaveDocumentsDialogProps) {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(
    new Set(documents.map(d => d.id))
  )
  const [isSaving, setIsSaving] = useState(false)
  const [confidentialityLevel, setConfidentialityLevel] = useState("internal")

  const handleToggleAll = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(documents.map(d => d.id)))
    }
  }

  const handleToggleDoc = (docId: string) => {
    const newSelected = new Set(selectedDocs)
    if (newSelected.has(docId)) {
      newSelected.delete(docId)
    } else {
      newSelected.add(docId)
    }
    setSelectedDocs(newSelected)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const selected = documents.filter(d => selectedDocs.has(d.id))
      
      await onSave(selected, {
        confidentialityLevel
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCount = selectedDocs.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Сохранить документы в библиотеку</DialogTitle>
          <DialogDescription>
            Выберите документы для сохранения и укажите параметры
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Параметры сохранения */}
          <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
            <h4 className="font-semibold text-sm">Параметры документов</h4>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="confidentiality">Уровень конфиденциальности</Label>
                <Select value={confidentialityLevel} onValueChange={setConfidentialityLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Открытый</SelectItem>
                    <SelectItem value="internal">Внутреннее использование</SelectItem>
                    <SelectItem value="confidential">Конфиденциально</SelectItem>
                    <SelectItem value="secret">Строго конфиденциально</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Срок хранения</Label>
                <Input value="Постоянно" readOnly className="bg-muted" />
              </div>
            </div>
          </div>

          {/* Выбор документов */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">
                Документы ({selectedCount} из {documents.length})
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleAll}
              >
                {selectedCount === documents.length ? "Снять всё" : "Выбрать всё"}
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {documents.map((doc) => {
                const isSelected = selectedDocs.has(doc.id)
                
                return (
                  <div
                    key={doc.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleToggleDoc(doc.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleDoc(doc.id)}
                      className="mt-1"
                    />
                    
                    <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">{doc.title}</div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={
                            doc.confidence >= 90 ? "bg-green-100 text-green-800" : 
                            doc.confidence >= 75 ? "bg-yellow-100 text-yellow-800" : 
                            "bg-red-100 text-red-800"
                          }
                        >
                          Уверенность: {doc.confidence}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(doc.content.length / 1000)} KB
                        </span>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving || selectedCount === 0}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Сохранить {selectedCount} {selectedCount === 1 ? 'документ' : selectedCount < 5 ? 'документа' : 'документов'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

