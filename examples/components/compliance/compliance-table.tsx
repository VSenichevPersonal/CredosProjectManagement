"use client"

import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/ui/status-badge"
import { UpdateStatusDialog } from "./update-status-dialog"
import type { Compliance } from "@/types/domain/compliance"
import type { Requirement } from "@/types/domain/requirement"
import type { Organization } from "@/types/domain/organization"
import { Eye, CheckSquare } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"
import { ComplianceProgressCell } from "./compliance-progress-cell"

interface ComplianceTableProps {
  items: (Compliance & {
    requirement?: Requirement
    organization?: Organization
  })[]
  onSort?: (field: string) => void
  sortField?: string
  sortDirection?: "asc" | "desc"
  SortIcon?: ({ field }: { field: string }) => React.JSX.Element
}

// Column definitions
const COMPLIANCE_COLUMNS: ColumnDefinition<Compliance & { requirement?: Requirement; organization?: Organization }>[] = [
  {
    id: "organization",
    label: "Организация",
    key: "organization",
    sortable: true,
    defaultVisible: true,
    render: (org: any) => <div className="font-medium">{org?.name || "—"}</div>,
    exportRender: (org: any) => org?.name || "",
  },
  {
    id: "requirement",
    label: "Требование",
    key: "requirement",
    sortable: true,
    defaultVisible: true,
    render: (req: any) =>
      req ? (
        <div className="max-w-xs">
          <div className="font-medium">{req.code}</div>
          <div className="text-sm text-muted-foreground truncate">{req.title}</div>
        </div>
      ) : (
        "—"
      ),
    exportRender: (req: any) => `${req?.code || ""} ${req?.title || ""}`.trim(),
  },
  {
    id: "status",
    label: "Статус",
    key: "status",
    sortable: true,
    defaultVisible: true,
    width: "150px",
    render: (status) => <StatusBadge status={status || "pending"} />,
    exportRender: (status) => status || "pending",
  },
  {
    id: "progress",
    label: "Прогресс выполнения",
    sortable: false,
    defaultVisible: true,
    width: "180px",
    render: (_, item) => <ComplianceProgressCell complianceId={item.id} />,
    exportRender: () => "Прогресс не экспортируется",
  },
  {
    id: "assigned_to",
    label: "Назначен",
    key: "assignedTo",
    sortable: false,
    defaultVisible: true,
    width: "120px",
    render: (value) => (
      <span className="text-sm text-muted-foreground">{value ? "Назначен" : "Не назначен"}</span>
    ),
  },
  {
    id: "updated_at",
    label: "Изменено",
    key: "updatedAt",
    sortable: true,
    defaultVisible: true,
    width: "160px",
    render: (value) => (
      <div className="text-sm text-muted-foreground">
        <div>{new Date(value).toLocaleDateString("ru-RU")}</div>
        <div className="text-xs">{new Date(value).toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    ),
    exportRender: (value) => new Date(value).toLocaleString("ru-RU"),
  },
  {
    id: "created_at",
    label: "Создано",
    key: "createdAt",
    sortable: true,
    defaultVisible: true,  // ✅ Теперь видимо по умолчанию
    width: "160px",
    render: (value) => (
      <div className="text-sm text-muted-foreground">
        <div>{new Date(value).toLocaleDateString("ru-RU")}</div>
        <div className="text-xs">{new Date(value).toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    ),
    exportRender: (value) => new Date(value).toLocaleString("ru-RU"),
  },
  {
    id: "actions",
    label: "Действия",
    sortable: false,
    defaultVisible: true,
    width: "120px",
    align: "right",
    render: (_, item) => (
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/compliance/${item.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <UpdateStatusDialog complianceId={item.id} currentStatus={item.status || "pending"} />
      </div>
    ),
  },
]

export function ComplianceTable({ items }: ComplianceTableProps) {
  const router = useRouter()

  return (
    <UniversalDataTable
      title="Записи соответствия"
      description="Управление соответствием организаций требованиям"
      icon={CheckSquare}
      data={items}
      columns={COMPLIANCE_COLUMNS}
      searchPlaceholder="Поиск по организации, требованию..."
      exportFilename="compliance-records"
      canExport={true}
      canImport={false}
      storageKey="compliance-table"
      onRowClick={(item) => router.push(`/compliance/${item.id}`)}
      emptyStateTitle="Нет записей соответствия"
      emptyStateDescription="Записи соответствия отсутствуют или не соответствуют фильтрам"
      emptyStateIcon={CheckSquare}
    />
  )
}
