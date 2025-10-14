"use client"

import type React from "react"

import { useAuthorization } from "@/lib/hooks/use-authorization"

interface CanProps {
  resource: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ resource, action, children, fallback = null }: CanProps) {
  const { can, isLoading } = useAuthorization()

  if (isLoading) {
    return null
  }

  if (!can(resource, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
