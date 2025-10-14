"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  CheckCircle,
  FileText,
  Search,
  Users,
  TrendingUp,
  ArrowRight,
  BookMarked,
  GraduationCap,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { Breadcrumbs } from "@/components/landing/breadcrumbs"

export default function KnowledgePage() {
  const features = [
    {
      icon: FileText,
      title: "Нормативная база",
      description:
        "Актуальные тексты приказов ФСТЭК, ФСБ, Роскомнадзор, федеральных законов и других регуляторов. Автоматическое обновление.",
    },
    {
      icon: BookMarked,
      title: "Методические рекомендации",
      description:
        "Пошаговые руководства по выполнению требований, примеры реализации мер защиты, чек-листы для проверок.",
    },
    {
      icon: GraduationCap,
      title: "Обучающие материалы",
      description:
        "Видеокурсы, вебинары, статьи и практические кейсы по различным аспектам информационной безопасности.",
    },
    {
      icon: Search,
      title: "Умный поиск",
      description:
        "Полнотекстовый поиск по всей базе знаний с фильтрацией по регуляторам, темам и датам публикации.",
    },
    {
      icon: Users,
      title: "Экспертные комментарии",
      description:
        "Разъяснения сложных требований от практикующих специалистов и аудиторов по информационной безопасности.",
    },
    {
      icon: TrendingUp,
      title: "Аналитика изменений",
      description:
        "Отслеживание изменений в законодательстве с анализом влияния на вашу организацию и рекомендациями по адаптации.",
    },
  ]

  const knowledgeCategories = [
    {
      category: "Нормативные документы",
      count: "150+ документов",
      items: [
        "Приказы ФСТЭК России",
        "Приказы ФСБ России",
        "Документы Роскомнадзора",
        "Федеральные законы",
        "ГОСТы и стандарты",
      ],
    },
    {
      category: "Методики и руководства",
      count: "80+ материалов",
      items: [
        "Методики оценки рисков",
        "Руководства по аудиту ИБ",
        "Инструкции по категорированию",
        "Чек-листы для проверок",
        "Примеры документов",
      ],
    },
    {
      category: "Обучение и практика",
      count: "120+ материалов",
      items: [
        "Видеокурсы для специалистов",
        "Вебинары с экспертами",
        "Практические кейсы",
        "Разбор реальных ситуаций",
        "Q&A сессии",
      ],
    },
    {
      category: "Аналитика и обзоры",
      count: "60+ публикаций",
      items: [
        "Обзоры изменений законодательства",
        "Анализ требований регуляторов",
        "Тренды в области ИБ",
        "Судебная практика",
        "Экспертные мнения",
      ],
    },
  ]

  const benefits = [
    "Экономия времени на поиске нормативных документов",
    "Всегда актуальная информация о требованиях",
    "Практические рекомендации от экспертов",
    "Готовые решения типовых задач ИБ",
    "Обучение и повышение квалификации команды",
    "Снижение рисков несоответствия требованиям",
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
          <Breadcrumbs items={[{ label: "База знаний" }]} />
        </div>

        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10b981]/20 mb-6">
            <BookOpen className="w-8 h-8 text-[#10b981]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            База знаний
            <br />
            <span className="text-[#10b981]">по информационной безопасности</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Структурированная коллекция нормативных документов, методических рекомендаций, обучающих материалов и
            экспертных комментариев. Всё необходимое для работы специалиста по ИБ в одном месте.
          </p>
        </section>

        {/* Features - чередующиеся градиенты */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colors = [
                { bg: "from-[#3b82f6] to-[#2563eb]", border: "border-[#3b82f6]/50", hover: "hover:border-[#3b82f6]" },
                { bg: "from-[#10b981] to-[#059669]", border: "border-[#10b981]/50", hover: "hover:border-[#10b981]" },
              ]
              const color = colors[index % colors.length]
              return (
                <Card
                  key={index}
                  className={`bg-[#1e3a52]/80 border-2 ${color.border} ${color.hover} backdrop-blur-xl transition-all duration-300 hover:scale-105 group`}
                >
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
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

        {/* Knowledge Categories */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Разделы базы знаний</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Структурированная информация по всем аспектам информационной безопасности
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {knowledgeCategories.map((category, index) => (
              <Card key={index} className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-white text-xl">{category.category}</CardTitle>
                    <span className="text-[#10b981] text-sm font-medium">{category.count}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {category.items.map((item, idx) => (
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

        {/* Use Cases */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Как использовать базу знаний</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "При выполнении требований",
                desc: "Найдите актуальный текст требования и методические рекомендации по его выполнению",
              },
              {
                title: "При подготовке к проверкам",
                desc: "Используйте чек-листы и примеры документов для успешного прохождения аудита",
              },
              {
                title: "При обучении команды",
                desc: "Предоставьте сотрудникам доступ к видеокурсам и обучающим материалам",
              },
              {
                title: "При проектировании СЗИ",
                desc: "Изучите требования и лучшие практики перед разработкой архитектуры защиты",
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
              <h2 className="text-3xl font-bold text-white mb-4">Получите доступ к базе знаний</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
                Вся необходимая информация для работы специалиста по ИБ в одном месте. Попробуйте бесплатно 30 дней.
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

