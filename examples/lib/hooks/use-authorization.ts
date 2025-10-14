"use client"
import useSWR from "swr"

interface Permission {
  id: string
  resource: string
  action: string
}

interface UseAuthorizationResult {
  can: (resource: string, action: string) => boolean
  canAny: (checks: Array<{ resource: string; action: string }>) => boolean
  canAll: (checks: Array<{ resource: string; action: string }>) => boolean
  permissions: Permission[]
  isLoading: boolean
  error: Error | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useAuthorization(): UseAuthorizationResult {
  const { data, error, isLoading } = useSWR("/api/auth/permissions", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  const permissions: Permission[] = data?.permissions || []

  const can = (resource: string, action: string): boolean => {
    return permissions.some((p) => p.resource === resource && p.action === action)
  }

  const canAny = (checks: Array<{ resource: string; action: string }>): boolean => {
    return checks.some((check) => can(check.resource, check.action))
  }

  const canAll = (checks: Array<{ resource: string; action: string }>): boolean => {
    return checks.every((check) => can(check.resource, check.action))
  }

  return {
    can,
    canAny,
    canAll,
    permissions,
    isLoading,
    error: error || null,
  }
}
