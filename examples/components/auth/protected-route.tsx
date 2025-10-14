"use client"

import type React from "react"

import { useAuthorization } from "@/lib/hooks/use-authorization"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ProtectedRouteProps {
  children: React.ReactNode
  resource: string
  action: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, resource, action, fallback }: ProtectedRouteProps) {
  const { can, isLoading } = useAuthorization()

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!can(resource, action)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            У вас нет прав для просмотра этой страницы. Обратитесь к администратору для получения доступа.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}
