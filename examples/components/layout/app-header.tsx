"use client"

import { User, LogOut, Settings, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/layout/notification-bell"
import { HelpButton } from "@/components/help/help-button"
import { GlobalSearch } from "@/components/search/global-search"
import { TenantSwitcher } from "@/components/layout/tenant-switcher"
import { useTenant } from "@/lib/context/tenant-context"
import { useAuthorization } from "@/lib/hooks/use-authorization"
import { useEffect, useState } from "react"

export function AppHeader() {
  const router = useRouter()
  const { tenant } = useTenant()
  const { can } = useAuthorization()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const canSwitch = can("tenants", "manage")

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setIsSuperAdmin(data.role === "super_admin")
        }
      } catch (error) {
        console.error("[AppHeader] Failed to check super_admin:", error)
      }
    }

    checkSuperAdmin()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header
      className="sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6"
      style={{
        backgroundColor: "var(--bg-header)",
        borderColor: "var(--header-border)",
        color: "var(--header-foreground)",
      }}
    >
      <div className="flex items-center">{tenant && <TenantSwitcher canSwitch={canSwitch || isSuperAdmin} />}</div>

      <div className="flex items-center gap-4">
        <GlobalSearch />

        <NotificationBell />

        <HelpButton />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/landing")}>
              <Home className="mr-2 h-4 w-4" />
              О продукте
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Настройки профиля
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
