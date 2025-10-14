import { cn } from "@/lib/utils/cn"

interface RequirementCodeProps {
  code: string
  className?: string
}

export function RequirementCode({ code, className }: RequirementCodeProps) {
  return (
    <code
      className={cn(
        "inline-flex items-center rounded bg-neutral-100 px-2 py-1 font-mono text-sm font-medium text-neutral-800",
        className,
      )}
    >
      {code}
    </code>
  )
}
