"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Building2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTenant } from "@/lib/context/tenant-context"

interface TenantSwitcherProps {
  canSwitch: boolean
}

interface Tenant {
  id: string
  name: string
  slug: string
  isActive: boolean
}

export function TenantSwitcher({ canSwitch }: TenantSwitcherProps) {
  const { tenant, availableTenants, switchTenant, isLoading } = useTenant()
  const [open, setOpen] = useState(false)
  const [allTenants, setAllTenants] = useState<Tenant[]>([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setIsSuperAdmin(data.role === "super_admin")

          // If super_admin, load all tenants
          if (data.role === "super_admin") {
            await loadAllTenants()
          }
        }
      } catch (error) {
        console.error("[TenantSwitcher] Failed to check super_admin:", error)
      }
    }

    checkSuperAdmin()
  }, [])

  const loadAllTenants = async () => {
    setIsLoadingTenants(true)
    try {
      const response = await fetch("/api/admin/tenants")
      if (response.ok) {
        const data = await response.json()
        setAllTenants(data)
      }
    } catch (error) {
      console.error("[TenantSwitcher] Failed to load all tenants:", error)
    } finally {
      setIsLoadingTenants(false)
    }
  }

  if (isLoading || !tenant) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/90">
        <Building2 className="h-4 w-4 animate-pulse" />
        <span className="font-medium">Загрузка...</span>
      </div>
    )
  }

  if (!canSwitch && !isSuperAdmin) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/90">
        <Building2 className="h-4 w-4" />
        <span className="font-medium">{tenant.name}</span>
      </div>
    )
  }

  const tenantsToShow = isSuperAdmin ? allTenants : availableTenants

  const handleSelect = async (selectedTenant: Tenant) => {
    if (selectedTenant.id === tenant.id) {
      setOpen(false)
      return
    }

    try {
      if (isSuperAdmin) {
        const response = await fetch(`/api/admin/tenants/${selectedTenant.id}/switch`, {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error("Failed to switch tenant")
        }

        // Reload page to refresh context
        window.location.reload()
      } else {
        await switchTenant(selectedTenant.id)
      }

      setOpen(false)
    } catch (error) {
      console.error("[TenantSwitcher] Failed to switch tenant:", error)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-[280px] justify-between text-white hover:bg-white/10"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{tenant.name}</span>
            {isSuperAdmin && <Shield className="h-3 w-3 text-yellow-400" />}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Поиск организации..." />
          <CommandList>
            <CommandEmpty>{isLoadingTenants ? "Загрузка..." : "Организация не найдена"}</CommandEmpty>
            <CommandGroup>
              {isSuperAdmin && (
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Режим супер-администратора
                </div>
              )}
              {tenantsToShow.map((t) => (
                <CommandItem key={t.id} value={t.name} onSelect={() => handleSelect(t)}>
                  <Check className={cn("mr-2 h-4 w-4", tenant.id === t.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      {!t.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Неактивен
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{t.slug}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
