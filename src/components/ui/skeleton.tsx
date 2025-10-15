/**
 * Skeleton Components - Atomic Design System
 * Переиспользуемые loading states
 * 
 * Architecture:
 * - Atoms: Skeleton (base)
 * - Molecules: SkeletonRow, SkeletonCard
 * - Organisms: TableSkeleton, CardSkeleton, FormSkeleton
 * - Гибкость: все компоненты настраиваемы через props
 */

import { cn } from "@/lib/utils"

// ============================================================================
// ATOM: Base Skeleton
// ============================================================================

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

// ============================================================================
// MOLECULE: Skeleton Row (для таблиц)
// ============================================================================

interface SkeletonRowProps {
  columns: number
  className?: string
}

function SkeletonRow({ columns, className }: SkeletonRowProps) {
  return (
    <div className={cn("flex gap-4", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-10 flex-1" />
      ))}
    </div>
  )
}

// ============================================================================
// MOLECULE: Skeleton Card
// ============================================================================

interface SkeletonCardProps {
  lines?: number
  className?: string
}

function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-8 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

// ============================================================================
// ORGANISM: Table Skeleton (для UniversalDataTable)
// ============================================================================

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  showSearch?: boolean
  showPagination?: boolean
  className?: string
}

function TableSkeleton({ 
  rows = 5, 
  columns = 5, 
  showHeader = true,
  showSearch = true,
  showPagination = true,
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Search bar skeleton */}
      {showSearch && (
        <div className="flex gap-4 items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      {/* Table header */}
      {showHeader && (
        <div className="flex gap-4 pb-2 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-6 flex-1" />
          ))}
        </div>
      )}

      {/* Table rows */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} columns={columns} />
        ))}
      </div>

      {/* Pagination skeleton */}
      {showPagination && (
        <div className="flex justify-between items-center pt-4 border-t">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-64" />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ORGANISM: Card Skeleton (для Dashboard)
// ============================================================================

interface CardSkeletonProps {
  className?: string
}

function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn("p-6 border rounded-lg space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

// ============================================================================
// ORGANISM: Form Skeleton (для Dialog)
// ============================================================================

interface FormSkeletonProps {
  fields?: number
  className?: string
}

function FormSkeleton({ fields = 4, className }: FormSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 justify-end pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

// ============================================================================
// ORGANISM: List Skeleton
// ============================================================================

interface ListSkeletonProps {
  items?: number
  className?: string
}

function ListSkeleton({ items = 5, className }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// ORGANISM: Metric Card Skeleton (для Dashboard metrics)
// ============================================================================

function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 border rounded-lg bg-white", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  Skeleton,
  SkeletonRow,
  SkeletonCard,
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  ListSkeleton,
  MetricCardSkeleton
}
