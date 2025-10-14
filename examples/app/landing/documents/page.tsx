"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  CheckCircle,
  GitCompare,
  Clock,
  Users,
  FileSearch,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { Breadcrumbs } from "@/components/landing/breadcrumbs"

export default function DocumentsPage() {
  const features = [
    {
      icon: FileText,
      title: "Автогенерация документов",
      description:
        "Автоматическое создание политик, регламентов и процедур на основе требований регуляторов. Готовые шаблоны документов.",
    },
    {
      icon: GitCompare,
      title: "Версионирование",
      description:
        "Полная история изменений документов с возможностью сравнения версий. Откат к предыдущим версиям при необходимости.",
    },
    {
      icon: Clock,
      title: "Контроль актуальности",
      description:
        "Автоматические напоминания о пересмотре документов. Планирование актуализации с учётом изменений законодательства.",
    },
    {
      icon: Users,
      title: "Workflow согласования",
      description:
        "Настраиваемые маршруты согласования документов. Параллельное и последовательное согласование с контролем сроков.",
    },
    {
      icon: FileSearch,
      title: "Поиск и навигация",
      description:
        "Полнотекстовый поиск по всем документам. Фильтрация по категориям, статусам, авторам и датам утверждения.",
    },
    {
      icon: RefreshCw,
      title: "Актуализация по триггерам",
      description:
        "Автоматическое обновление документов при изменении требований регуляторов. Уведомления об устаревших положениях.",
    },
  ]

  const documentTypes = [
    {
      category: "Политики ИБ",
      items: [
        "Политика информационной безопасности",
        "Политика управления доступом",
        "Политика резервного копирования",
        "Политика реагирования на инциденты",
      ],
    },
    {
      category: "Регламенты",
      items: [
        "Регламент управления учётными записями",
        "Регламент проведения аудита ИБ",
        "Регламент обработки персональных данных",
        "Регламент управления уязвимостями",
      ],
    },
    {
      category: "Инструкции",
      items: [
        "Инструкция для пользователей ИС",
        "Инструкция по классификации информации",
        "Инструкция по работе с криптосредствами",
        "Инструкция по реагированию на инциденты",
      ],
    },
  ]

  const benefits = [
    "Автогенерация документов на основе требований",
    "Сокращение времени на разработку документов до 80%",
    "Автоматическая актуализация при изменении требований",
    "Полная история изменений и версионирование",
    "Автоматизированные процессы согласования",
    "Готовность к проверкам регуляторов",
  ]

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0f2942] via-[#1e3a52] to-[#2d4a5e] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#10b981]/10 via-transparent to-transparent -z-10" />

      {/* Grid pattern */}
      <svg className="fixed inset-0 h-full w-full opacity-[0.08] -z-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Content */}
      <div className="relative z-10">
        <LandingHeader />

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Документооборот" }]} />
        </div>

        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10b981]/20 mb-6">
            <FileText className="w-8 h-8 text-[#10b981]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Управление документами
            <br />
            <span className="text-[#10b981]">и автогенерация</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Автоматическое создание и поддержание актуальности нормативной документации. Версионирование, согласование
            и контроль сроков пересмотра документов.
          </p>
        </section>

        {/* Features - микс стилей */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const styles = [
                { bg: "from-[#10b981] to-[#059669]", border: "border-[#10b981]/50" },
                { bg: "from-[#3b82f6] to-[#2563eb]", border: "border-[#3b82f6]/50" },
              ]
              const style = styles[index % styles.length]
              return (
                <Card
                  key={index}
                  className={`bg-[#1e3a52]/80 border-2 ${style.border} hover:border-opacity-100 backdrop-blur-xl transition-all duration-300 hover:scale-105 group`}
                >
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${style.bg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-300 leading-relaxed">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Document Types */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Типы документов</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Полный набор документов для обеспечения соответствия требованиям регуляторов
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {documentTypes.map((type, index) => (
              <Card key={index} className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white text-xl mb-4">{type.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {type.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Auto-generation Process */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Процесс автогенерации документов</h2>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Анализ требований",
                  desc: "Система анализирует применимые требования регуляторов для вашей организации",
                },
                {
                  step: "2",
                  title: "Выбор шаблона",
                  desc: "Автоматический подбор подходящего шаблона документа из библиотеки",
                },
                {
                  step: "3",
                  title: "Генерация контента",
                  desc: "Создание документа с учётом специфики организации и требований",
                },
                {
                  step: "4",
                  title: "Согласование",
                  desc: "Автоматическая отправка на согласование ответственным лицам",
                },
                {
                  step: "5",
                  title: "Утверждение и публикация",
                  desc: "Финальное утверждение и публикация документа с уведомлениями пользователей",
                },
              ].map((item, index) => (
                <Card key={index} className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl">
                  <CardContent className="p-6 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-full bg-[#10b981] text-white text-2xl font-bold flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-gray-300">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="container mx-auto px-4 py-20">
          <Card className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center mb-4">Преимущества решения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <Card className="bg-[#1e3a52]/95 border-[#10b981]/50 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Автоматизируйте документооборот</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
                Создавайте и поддерживайте актуальность документов автоматически. Попробуйте бесплатно 30 дней.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-[#10b981] hover:bg-[#0d9668] text-white">
                    Начать работу
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/landing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#10b981] text-[#10b981] hover:bg-[#10b981]/20"
                  >
                    Вернуться на главную
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

