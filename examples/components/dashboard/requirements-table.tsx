"use client"

import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/ui/status-badge"
import { CriticalityBadge } from "@/components/ui/criticality-badge"
import { RequirementCode } from "@/components/ui/requirement-code"
import { Badge } from "@/components/ui/badge"
import { RequirementStatusBadge } from "@/components/requirements/requirement-status-badge"
import { RegulatoryFrameworkBadge } from "@/components/ui/regulatory-framework-badge"
import { FileText } from "lucide-react"
import type { Requirement } from "@/types/domain/requirement"
import type { Compliance } from "@/types/domain/compliance"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"

interface RequirementsTableProps {
  requirements: (Requirement & { compliance?: Compliance })[]
  onSort?: (field: string) => void
  sortField?: string
  sortDirection?: "asc" | "desc"
  SortIcon?: React.ComponentType<{ field: string }>
}

// Helper function
const isExpired = (expirationDate?: Date | null) => {
  if (!expirationDate) return false
  return new Date(expirationDate) < new Date()
}

// Column definitions
const REQUIREMENTS_COLUMNS: ColumnDefinition<Requirement & { compliance?: Compliance }>[] = [
  {
    id: "code",
    label: "Код",
    key: "code",
    sortable: true,
    defaultVisible: true,
    width: "140px",
    render: (code, req) => (
      <div className="flex items-center gap-2">
        <RequirementCode code={code} />
        {isExpired(req.expirationDate) && (
          <Badge variant="outline" className="text-xs">
            Отменено
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: "title",
    label: "Название",
    key: "title",
    sortable: true,
    defaultVisible: true,
    render: (title) => <div className="max-w-md truncate font-medium">{title}</div>,
  },
  {
    id: "regulatory_framework",
    label: "Нормативная база",
    key: "regulatoryFramework",
    sortable: false,
    defaultVisible: true,
    width: "180px",
    render: (framework: any) =>
      framework ? (
        <RegulatoryFrameworkBadge
          code={framework.code}
          badgeText={framework.badgeText}
          badgeColor={framework.badgeColor}
        />
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
    exportRender: (framework: any) => framework?.name || "",
  },
  {
    id: "document_status",
    label: "Статус документа",
    key: "documentStatus",
    sortable: true,
    defaultVisible: true,
    width: "150px",
    render: (status) =>
      status ? <RequirementStatusBadge status={status} /> : <span className="text-sm text-muted-foreground">—</span>,
  },
  {
    id: "criticality",
    label: "Критичность",
    key: "criticality",
    sortable: true,
    defaultVisible: true,
    width: "120px",
    render: (level) => <CriticalityBadge level={level} />,
  },
  {
    id: "effective_date",
    label: "Дата введения",
    key: "effectiveDate",
    sortable: true,
    defaultVisible: false,
    width: "140px",
    render: (date) =>
      date ? (
        <span className="text-sm">{new Date(date).toLocaleDateString("ru-RU")}</span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    id: "expiration_date",
    label: "Дата отмены",
    key: "expirationDate",
    sortable: true,
    defaultVisible: false,
    width: "140px",
    render: (date) =>
      date ? (
        <span className="text-sm">{new Date(date).toLocaleDateString("ru-RU")}</span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    id: "compliance_status",
    label: "Статус соответствия",
    key: "compliance",
    sortable: false,
    defaultVisible: true,
    width: "160px",
    render: (compliance: any) =>
      compliance ? <StatusBadge status={compliance.status} /> : <span className="text-sm text-muted-foreground">—</span>,
  },
]

export function RequirementsTable({ requirements }: RequirementsTableProps) {
  const router = useRouter()

  return (
    <UniversalDataTable
      title="Требования"
      description="Реестр нормативных требований"
      icon={FileText}
      data={requirements}
      columns={REQUIREMENTS_COLUMNS}
      searchPlaceholder="Поиск по коду, названию требования..."
      exportFilename="requirements"
      canExport={true}
      canImport={false}
      storageKey="requirements-table"
      onRowClick={(req) => router.push(`/requirements/${req.id}`)}
      rowClassName={(req) => isExpired(req.expirationDate) ? "opacity-60" : ""}
      emptyStateTitle="Нет требований"
      emptyStateDescription="Требования отсутствуют или не соответствуют фильтрам"
      emptyStateIcon={FileText}
    />
  )
}
