"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Building2, CheckCircle, Bell, BarChart3, Filter, ArrowRight } from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { Breadcrumbs } from "@/components/landing/breadcrumbs"

export default function RequirementsPage() {
  const features = [
    {
      icon: Building2,
      title: "База регуляторов",
      description:
        "Полная база требований ФСТЭК, ФСБ, Роскомнадзор, 152-ФЗ, 187-ФЗ и других регуляторов. Автоматическое обновление при изменении законодательства.",
    },
    {
      icon: Filter,
      title: "Матрица применимости",
      description:
        "Автоматический расчёт применимости требований на основе профиля организации. Учёт категории объектов, уровня защищённости, типа данных.",
    },
    {
      icon: CheckCircle,
      title: "Статус выполнения",
      description:
        "Отслеживание статуса выполнения каждого требования по всем подразделениям. Визуализация на дашбордах и в отчётах.",
    },
    {
      icon: Bell,
      title: "Проактивные уведомления",
      description:
        "Автоматические оповещения об изменениях в законодательстве, новых требованиях регуляторов и приближающихся сроках выполнения.",
    },
    {
      icon: BarChart3,
      title: "Аналитика и отчёты",
      description:
        "Консолидированные отчёты по выполнению требований, тепловые карты рисков, динамика изменений, экспорт в различные форматы.",
    },
    {
      icon: FileText,
      title: "Связь с документами",
      description:
        "Автоматическое сопоставление требований с внутренними политиками, процедурами и регламентами организации.",
    },
  ]

  const benefits = [
    "Централизованное хранилище всех требований регуляторов",
    "Автоматический расчёт применимости для каждого подразделения",
    "Контроль исполнения требований в режиме реального времени",
    "Готовность к проверкам регуляторов в любой момент",
    "Снижение рисков штрафов и санкций за несоответствие",
    "Экономия времени на ручной работе с требованиями до 80%",
  ]

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f2942] via-[#1e3a52] to-[#2d4a5e]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#10b981]/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#3b82f6]/10 via-transparent to-transparent" />

      {/* Grid pattern */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
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
          <Breadcrumbs items={[{ label: "Управление требованиями" }]} />
        </div>

        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10b981]/20 mb-6">
            <FileText className="w-8 h-8 text-[#10b981]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Управление требованиями
            <br />
            <span className="text-[#10b981]">регуляторов</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Централизованная система управления требованиями ФСТЭК, ФСБ, Роскомнадзор и других регуляторов с
            автоматическим расчётом применимости для вашей организации
          </p>
        </section>

        {/* Features - чередующиеся стили */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const gradients = [
                { bg: "from-[#10b981] to-[#059669]", border: "border-[#10b981]/50", hover: "hover:border-[#10b981]" },
                { bg: "from-[#3b82f6] to-[#2563eb]", border: "border-[#3b82f6]/50", hover: "hover:border-[#3b82f6]" },
              ]
              const style = gradients[index % gradients.length]
              return (
                <Card
                  key={index}
                  className={`bg-[#1e3a52]/80 border-2 ${style.border} ${style.hover} backdrop-blur-xl transition-all duration-300 hover:scale-105 group`}
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

        {/* How it works */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Как это работает</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Автоматизация полного цикла работы с требованиями регуляторов
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { step: "1", title: "Импорт требований", desc: "Загрузка требований из базы регуляторов", color: "from-[#10b981] to-[#059669]" },
              { step: "2", title: "Расчёт применимости", desc: "Автоматическое определение применимых требований", color: "from-[#3b82f6] to-[#2563eb]" },
              { step: "3", title: "Назначение мер", desc: "Связь требований с контрольными мероприятиями", color: "from-[#10b981] to-[#059669]" },
              { step: "4", title: "Контроль выполнения", desc: "Мониторинг статуса и отчётность", color: "from-[#3b82f6] to-[#2563eb]" },
            ].map((item, index) => (
              <Card key={index} className="bg-[#1e3a52]/90 border-2 border-white/10 backdrop-blur-xl text-center hover:scale-105 transition-all group">
                <CardContent className="pt-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:rotate-3 transition-transform`}>
                    {item.step}
                  </div>
                  <h3 className="text-white font-bold mb-2 text-lg">{item.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
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
              <h2 className="text-3xl font-bold text-white mb-4">Попробуйте систему управления требованиями</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
                Начните управлять требованиями регуляторов профессионально. Бесплатный период 30 дней.
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

