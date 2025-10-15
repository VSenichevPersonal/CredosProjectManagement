import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea' | 'select'
  value: string | number
  onChange: (value: string | number) => void
  onBlur?: () => void
  error?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  rows?: number
  selectOptions?: Array<{ value: string; label: string }>
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required,
  placeholder,
  disabled,
  className,
  rows = 3,
  selectOptions = [],
}: FormFieldProps) {
  const id = `field-${name}`
  const hasError = Boolean(error)

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <Textarea
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={cn(
            hasError && "border-red-500 focus-visible:ring-red-500"
          )}
        />
      )
    }

    if (type === 'select') {
      return (
        <Select
          value={String(value)}
          onValueChange={(val) => onChange(val)}
          disabled={disabled}
        >
          <SelectTrigger
            id={id}
            className={cn(
              hasError && "border-red-500 focus-visible:ring-red-500"
            )}
          >
            <SelectValue placeholder={placeholder || "Выберите..."} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => {
          if (type === 'number') {
            onChange(parseFloat(e.target.value) || 0)
          } else {
            onChange(e.target.value)
          }
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          hasError && "border-red-500 focus-visible:ring-red-500"
        )}
      />
    )
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id} className={cn(hasError && "text-red-600")}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderInput()}
      {hasError && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

