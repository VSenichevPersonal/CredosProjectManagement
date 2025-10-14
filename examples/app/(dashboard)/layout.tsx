import type React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { TenantProvider } from "@/lib/context/tenant-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TenantProvider>
      <AppLayout>{children}</AppLayout>
    </TenantProvider>
  )
}
