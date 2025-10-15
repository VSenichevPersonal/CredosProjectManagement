/**
 * ValidatedTextarea - Atomic Component
 * Переиспользуемый textarea с встроенной валидацией
 * 
 * Architecture:
 * - Atomic Design: Molecule (Textarea + FormField)
 * - Composition pattern
 */

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export interface ValidatedTextareaProps extends Omit<React.ComponentPropsWithoutRef<typeof Textarea>, 'onChange'> {
  label: string
  error?: string
  onValueChange?: (value: string) => void
  required?: boolean
}

export const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ label, error, onValueChange, required, className, id, ...props }, ref) => {
    const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange?.(e.target.value)
    }

    return (
      <div className="grid gap-2">
        <Label htmlFor={textareaId} className={cn(error && "text-red-600")}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Textarea
          ref={ref}
          id={textareaId}
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

ValidatedTextarea.displayName = "ValidatedTextarea"

