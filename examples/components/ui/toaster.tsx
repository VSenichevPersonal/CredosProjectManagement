"use client"

import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Mini feedback - можно добавить мини-уведомление
      console.log('Скопировано в буфер обмена')
    })
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Формируем текст для копирования
        const copyText = [
          title ? (typeof title === 'string' ? title : '') : '',
          description ? (typeof description === 'string' ? description : '') : ''
        ].filter(Boolean).join('\n')

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            
            {/* Кнопка копирования */}
            {copyText && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => copyToClipboard(copyText)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

