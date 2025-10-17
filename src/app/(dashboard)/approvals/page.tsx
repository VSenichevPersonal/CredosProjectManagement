"use client"

import { useState, useEffect } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { ColumnDefinition } from "@/types/table"
import type { TimeEntry } from "@/types/domain"
import { CheckSquare, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface ExtendedTimeEntry extends TimeEntry {
  employeeName?: string
  projectName?: string
}

export default function ApprovalsPage() {
  const [data, setData] = useState<ExtendedTimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPendingEntries()
  }, [])

  const loadPendingEntries = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/time-entries/pending')
      if (response.ok) {
        const result = await response.json()
        setData(result.data || [])
      } else {
        throw new Error('Failed to load pending entries')
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: "Не удалось загрузить записи на согласовании",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите записи для утверждения",
      })
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/time-entries/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeEntryIds: selectedIds,
          approved: true,
          approvedBy: '00000000-0000-0000-0000-000000000001', // TODO: Get from auth session
        }),
      })

      if (response.ok) {
        toast({
          title: "Успешно!",
          description: `${selectedIds.length} записей утверждено`,
        })
        setSelectedIds([])
        loadPendingEntries()
      } else {
        throw new Error('Failed to approve')
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось утвердить записи",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите записи для отклонения",
      })
      return
    }
    setIsRejectDialogOpen(true)
  }

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Укажите причину отклонения",
      })
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/time-entries/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeEntryIds: selectedIds,
          rejectedBy: '00000000-0000-0000-0000-000000000001', // TODO: Get from auth session
          reason: rejectReason,
        }),
      })

      if (response.ok) {
        toast({
          title: "Отклонено",
          description: `${selectedIds.length} записей отклонено`,
        })
        setSelectedIds([])
        setRejectReason("")
        setIsRejectDialogOpen(false)
        loadPendingEntries()
      } else {
        throw new Error('Failed to reject')
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось отклонить записи",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleSingleApprove = async (entry: ExtendedTimeEntry) => {
    setSelectedIds([entry.id])
    setProcessing(true)
    try {
      const response = await fetch('/api/time-entries/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeEntryIds: [entry.id],
          approved: true,
          approvedBy: '00000000-0000-0000-0000-000000000001', // TODO: Get from auth session
        }),
      })

      if (response.ok) {
        toast({
          title: "Утверждено",
          description: `Запись от ${new Date(entry.date).toLocaleDateString('ru-RU')} утверждена`,
        })
        setSelectedIds([])
        loadPendingEntries()
      } else {
        throw new Error('Failed to approve')
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось утвердить запись",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.map(x => x.id))
    }
  }

  const columns: ColumnDefinition<ExtendedTimeEntry>[] = [
    {
      id: "select",
      label: (
        <Checkbox
          checked={selectedIds.length === data.length && data.length > 0}
          onCheckedChange={handleSelectAll}
        />
      ),
      key: "id",
      render: (v, row) => (
        <Checkbox
          checked={selectedIds.includes(row.id)}
          onCheckedChange={() => handleToggleSelect(row.id)}
        />
      )
    },
    { 
      id: "date", 
      label: "Дата", 
      key: "date", 
      sortable: true,
      render: (v) => new Date(v as string).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    { id: "employeeName", label: "Сотрудник", key: "employeeName" },
    { id: "projectName", label: "Проект", key: "projectName" },
    { id: "hours", label: "Часы", key: "hours", sortable: true, render: (v) => `${Number(v).toFixed(1)} ч` },
    { id: "description", label: "Описание", key: "description" },
    { 
      id: "status", 
      label: "Статус", 
      key: "status",
      render: () => <Badge className="bg-yellow-100 text-yellow-800">На согласовании</Badge>
    },
    {
      id: "actions",
      label: "Действия",
      key: "id",
      render: (v, row) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-green-600 hover:text-green-700"
            onClick={() => handleSingleApprove(row)}
            disabled={processing}
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex gap-2 items-center p-4 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-sm font-medium">
            Выбрано записей: {selectedIds.length}
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 hover:text-green-700"
              onClick={handleBulkApprove}
              disabled={processing}
            >
              <Check className="h-4 w-4 mr-1" />
              Утвердить выбранные
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={handleBulkReject}
              disabled={processing}
            >
              <X className="h-4 w-4 mr-1" />
              Отклонить выбранные
            </Button>
          </div>
        </div>
      )}

      <UniversalDataTable
        title="Согласование часов"
        description="Записи времени, ожидающие утверждения"
        icon={CheckSquare}
        data={data}
        columns={columns}
        isLoading={loading || processing}
        canExport
        exportFilename="approvals"
        emptyStateTitle="Нет записей на согласовании"
        emptyStateDescription="Все записи времени утверждены"
      />

      {/* Диалог причины отклонения */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить записи времени</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Причина отклонения *</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Укажите причину отклонения..."
                rows={4}
              />
            </div>
            <p className="text-sm text-gray-500">
              Будет отклонено записей: {selectedIds.length}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={processing}>
              Отмена
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectSubmit} 
              disabled={!rejectReason.trim() || processing}
            >
              {processing ? "Отклонение..." : "Отклонить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

