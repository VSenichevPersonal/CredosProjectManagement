/**
 * @intent: React Context for tenant information on client side
 * @llm-note: Use this hook in components to access current tenant
 * @architecture: Client-side context - syncs with server via API
 */

"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface Tenant {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface TenantContextValue {
  tenant: Tenant | null
  isLoading: boolean
  error: Error | null
  switchTenant: (tenantId: string) => Promise<void>
  availableTenants: Tenant[]
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined)

/**
 * @intent: Provider component for tenant context
 * @precondition: Must be wrapped in auth provider
 * @postcondition: Provides tenant info to all child components
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load current tenant on mount
  useEffect(() => {
    // Wait for Supabase auth to fully initialize after redirect
    const timer = setTimeout(() => {
      loadCurrentTenant()
      loadAvailableTenants()
    }, 100) // Small delay to let auth settle

    return () => clearTimeout(timer)
  }, [])

  const loadCurrentTenant = async () => {
    try {
      setIsLoading(true)
      console.log("[v0] [TenantContext] Loading current tenant...")

      let response
      try {
        response = await fetch("/api/tenant/current")
      } catch (fetchError) {
        console.log(
          "[v0] [TenantContext] Fetch failed (auth initializing):",
          fetchError instanceof Error ? fetchError.message : "Unknown error",
        )
        setTenant(null)
        setError(null)
        setIsLoading(false)
        return
      }

      console.log("[v0] [TenantContext] Response status:", response.status)

      if (response.status === 401) {
        console.log("[v0] [TenantContext] User not authenticated")
        setTenant(null)
        setError(null)
        setIsLoading(false)
        return
      }

      if (response.status === 404) {
        console.log("[v0] [TenantContext] No tenant assigned to user")
        setTenant(null)
        setError(null)
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] [TenantContext] API error:", response.status, errorData)
        throw new Error(errorData.error || "Failed to load current tenant")
      }

      const data = await response.json()
      console.log("[v0] [TenantContext] Loaded tenant:", data.tenant)
      setTenant(data.tenant)
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      if (error.message.includes("Failed to load current tenant")) {
        setError(error)
      }
      console.error("[v0] [TenantContext] Failed to load tenant:", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableTenants = async () => {
    try {
      let response
      try {
        response = await fetch("/api/tenant/list")
      } catch (fetchError) {
        console.log("[v0] [TenantContext] Fetch tenant list failed (likely not authenticated yet)")
        return
      }

      if (response.status === 401) {
        console.log("[v0] [TenantContext] User not authenticated for tenant list")
        return
      }

      if (!response.ok) {
        console.log("[v0] [TenantContext] Failed to load available tenants")
        return
      }

      const data = await response.json()
      setAvailableTenants(data.tenants || [])
    } catch (err) {
      console.error("[v0] [TenantContext] Failed to load available tenants:", err)
    }
  }

  const switchTenant = async (tenantId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/tenant/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      })

      if (!response.ok) {
        throw new Error("Failed to switch tenant")
      }

      const data = await response.json()
      setTenant(data.tenant)
      setError(null)

      // Reload page to refresh all data with new tenant context
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
      console.error("[v0] [TenantContext] Failed to switch tenant:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isLoading,
        error,
        switchTenant,
        availableTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

/**
 * @intent: Hook to access tenant context
 * @precondition: Must be used within TenantProvider
 * @postcondition: Returns current tenant and operations
 */
export function useTenant() {
  const context = useContext(TenantContext)

  if (context === undefined) {
    throw new Error("useTenant must be used within TenantProvider")
  }

  return context
}
