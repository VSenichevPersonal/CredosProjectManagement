"use client"

import type React from "react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Search } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CreateControlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateControlDialog({ open, onOpenChange, onSuccess }: CreateControlDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    type: "preventive",
    frequency: "monthly",
    owner: "",
    isAutomated: false,
    requirementIds: [] as string[],
  })

  const [requirements, setRequirements] = useState<any[]>([])
  const [requirementsOpen, setRequirementsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useState(() => {
    fetch("/api/requirements")
      .then((res) => res.json())
      .then((data) => setRequirements(data.data || []))
      .catch(console.error)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/controls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to create control")

      onSuccess()
      setFormData({
        code: "",
        title: "",
        description: "",
        type: "preventive",
        frequency: "monthly",
        owner: "",
        isAutomated: false,
        requirementIds: [],
      })
    } catch (error) {
      console.error("Failed to create control:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedRequirements = requirements.filter((r) => formData.requirementIds.includes(r.id))
  const filteredRequirements = requirements.filter(
    (r) =>
      !formData.requirementIds.includes(r.id) &&
      (r.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title?.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const addRequirement = (requirementId: string) => {
    setFormData({ ...formData, requirementIds: [...formData.requirementIds, requirementId] })
    setRequirementsOpen(false)
    setSearchQuery("")
  }

  const removeRequirement = (requirementId: string) => {
    setFormData({ ...formData, requirementIds: formData.requirementIds.filter((id) => id !== requirementId) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать меру защиты</DialogTitle>
          <DialogDescription>Добавьте новую меру защиты информации</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Код меры</Label>
              <Input
                id="code"
                placeholder="CTRL-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Тип меры</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Превентивный</SelectItem>
                  <SelectItem value="detective">Детективный</SelectItem>
                  <SelectItem value="corrective">Корректирующий</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              placeholder="Название меры защиты"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Подробное описание меры защиты..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="frequency">Частота выполнения</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="continuous">Непрерывно</SelectItem>
                  <SelectItem value="daily">Ежедневно</SelectItem>
                  <SelectItem value="weekly">Еженедельно</SelectItem>
                  <SelectItem value="monthly">Ежемесячно</SelectItem>
                  <SelectItem value="quarterly">Ежеквартально</SelectItem>
                  <SelectItem value="annually">Ежегодно</SelectItem>
                  <SelectItem value="on_demand">По требованию</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="owner">Ответственный</Label>
              <Input
                id="owner"
                placeholder="Имя ответственного"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Связанные требования (опционально)</Label>
            <Popover open={requirementsOpen} onOpenChange={setRequirementsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start bg-transparent">
                  <Search className="h-4 w-4 mr-2" />
                  Выбрать требования
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Поиск требований..." value={searchQuery} onValueChange={setSearchQuery} />
                  <CommandList>
                    <CommandEmpty>Требования не найдены</CommandEmpty>
                    <CommandGroup>
                      {filteredRequirements.slice(0, 10).map((req) => (
                        <CommandItem key={req.id} onSelect={() => addRequirement(req.id)}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">{req.code}</span>
                            </div>
                            <span className="text-sm">{req.title}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedRequirements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedRequirements.map((req) => (
                  <Badge key={req.id} variant="secondary" className="gap-1">
                    <span className="text-xs">{req.code}</span>
                    <button
                      type="button"
                      onClick={() => removeRequirement(req.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Выберите требования, которые закрывает эта мера защиты</p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isAutomated"
              checked={formData.isAutomated}
              onCheckedChange={(checked) => setFormData({ ...formData, isAutomated: checked as boolean })}
            />
            <Label htmlFor="isAutomated" className="cursor-pointer">
              Мера автоматизирована
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Создание..." : "Создать меру защиты"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
