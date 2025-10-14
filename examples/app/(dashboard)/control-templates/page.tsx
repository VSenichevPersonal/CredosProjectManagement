/**
 * @intent: Control Templates page - library of reusable control templates
 * @llm-note: Main page for managing control templates (типовые меры)
 */

import { Suspense } from "react"
import { ControlTemplatesLibrary } from "@/components/control-templates/control-templates-library"

export default function ControlTemplatesPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Загрузка...</p></div>}>
      {/* ControlTemplatesLibrary uses ReferenceBookLayout - handles all UI */}
      <ControlTemplatesLibrary />
    </Suspense>
  )
}
