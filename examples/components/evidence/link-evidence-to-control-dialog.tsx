"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Link } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LinkEvidenceToControlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  evidenceId: string
  controls: Array<{ id: string; code: string; title: string }>
  organizations?: Array<{ id: string; name: string }>
}

export function LinkEvidenceToControlDialog({
  open,
  onOpenChange,
  onSuccess,
  evidenceId,
  controls,
  organizations,
}: LinkEvidenceToControlDialogProps) {
  const [selectedControlId, setSelectedControlId] = useState<string>("none")
  const [selectedOrgId, setSelectedOrgId] = useState<string>("not_specified")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedControlId || selectedControlId === "none") {
      alert("Пожалуйста, выберите меру защиты")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/control-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controlId: selectedControlId,
          evidenceId,
          organizationId: selectedOrgId !== "not_specified" ? selectedOrgId : undefined,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to link evidence to control")
      }

      // Reset form
      setSelectedControlId("none")
      setSelectedOrgId("not_specified")
      setNotes("")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to link evidence:", error)
      alert("Не удалось связать доказательство с мерой защиты")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Связать доказательство с мерой защиты</DialogTitle>
          <DialogDescription>Выберите меру защиты, которая подтверждается этим доказательством</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="control">Мера защиты *</Label>
            <Select value={selectedControlId} onValueChange={setSelectedControlId} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите меру защиты" />
              </SelectTrigger>
              <SelectContent>
                {controls.map((control) => (
                  <SelectItem key={control.id} value={control.id}>
                    {control.code} - {control.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {organizations && organizations.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="organization">Организация (опционально)</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите организацию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_specified">Не указана</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация о связи"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedControlId || selectedControlId === "none"}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Связывание...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Связать
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
