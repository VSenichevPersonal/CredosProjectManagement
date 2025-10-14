"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronDown, Building2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"
import { EditOrganizationDialog } from "./edit-organization-dialog"

interface Organization {
  id: string
  name: string
  type: string
  level: number
  parent_id: string | null
  employee_count?: number
  children?: Organization[]
}

interface OrganizationTreeProps {
  data: Organization[]
  onSelect?: (org: Organization) => void
  selectedId?: string
  allOrganizations?: Organization[]
}

export function OrganizationTree({ data, onSelect, selectedId, allOrganizations = [] }: OrganizationTreeProps) {
  return (
    <div className="space-y-1">
      {data.map((org) => (
        <TreeNode
          key={org.id}
          organization={org}
          onSelect={onSelect}
          selectedId={selectedId}
          allOrganizations={allOrganizations}
        />
      ))}
    </div>
  )
}

function TreeNode({
  organization,
  onSelect,
  selectedId,
  allOrganizations = [],
  level = 0,
}: {
  organization: Organization
  onSelect?: (org: Organization) => void
  selectedId?: string
  allOrganizations?: Organization[]
  level?: number
}) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const [isHovered, setIsHovered] = useState(false)
  const hasChildren = organization.children && organization.children.length > 0
  const isSelected = selectedId === organization.id

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(organization)
    } else {
      router.push(`/organizations/${organization.id}`)
    }
  }

  return (
    <div>
      <div className="relative group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <Button
          variant="ghost"
          className={cn("w-full justify-start gap-2 font-normal", isSelected && "bg-accent")}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={handleCardClick}
        >
          {hasChildren ? (
            <span onClick={handleToggle} className="flex items-center">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
            </span>
          ) : (
            <span className="w-4" />
          )}
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-left">{organization.name}</span>
          {organization.employee_count && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {organization.employee_count}
            </span>
          )}
        </Button>

        {isHovered && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2" onClick={(e) => e.stopPropagation()}>
            <EditOrganizationDialog
              organization={organization}
              organizations={allOrganizations.map((org) => ({ id: org.id, name: org.name }))}
              variant="icon"
              size="sm"
            />
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {organization.children!.map((child) => (
            <TreeNode
              key={child.id}
              organization={child}
              onSelect={onSelect}
              selectedId={selectedId}
              allOrganizations={allOrganizations}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
