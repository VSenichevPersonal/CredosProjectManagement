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
import type { SalaryRegister } from "@/types/domain"
import { Wallet } from "lucide-react"

export default function SalaryRegisterPage() {
  const [data, setData] = useState<SalaryRegister[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    periodStart: "",
    periodEnd: "",
    employeeId: "",
    directionId: "",
    amount: 0,
    source: "manual",
    description: ""
  })

  const columns: ColumnDefinition<SalaryRegister>[] = [
    { id: "periodStart", label: "Период начала", key: "periodStart", sortable: true },
    { id: "periodEnd", label: "Период окончания", key: "periodEnd", sortable: true },
    { id: "amount", label: "Сумма (₽)", key: "amount", sortable: true, render: (v) => v.toLocaleString('ru') },
    { id: "source", label: "Источник", key: "source" },
    { id: "description", label: "Описание", key: "description" },
  ]

  const handleAdd = () => {
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    const res = await fetch("/api/finance/salary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })
    if (res.ok) {
      const created = await res.json()
      setData([...data, created])
      setIsDialogOpen(false)
      setFormData({ periodStart: "", periodEnd: "", employeeId: "", directionId: "", amount: 0, source: "manual", description: "" })
    }
  }

  return (
    <>
      <UniversalDataTable
        title="Реестр зарплат"
        description="Регистрация зарплат сотрудников по периодам"
        icon={Wallet}
        data={data}
        columns={columns}
        onAdd={handleAdd}
        addButtonLabel="Добавить запись"
        canExport
        exportFilename="salary-register"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая запись зарплаты</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Дата начала периода</Label>
                <Input type="date" value={formData.periodStart} onChange={(e) => setFormData({...formData, periodStart: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Дата окончания периода</Label>
                <Input type="date" value={formData.periodEnd} onChange={(e) => setFormData({...formData, periodEnd: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Сотрудник (опционально)</Label>
              <Select value={formData.employeeId} onValueChange={(v) => setFormData({...formData, employeeId: v})}>
                <SelectTrigger><SelectValue placeholder="Выберите сотрудника или оставьте пустым" /></SelectTrigger>
                <SelectContent><SelectItem value="">Не указан</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Направление (опционально)</Label>
              <Select value={formData.directionId} onValueChange={(v) => setFormData({...formData, directionId: v})}>
                <SelectTrigger><SelectValue placeholder="Выберите направление или оставьте пустым" /></SelectTrigger>
                <SelectContent><SelectItem value="">Не указано</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Сумма (₽)</Label>
              <Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} />
            </div>
            <div className="grid gap-2">
              <Label>Описание</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
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

