"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileStack,
  CheckCircle,
  Download,
  Edit,
  Clock,
  Users,
  ArrowRight,
  FileText,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { Breadcrumbs } from "@/components/landing/breadcrumbs"

export default function TemplatesPage() {
  const features = [
    {
      icon: FileStack,
      title: "Готовые шаблоны",
      description:
        "Библиотека из 50+ готовых шаблонов политик, регламентов, инструкций и процедур ИБ. Соответствуют требованиям регуляторов.",
    },
    {
      icon: Edit,
      title: "Кастомизация",
      description:
        "Гибкая настройка шаблонов под специфику вашей организации. Добавление собственных разделов и требований.",
    },
    {
      icon: Download,
      title: "Быстрое развёртывание",
      description:
        "Генерация готовых документов из шаблонов за минуты. Автоматическое заполнение реквизитов организации.",
    },
    {
      icon: Clock,
      title: "Регулярные обновления",
      description:
        "Шаблоны обновляются при изменении законодательства. Автоматические уведомления об актуализации.",
    },
    {
      icon: Users,
      title: "Экспертная проверка",
      description:
        "Все шаблоны разработаны и проверены экспертами по информационной безопасности с опытом 10+ лет.",
    },
    {
      icon: FileText,
      title: "Различные форматы",
      description: "Экспорт в DOCX, PDF, HTML. Удобное редактирование в онлайн-редакторе или скачивание для работы офлайн.",
    },
  ]

  const templateCategories = [
    {
      category: "Политики ИБ",
      count: "12 шаблонов",
      templates: [
        "Политика информационной безопасности",
        "Политика управления доступом",
        "Политика резервного копирования",
        "Политика использования криптосредств",
        "Политика защиты персональных данных",
      ],
    },
    {
      category: "Регламенты",
      count: "15 шаблонов",
      templates: [
        "Регламент управления учётными записями",
        "Регламент реагирования на инциденты",
        "Регламент проведения аудита ИБ",
        "Регламент обработки персональных данных",
        "Регламент управления уязвимостями",
      ],
    },
    {
      category: "Инструкции",
      count: "18 шаблонов",
      templates: [
        "Инструкция для пользователей ИС",
        "Инструкция по классификации информации",
        "Инструкция администратора безопасности",
        "Инструкция по работе с носителями",
        "Инструкция по антивирусной защите",
      ],
    },
    {
      category: "Процедуры",
      count: "10 шаблонов",
      templates: [
        "Процедура управления изменениями",
        "Процедура аттестации сотрудников",
        "Процедура уничтожения информации",
        "Процедура контроля доступа",
        "Процедура резервного копирования",
      ],
    },
  ]

  const benefits = [
    "Экономия времени на разработку документов до 90%",
    "Соответствие требованиям ФСТЭК, ФСБ, Роскомнадзор",
    "Готовые формулировки и структура документов",
    "Регулярные обновления при изменении законодательства",
    "Экспертная проверка всех шаблонов",
    "Быстрое развёртывание системы документов",
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
          <Breadcrumbs items={[{ label: "Библиотека шаблонов" }]} />
        </div>

        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10b981]/20 mb-6">
            <FileStack className="w-8 h-8 text-[#10b981]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Библиотека шаблонов
            <br />
            <span className="text-[#10b981]">документов ИБ</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Готовые шаблоны политик, регламентов и процедур для быстрого развёртывания системы управления
            информационной безопасностью. Соответствуют требованиям регуляторов.
          </p>
        </section>

        {/* Features - разноцветные градиенты */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const gradients = [
                { bg: "from-[#10b981] to-[#059669]", border: "border-[#10b981]/50", hover: "hover:border-[#10b981]" },
                { bg: "from-[#3b82f6] to-[#2563eb]", border: "border-[#3b82f6]/50", hover: "hover:border-[#3b82f6]" },
              ]
              const gradient = gradients[index % gradients.length]
              return (
                <Card
                  key={index}
                  className={`bg-[#1e3a52]/80 border-2 ${gradient.border} ${gradient.hover} backdrop-blur-xl transition-all duration-300 hover:scale-105 group`}
                >
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient.bg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
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

        {/* Template Categories */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Категории шаблонов</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Полный набор документов для построения системы менеджмента информационной безопасности
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {templateCategories.map((category, index) => (
              <Card key={index} className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-white text-xl">{category.category}</CardTitle>
                    <span className="text-[#10b981] text-sm font-medium">{category.count}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {category.templates.map((template, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{template}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Как работать с шаблонами</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { step: "1", title: "Выбор шаблона", desc: "Выберите нужный документ из библиотеки" },
              { step: "2", title: "Кастомизация", desc: "Настройте под специфику организации" },
              { step: "3", title: "Генерация", desc: "Автоматическое создание документа" },
              { step: "4", title: "Утверждение", desc: "Согласование и публикация" },
            ].map((item, index) => (
              <Card key={index} className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-[#10b981] text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-white font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-300 text-sm">{item.desc}</p>
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
              <h2 className="text-3xl font-bold text-white mb-4">Получите доступ к библиотеке шаблонов</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
                Создайте полный комплект документов ИБ за несколько часов вместо месяцев. Попробуйте бесплатно 30
                дней.
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

