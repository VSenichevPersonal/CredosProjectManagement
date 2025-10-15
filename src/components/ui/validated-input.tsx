/**
 * ValidatedInput - Atomic Component
 * Переиспользуемый input с встроенной валидацией
 * 
 * Architecture:
 * - Atomic Design: Molecule (Input + FormField)
 * - Composition pattern
 * - Single Responsibility
 */

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export interface ValidatedInputProps extends Omit<React.ComponentPropsWithoutRef<typeof Input>, 'onChange'> {
  label: string
  error?: string
  onValueChange?: (value: string) => void
  required?: boolean
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, error, onValueChange, required, className, id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value)
    }

    return (
      <div className="grid gap-2">
        <Label htmlFor={inputId} className={cn(error && "text-red-600")}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          ref={ref}
          id={inputId}
          onChange={handleChange}
          className={cn(error && 'border-red-500', className)}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }
)

ValidatedInput.displayName = "ValidatedInput"

