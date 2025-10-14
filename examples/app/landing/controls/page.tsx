"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Shield,
  CheckCircle,
  Calendar,
  Users,
  FileCheck,
  TrendingUp,
  ArrowRight,
  ListChecks,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { Breadcrumbs } from "@/components/landing/breadcrumbs"

export default function ControlsPage() {
  const features = [
    {
      icon: ListChecks,
      title: "Контрольные мероприятия",
      description:
        "Планирование и проведение контрольных мероприятий по графику. Автоматическое назначение ответственных и контроль сроков выполнения.",
    },
    {
      icon: Shield,
      title: "Меры защиты",
      description:
        "База организационных и технических мер защиты информации. Связь с требованиями регуляторов и автоматическое формирование плана мероприятий.",
    },
    {
      icon: Calendar,
      title: "График мероприятий",
      description:
        "Календарь контрольных мероприятий с напоминаниями. Интеграция с рабочими календарями сотрудников, учёт праздников и выходных.",
    },
    {
      icon: Users,
      title: "Назначение ответственных",
      description:
        "Автоматическое распределение мероприятий между ответственными. Контроль загрузки специалистов и баланс задач.",
    },
    {
      icon: FileCheck,
      title: "Сбор доказательств",
      description:
        "Прикрепление доказательств выполнения мероприятий: документы, скриншоты, отчёты. Версионирование и хранение истории.",
    },
    {
      icon: TrendingUp,
      title: "Аналитика эффективности",
      description:
        "Оценка эффективности контрольных мероприятий. Анализ своевременности выполнения, выявление узких мест и оптимизация процессов.",
    },
  ]

  const controlTypes = [
    {
      title: "Организационные меры",
      items: [
        "Разработка и актуализация политик ИБ",
        "Обучение и аттестация сотрудников",
        "Инструктажи по информационной безопасности",
        "Аудит доступа к информационным системам",
      ],
    },
    {
      title: "Технические меры",
      items: [
        "Обновление антивирусных баз",
        "Резервное копирование данных",
        "Мониторинг событий безопасности",
        "Сканирование на уязвимости",
      ],
    },
    {
      title: "Физические меры",
      items: [
        "Контроль доступа в серверные помещения",
        "Проверка систем видеонаблюдения",
        "Ревизия средств пожаротушения",
        "Инспекция периметра защиты",
      ],
    },
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
          <Breadcrumbs items={[{ label: "Контрольные мероприятия" }]} />
        </div>

        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10b981]/20 mb-6">
            <Shield className="w-8 h-8 text-[#10b981]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Контрольные мероприятия
            <br />
            <span className="text-[#10b981]">и меры защиты</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Автоматизация планирования, проведения и контроля исполнения мероприятий по обеспечению информационной
            безопасности во всех подразделениях организации
          </p>
        </section>

        {/* Features - с разными градиентами */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const isEven = index % 2 === 0
              return (
                <Card
                  key={index}
                  className={`transition-all duration-300 hover:scale-105 group ${
                    isEven
                      ? "bg-[#1e3a52]/80 border-2 border-[#3b82f6]/30 hover:border-[#3b82f6] backdrop-blur-xl"
                      : "bg-gradient-to-br from-[#1e3a52]/90 to-[#2d4a5e]/90 border-2 border-[#10b981]/30 hover:border-[#10b981] backdrop-blur-xl"
                  }`}
                >
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform ${
                      isEven
                        ? "bg-gradient-to-br from-[#3b82f6] to-[#2563eb]"
                        : "bg-gradient-to-br from-[#10b981] to-[#059669]"
                    }`}>
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

        {/* Control Types */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Типы контрольных мероприятий</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Комплексный подход к обеспечению информационной безопасности
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {controlTypes.map((type, index) => (
              <Card key={index} className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white text-xl mb-4">{type.title}</CardTitle>
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

        {/* Process */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Процесс управления мерами</h2>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Планирование",
                  desc: "Формирование плана мероприятий на основе требований и рисков",
                },
                {
                  step: "2",
                  title: "Назначение",
                  desc: "Автоматическое распределение задач между ответственными сотрудниками",
                },
                {
                  step: "3",
                  title: "Выполнение",
                  desc: "Проведение мероприятий с фиксацией хода выполнения и результатов",
                },
                {
                  step: "4",
                  title: "Контроль",
                  desc: "Мониторинг сроков, качества выполнения и сбор доказательной базы",
                },
                {
                  step: "5",
                  title: "Анализ",
                  desc: "Оценка эффективности мер и формирование отчётности для руководства",
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

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <Card className="bg-[#1e3a52]/95 border-[#10b981]/50 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Автоматизируйте контрольные мероприятия</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
                Сократите время на планирование и контроль мероприятий на 70%. Попробуйте бесплатно 30 дней.
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

