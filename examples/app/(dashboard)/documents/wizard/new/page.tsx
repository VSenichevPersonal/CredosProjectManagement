import type { Metadata } from "next"
import { Sparkles, FileStack, Shield, Scale, Factory, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Создание документов | Мастер генерации",
  description: "Выберите пакет документов для автоматической генерации",
}

// Временные данные пакетов - потом будут из БД
const documentPackages = [
  {
    id: "pkg-152fz-pdn-full",
    code: "152fz-pdn-full",
    title: "Защита персональных данных (152-ФЗ)",
    description: "Полный комплект из 15 документов для соответствия требованиям 152-ФЗ: политики, инструкции, положения, приказы, ОРД",
    icon: ShieldCheck,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    regulators: ["Роскомнадзор"],
    frameworks: ["152-ФЗ", "Приказ РКН №996"],
    documentsCount: 15,
    estimatedTime: 45,
    complexity: "complex" as const,
    isAvailable: true,
  },
  {
    id: "pkg-187fz-kii-cat2",
    code: "187fz-kii-cat2",
    title: "КИИ категория 2 (187-ФЗ)",
    description: "Комплект документов для объектов критической информационной инфраструктуры категории 2",
    icon: Shield,
    color: "text-red-600",
    bgColor: "bg-red-50",
    regulators: ["ФСТЭК"],
    frameworks: ["187-ФЗ", "Приказ ФСТЭК №239"],
    documentsCount: 8,
    estimatedTime: 60,
    complexity: "complex" as const,
    isAvailable: false, // В разработке
  },
  {
    id: "pkg-fstec-17",
    code: "fstec-17",
    title: "Защита ГИС (Приказ ФСТЭК №17)",
    description: "Документы по защите государственных информационных систем",
    icon: Scale,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    regulators: ["ФСТЭК"],
    frameworks: ["Приказ ФСТЭК №17"],
    documentsCount: 7,
    estimatedTime: 45,
    complexity: "complex" as const,
    isAvailable: false,
  },
  {
    id: "pkg-production-safety",
    code: "production-safety",
    title: "Промышленная безопасность",
    description: "Комплект документов по охране труда и промышленной безопасности",
    icon: Factory,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    regulators: ["Ростехнадзор"],
    frameworks: ["116-ФЗ"],
    documentsCount: 6,
    estimatedTime: 40,
    complexity: "medium" as const,
    isAvailable: false,
  },
]

const complexityLabels = {
  simple: { label: "Простой", color: "bg-green-100 text-green-800" },
  medium: { label: "Средний", color: "bg-yellow-100 text-yellow-800" },
  complex: { label: "Сложный", color: "bg-red-100 text-red-800" },
}

export default function DocumentWizardNewPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Создание документов</h1>
          <p className="text-muted-foreground">
            Выберите пакет документов для автоматической генерации с помощью AI
          </p>
        </div>
      </div>

      {/* AI Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Генерация документов с помощью AI</h3>
            <p className="text-sm text-muted-foreground">
              Заполните анкету, и мы автоматически сгенерируем полный комплект документов, адаптированных под вашу
              организацию
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Пакеты документов */}
      <div className="grid gap-6 md:grid-cols-2">
        {documentPackages.map((pkg) => {
          const Icon = pkg.icon
          const complexity = complexityLabels[pkg.complexity]

          return (
            <Card
              key={pkg.id}
              className={`relative transition-all hover:shadow-lg ${
                pkg.isAvailable ? "cursor-pointer" : "opacity-60"
              }`}
            >
              {!pkg.isAvailable && (
                <div className="absolute right-4 top-4">
                  <Badge variant="outline" className="bg-background">
                    В разработке
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${pkg.bgColor}`}>
                    <Icon className={`h-6 w-6 ${pkg.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{pkg.title}</CardTitle>
                    <CardDescription className="mt-2">{pkg.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Регуляторы и НПА */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {pkg.regulators.map((regulator) => (
                      <Badge key={regulator} variant="secondary">
                        {regulator}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pkg.frameworks.map((framework) => (
                      <Badge key={framework} variant="outline">
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Информация */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileStack className="h-4 w-4" />
                    <span>{pkg.documentsCount} документов</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>~{pkg.estimatedTime} мин</span>
                  </div>
                  <Badge className={complexity.color}>{complexity.label}</Badge>
                </div>

                {/* Кнопка */}
                {pkg.isAvailable ? (
                  <Link href={`/documents/wizard/${pkg.id}`}>
                    <Button className="w-full" size="lg">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Начать генерацию
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Скоро доступно
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Информация о процессе */}
      <Card>
        <CardHeader>
          <CardTitle>Как это работает?</CardTitle>
          <CardDescription>Простой процесс создания документов за 7 шагов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                1
              </div>
              <h4 className="font-semibold">Выберите пакет</h4>
              <p className="text-sm text-muted-foreground">Выберите подходящую категорию документов</p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                2
              </div>
              <h4 className="font-semibold">Заполните анкету</h4>
              <p className="text-sm text-muted-foreground">Ответьте на вопросы о вашей организации</p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                3
              </div>
              <h4 className="font-semibold">AI уточнит детали</h4>
              <p className="text-sm text-muted-foreground">Умный помощник задаст уточняющие вопросы</p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                4
              </div>
              <h4 className="font-semibold">Получите документы</h4>
              <p className="text-sm text-muted-foreground">Готовые документы через 5-10 минут</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

