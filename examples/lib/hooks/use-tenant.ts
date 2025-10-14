"use client"
import useSWR from "swr"

interface Tenant {
  id: string
  name: string
  slug: string
  description?: string
}

interface UseTenantResult {
  currentTenant: Tenant | null
  availableTenants: Tenant[]
  switchTenant: (tenantId: string) => Promise<void>
  isLoading: boolean
  error: Error | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useTenant(): UseTenantResult {
  const {
    data: currentData,
    error: currentError,
    isLoading: currentLoading,
    mutate,
  } = useSWR("/api/tenant/current", fetcher, {
    revalidateOnFocus: false,
  })

  const {
    data: availableData,
    error: availableError,
    isLoading: availableLoading,
  } = useSWR("/api/tenant/list", fetcher, {
    revalidateOnFocus: false,
  })

  const switchTenant = async (tenantId: string) => {
    const response = await fetch("/api/tenant/switch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tenantId }),
    })

    if (!response.ok) {
      throw new Error("Failed to switch tenant")
    }

    // Revalidate current tenant
    await mutate()

    // Reload page to refresh all data
    window.location.reload()
  }

  return {
    currentTenant: currentData?.tenant || null,
    availableTenants: availableData?.tenants || [],
    switchTenant,
    isLoading: currentLoading || availableLoading,
    error: currentError || availableError || null,
  }
}
