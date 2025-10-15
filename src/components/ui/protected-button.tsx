/**
 * ProtectedButton - Atomic Component
 * Button с встроенной проверкой permissions
 * 
 * Architecture:
 * - Atomic Design: Molecule (Button + Permission Check)
 * - Composition pattern
 * - Access Control integration
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"
import type { Permission } from "@/lib/access-control/permissions"

export interface ProtectedButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  permission?: Permission
  fallback?: React.ReactNode
  hideIfNoPermission?: boolean
}

export const ProtectedButton = React.forwardRef<HTMLButtonElement, ProtectedButtonProps>(
  ({ permission, fallback, hideIfNoPermission = true, children, ...props }, ref) => {
    const { hasPermission } = useAuth()

    // Если permission не указан - показываем кнопку
    if (!permission) {
      return <Button ref={ref} {...props}>{children}</Button>
    }

    const hasAccess = hasPermission(permission)

    // Если нет доступа и нужно скрыть
    if (!hasAccess && hideIfNoPermission) {
      return fallback ? <>{fallback}</> : null
    }

    // Если нет доступа но показываем disabled
    if (!hasAccess && !hideIfNoPermission) {
      return (
        <Button ref={ref} {...props} disabled>
          {children}
        </Button>
      )
    }

    // Есть доступ
    return <Button ref={ref} {...props}>{children}</Button>
  }
)

ProtectedButton.displayName = "ProtectedButton"

