"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileCheck,
  CheckCircle,
  FolderArchive,
  Search,
  Link as LinkIcon,
  Shield,
  ArrowRight,
  Image,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { Breadcrumbs } from "@/components/landing/breadcrumbs"

export default function EvidencePage() {
  const features = [
    {
      icon: FolderArchive,
      title: "Централизованное хранилище",
      description:
        "Все доказательства выполнения требований и мероприятий в едином защищённом хранилище с контролем доступа и версионированием.",
    },
    {
      icon: LinkIcon,
      title: "Связь с требованиями",
      description:
        "Автоматическое сопоставление доказательств с требованиями регуляторов и контрольными мероприятиями. Быстрая подготовка к проверкам.",
    },
    {
      icon: Search,
      title: "Полнотекстовый поиск",
      description:
        "Поиск по содержимому документов, метаданным, авторам и датам. Фильтрация по типам доказательств и статусам.",
    },
    {
      icon: FileCheck,
      title: "Типизация артефактов",
      description:
        "Классификация доказательств по типам: приказы, протоколы, отчёты, скриншоты, логи. Шаблоны для каждого типа документов.",
    },
    {
      icon: Shield,
      title: "Контроль актуальности",
      description:
        "Автоматические напоминания об истечении срока действия документов. Планирование обновления доказательной базы.",
    },
    {
      icon: Image,
      title: "Поддержка форматов",
      description:
        "Загрузка документов, изображений, видео, логов систем безопасности. Предпросмотр и конвертация форматов.",
    },
  ]

  const evidenceTypes = [
    {
      category: "Организационные",
      items: ["Приказы и распоряжения", "Политики и регламенты", "Протоколы обучения", "Журналы инструктажей"],
    },
    {
      category: "Технические",
      items: ["Отчёты сканирования", "Логи систем защиты", "Скриншоты настроек", "Результаты тестирования"],
    },
    {
      category: "Физические",
      items: [
        "Акты проверки помещений",
        "Журналы учёта доступа",
        "Видеозаписи",
        "Фотофиксация оборудования",
      ],
    },
  ]

  const benefits = [
    "Готовая доказательная база для проверок регуляторов",
    "Сокращение времени на поиск документов до 90%",
    "Автоматическая связь с требованиями и мероприятиями",
    "Контроль актуальности и своевременного обновления",
    "Защищённое хранение с резервным копированием",
    "История изменений и версионирование документов",
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
          <Breadcrumbs items={[{ label: "Управление доказательствами" }]} />
        </div>

        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10b981]/20 mb-6">
            <FileCheck className="w-8 h-8 text-[#10b981]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Управление доказательствами
            <br />
            <span className="text-[#10b981]">и артефактами</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Централизованное хранилище всех доказательств выполнения требований с автоматической связью с мероприятиями
            и документами. Всегда готовы к проверкам.
          </p>
        </section>

        {/* Features - яркие градиенты */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colors = [
                { gradient: "from-[#10b981] to-[#059669]", border: "border-[#10b981]/50", hover: "hover:border-[#10b981]" },
                { gradient: "from-[#3b82f6] to-[#2563eb]", border: "border-[#3b82f6]/50", hover: "hover:border-[#3b82f6]" },
              ]
              const color = colors[index % colors.length]
              return (
                <Card
                  key={index}
                  className={`bg-[#1e3a52]/80 border-2 ${color.border} ${color.hover} backdrop-blur-xl transition-all duration-300 hover:scale-105 group`}
                >
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
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

        {/* Evidence Types */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Типы доказательств</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Комплексная доказательная база для всех аспектов информационной безопасности
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {evidenceTypes.map((type, index) => (
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

        {/* Workflow */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Как работает система</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Загрузка",
                desc: "Загрузка доказательств через веб-интерфейс или API. Автоматическое распознавание типа и извлечение метаданных.",
              },
              {
                title: "Классификация",
                desc: "Автоматическая привязка к требованиям и мероприятиям. Индексация для быстрого полнотекстового поиска.",
              },
              {
                title: "Хранение",
                desc: "Защищённое хранилище с шифрованием и резервным копированием. Версионирование и история изменений.",
              },
              {
                title: "Использование",
                desc: "Быстрый поиск и доступ к документам. Автоматическое формирование пакетов для проверок регуляторов.",
              },
            ].map((item, index) => (
              <Card key={index} className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-300">{item.desc}</p>
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
              <h2 className="text-3xl font-bold text-white mb-4">Создайте надёжную доказательную базу</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
                Будьте всегда готовы к проверкам регуляторов. Попробуйте бесплатно 30 дней.
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

