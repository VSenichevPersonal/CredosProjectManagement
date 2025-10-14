import type React from "react"
import { AppHeader } from "./app-header"
import { AppSidebar } from "./app-sidebar"
import { PageBreadcrumbs } from "./page-breadcrumbs"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader />
        <main className="min-h-[calc(100vh-4rem)] px-6 py-4">
          <PageBreadcrumbs />
          {children}
        </main>
      </div>
    </div>
  )
}
