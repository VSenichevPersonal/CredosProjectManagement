"use client"

import { Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface ContextualHelpProps {
  title: string
  content: string
}

export function ContextualHelp({ title, content }: ContextualHelpProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Помощь</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">{title}</h4>
          <p className="text-sm text-muted-foreground">{content}</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
