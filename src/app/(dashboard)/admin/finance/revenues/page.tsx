"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ColumnDefinition } from "@/types/table"
import type { RevenueManual } from "@/types/domain"
import { DollarSign } from "lucide-react"

export default function RevenuesPage() {
  const [data, setData] = useState<RevenueManual[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    projectId: "",
    periodStart: "",
    periodEnd: "",
    amount: 0,
    currency: "RUB",
    notes: ""
  })

  const columns: ColumnDefinition<RevenueManual>[] = [
    { id: "periodStart", label: "Период начала", key: "periodStart", sortable: true },
    { id: "periodEnd", label: "Период окончания", key: "periodEnd", sortable: true },
    { id: "amount", label: "Сумма", key: "amount", sortable: true, render: (v) => `${v.toLocaleString('ru')} ₽` },
    { id: "notes", label: "Примечание", key: "notes" },
  ]

  const handleAdd = () => {
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    const res = await fetch("/api/finance/revenues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })
    if (res.ok) {
      const created = await res.json()
      setData([...data, created])
      setIsDialogOpen(false)
      setFormData({ projectId: "", periodStart: "", periodEnd: "", amount: 0, currency: "RUB", notes: "" })
    }
  }

  return (
    <>
      <UniversalDataTable
        title="Ручные доходы"
        description="Регистрация доходов по периодам для проектов"
        icon={DollarSign}
        data={data}
        columns={columns}
        onAdd={handleAdd}
        addButtonLabel="Добавить доход"
        canExport
        exportFilename="revenues"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый доход</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Проект</Label>
              <Select value={formData.projectId} onValueChange={(v) => setFormData({...formData, projectId: v})}>
                <SelectTrigger><SelectValue placeholder="Выберите проект" /></SelectTrigger>
                <SelectContent><SelectItem value="proj-1">Проект 1</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Дата начала</Label>
                <Input type="date" value={formData.periodStart} onChange={(e) => setFormData({...formData, periodStart: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Дата окончания</Label>
                <Input type="date" value={formData.periodEnd} onChange={(e) => setFormData({...formData, periodEnd: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Сумма (₽)</Label>
              <Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} />
            </div>
            <div className="grid gap-2">
              <Label>Примечание</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

