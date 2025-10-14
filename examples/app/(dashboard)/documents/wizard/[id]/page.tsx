import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { DocumentWizardComponent } from "@/components/documents/document-wizard"

export const metadata: Metadata = {
  title: "Мастер создания документов",
  description: "Пошаговый мастер для создания комплекта документов",
}

interface PageProps {
  params: {
    id: string
  }
}

// Временно - проверяем что packageId валиден
const validPackages = ["pkg-152fz-pdn-full"]

export default function DocumentWizardPage({ params }: PageProps) {
  const { id: packageId } = params

  // Проверяем что пакет существует
  if (!validPackages.includes(packageId)) {
    redirect("/documents/wizard/new")
  }

  return (
    <div className="container max-w-4xl py-6">
      <DocumentWizardComponent packageId={packageId} />
    </div>
  )
}

