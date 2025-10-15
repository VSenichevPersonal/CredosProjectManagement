/**
 * ValidatedSelect - Atomic Component
 * Переиспользуемый select с встроенной валидацией
 * 
 * Architecture:
 * - Atomic Design: Molecule (Select + FormField)
 * - Composition pattern
 */

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
}

export interface ValidatedSelectProps {
  label: string
  error?: string
  value?: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export const ValidatedSelect = React.forwardRef<HTMLButtonElement, ValidatedSelectProps>(
  ({ label, error, value, onValueChange, options, placeholder, required, disabled, className }, ref) => {
    const selectId = `select-${label.toLowerCase().replace(/\s+/g, '-')}`
    
    return (
      <div className="grid gap-2">
        <Label htmlFor={selectId} className={cn(error && "text-red-600")}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger 
            ref={ref}
            id={selectId}
            className={cn(error && 'border-red-500', className)}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

ValidatedSelect.displayName = "ValidatedSelect"

