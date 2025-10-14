"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  FileText,
  BarChart3,
  Users,
  CheckCircle2,
  TrendingUp,
  Bell,
  Lock,
  Database,
  Zap,
  Globe,
  Award,
  ArrowRight,
  CheckCircle,
  FileStack,
  BookOpen,
} from "lucide-react"

export default function LandingPage() {
  const features = [
    {
      icon: FileText,
      title: "Управление требованиями",
      description: "База требований регуляторов с автоматическим расчётом применимости и контролем выполнения",
      link: "/landing/requirements",
    },
    {
      icon: Shield,
      title: "Контрольные мероприятия",
      description: "Планирование и проведение организационных и технических мер защиты информации",
      link: "/landing/controls",
    },
    {
      icon: CheckCircle2,
      title: "Управление доказательствами",
      description: "Централизованное хранилище артефактов с автоматической связью с требованиями",
      link: "/landing/evidence",
    },
    {
      icon: FileText,
      title: "Документооборот и автогенерация",
      description: "Автоматическое создание документов, версионирование и контроль актуальности",
      link: "/landing/documents",
    },
    {
      icon: FileStack,
      title: "Библиотека шаблонов",
      description: "Готовые шаблоны политик, регламентов и процедур для быстрого старта",
      link: "/landing/templates",
    },
    {
      icon: BookOpen,
      title: "База знаний",
      description: "Нормативные документы, методические рекомендации и лучшие практики",
      link: "/landing/knowledge",
    },
  ]

  const benefits = [
    {
      icon: Zap,
      title: "Экономия времени",
      description: "Автоматизация рутинных процессов и сокращение ручного труда на 70%",
    },
    {
      icon: Lock,
      title: "Безопасность данных",
      description: "Надёжная защита конфиденциальной информации и соответствие требованиям ФЗ-152",
    },
    {
      icon: Database,
      title: "Централизованное хранилище",
      description: "Все данные о комплаенсе в одном месте с быстрым поиском и доступом",
    },
    {
      icon: TrendingUp,
      title: "Масштабируемость",
      description: "Система растёт вместе с вашей организацией и адаптируется под изменения",
    },
  ]

  const uniquePropositions = [
    {
      icon: Shield,
      title: "Комплаенс-офицер на аутсорсе",
      description: "Профессиональная команда заменяет штатного специалиста. Экономия на ФОТ до 60%",
    },
    {
      icon: Globe,
      title: "Для распределенных сетей",
      description: "Управление комплаенсом в холдингах, филиальных сетях и государственных структурах",
    },
    {
      icon: FileText,
      title: "Автогенерация документов",
      description: "Создаем и поддерживаем актуальность всей нормативной базы автоматически",
    },
    {
      icon: Bell,
      title: "Проактивные уведомления",
      description: "Следим за изменениями законодательства и оповещаем о важных обновлениях требований",
    },
  ]

  return (
    <div className="relative min-h-screen">
      {/* Background similar to login page */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0f2942] via-[#1e3a52] to-[#2d4a5e] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#10b981]/10 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#3b82f6]/10 via-transparent to-transparent -z-10" />

      {/* Animated blobs */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-48 -right-48 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.1) 50%, transparent 100%)",
            animation: "float 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)",
            animation: "float 25s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Grid pattern */}
      <svg className="fixed inset-0 h-full w-full opacity-[0.08] -z-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="landing-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#landing-grid)" />
      </svg>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-[#1e3a52]/95 shadow-xl">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://static.tildacdn.com/tild3738-3365-4538-b862-653038663431/__.svg"
                alt="Кибероснова"
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-white">Кибероснова Комплаенс</span>
            </div>
            <nav className="hidden md:flex items-center gap-2">
              {/* Выпадающее меню Функционал */}
              <div className="relative group">
                <a
                  href="#features"
                  className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
                >
                  Функционал
                  <svg
                    className="w-4 h-4 transition-transform group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
                {/* Выпадающий список */}
                <div className="absolute top-full left-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-[#1e3a52]/95 backdrop-blur-xl border-2 border-[#10b981]/30 rounded-xl shadow-2xl overflow-hidden">
                    <Link
                      href="/landing/requirements"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#10b981]/20 transition-colors border-b border-white/10"
                    >
                      <FileText className="w-5 h-5 text-[#10b981]" />
                      <span className="text-white">Управление требованиями</span>
                    </Link>
                    <Link
                      href="/landing/controls"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#3b82f6]/20 transition-colors border-b border-white/10"
                    >
                      <Shield className="w-5 h-5 text-[#3b82f6]" />
                      <span className="text-white">Контрольные мероприятия</span>
                    </Link>
                    <Link
                      href="/landing/evidence"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#10b981]/20 transition-colors border-b border-white/10"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                      <span className="text-white">Управление доказательствами</span>
                    </Link>
                    <Link
                      href="/landing/documents"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#3b82f6]/20 transition-colors border-b border-white/10"
                    >
                      <FileText className="w-5 h-5 text-[#3b82f6]" />
                      <span className="text-white">Документооборот</span>
                    </Link>
                    <Link
                      href="/landing/templates"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#10b981]/20 transition-colors border-b border-white/10"
                    >
                      <FileStack className="w-5 h-5 text-[#10b981]" />
                      <span className="text-white">Библиотека шаблонов</span>
                    </Link>
                    <Link
                      href="/landing/knowledge"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#3b82f6]/20 transition-colors"
                    >
                      <BookOpen className="w-5 h-5 text-[#3b82f6]" />
                      <span className="text-white">База знаний</span>
                    </Link>
                  </div>
                </div>
              </div>

              <a href="#benefits" className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                Преимущества
              </a>
              <a href="#contact" className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                Контакты
              </a>
              <div className="h-6 w-px bg-white/20 mx-2"></div>
              <Link href="/auth/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Войти
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-[#10b981] hover:bg-[#0d9668] text-white shadow-lg">Попробовать бесплатно</Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32 text-center">
          <Badge className="mb-6 bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
            <Globe className="w-3 h-3 mr-1" />
            Для распределенных структур
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Комплаенс для
            <br />
            <span className="text-[#10b981]">распределенных структур</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Единая система управления комплаенсом для холдингов, филиальных сетей и государственных организаций.
            Комплаенс-офицер на аутсорсе + автоматизация + консалтинг в одном решении.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-[#10b981] hover:bg-[#0d9668] text-white text-lg px-8 py-6">
                Начать работу
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-[#10b981] text-[#10b981] hover:bg-[#10b981]/20 text-lg px-8 py-6">
                Войти в систему
              </Button>
            </Link>
          </div>

          {/* Unique Value Propositions - зелёный и синий */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 max-w-7xl mx-auto">
            {uniquePropositions.map((prop, index) => {
              const Icon = prop.icon
              const colors = [
                { bg: "from-[#10b981] to-[#059669]", icon: "text-white", border: "border-[#10b981]" },
                { bg: "from-[#3b82f6] to-[#2563eb]", icon: "text-white", border: "border-[#3b82f6]" },
              ]
              const color = colors[index % colors.length]
              return (
                <Card
                  key={index}
                  className={`bg-gradient-to-br ${color.bg} border-2 ${color.border} backdrop-blur-xl hover:scale-105 transition-all duration-300 shadow-2xl`}
                >
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 mx-auto">
                      <Icon className={`w-8 h-8 ${color.icon}`} />
                    </div>
                    <h3 className="text-white font-bold text-center mb-2 text-lg">{prop.title}</h3>
                    <p className="text-white/90 text-sm text-center leading-relaxed">{prop.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Features Section - с градиентным фоном */}
        <section id="features" className="relative py-20 overflow-hidden">
          {/* Светлый градиентный фон для контраста */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#10b981]/10 to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-transparent bg-clip-text text-sm font-bold uppercase tracking-wider">
                  Функционал платформы
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Ключевые возможности</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Полный набор инструментов для эффективного управления комплаенсом и информационной безопасностью
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                const CardWrapper = feature.link ? Link : "div"
                // Чередуем стили для разнообразия
                const isEven = index % 2 === 0
                return (
                  <CardWrapper key={index} href={feature.link || ""} className={feature.link ? "block group" : "group"}>
                    <Card
                      className={`h-full transition-all duration-300 hover:scale-105 ${
                        isEven
                          ? "bg-[#1e3a52]/80 border-[#10b981]/30 hover:border-[#10b981] hover:shadow-[0_10px_40px_rgba(16,185,129,0.2)]"
                          : "bg-gradient-to-br from-[#1e3a52]/90 to-[#2d4a5e]/90 border-[#3b82f6]/30 hover:border-[#3b82f6] hover:shadow-[0_10px_40px_rgba(59,130,246,0.2)]"
                      } backdrop-blur-xl`}
                    >
                      <CardHeader>
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                            isEven
                              ? "bg-gradient-to-br from-[#10b981] to-[#059669] shadow-lg shadow-[#10b981]/20"
                              : "bg-gradient-to-br from-[#3b82f6] to-[#2563eb] shadow-lg shadow-[#3b82f6]/20"
                          }`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <CardTitle className="text-white text-xl mb-2">{feature.title}</CardTitle>
                        <CardDescription className="text-gray-300 mb-4 leading-relaxed">
                          {feature.description}
                        </CardDescription>
                        {feature.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`w-fit mt-2 ${
                              isEven
                                ? "text-[#10b981] hover:text-[#0d9668] hover:bg-[#10b981]/10"
                                : "text-[#3b82f6] hover:text-[#2563eb] hover:bg-[#3b82f6]/10"
                            }`}
                          >
                            Подробнее
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        )}
                      </CardHeader>
                    </Card>
                  </CardWrapper>
                )
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section - тёмный контрастный блок */}
        <section id="benefits" className="relative py-20 overflow-hidden">
          {/* Тёмный фон для контраста */}
          <div className="absolute inset-0 bg-[#0f2942]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/5 via-transparent to-[#3b82f6]/5" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="bg-gradient-to-r from-[#f59e0b] to-[#ef4444] text-transparent bg-clip-text text-sm font-bold uppercase tracking-wider">
                  Ваши выгоды
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Преимущества платформы</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Почему организации выбирают Кибероснова Комплаенс для управления информационной безопасностью
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                const gradients = [
                  "from-[#10b981] via-[#059669] to-[#047857]",
                  "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
                ]
                const gradient = gradients[index % gradients.length]
                return (
                  <Card
                    key={index}
                    className="bg-[#1e3a52]/60 border-2 border-white/10 backdrop-blur-xl text-center hover:scale-105 hover:border-white/30 transition-all duration-300 group"
                  >
                    <CardHeader>
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-4 shadow-2xl group-hover:rotate-3 transition-transform`}
                      >
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <CardTitle className="text-white text-xl mb-3">{benefit.title}</CardTitle>
                      <CardDescription className="text-gray-300 leading-relaxed">{benefit.description}</CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Use Cases Section - с яркими акцентами */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-transparent bg-clip-text text-sm font-bold uppercase tracking-wider">
                Наши клиенты
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Идеально для распределенных структур</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Специализация на организациях с территориально распределенной сетью подразделений
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden bg-[#1e3a52]/90 border-2 border-[#10b981]/40 backdrop-blur-xl hover:border-[#10b981] hover:bg-[#2d4a5e]/90 transition-all group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#10b981]/20 to-transparent rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform">
                  <Globe className="w-9 h-9 text-white" />
                </div>
                <CardTitle className="text-white text-2xl mb-3">Холдинги и корпорации</CardTitle>
                <CardDescription className="text-gray-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Централизованное управление комплаенсом дочерних компаний</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Консолидация отчётности по группе</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Единые стандарты для всех подразделений</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Контроль исполнения в режиме реального времени</span>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden bg-[#1e3a52]/90 border-2 border-[#3b82f6]/40 backdrop-blur-xl hover:border-[#3b82f6] hover:bg-[#2d4a5e]/90 transition-all group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3b82f6]/20 to-transparent rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform">
                  <Users className="w-9 h-9 text-white" />
                </div>
                <CardTitle className="text-white text-2xl mb-3">Филиальные сети</CardTitle>
                <CardDescription className="text-gray-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Управление десятками и сотнями филиалов</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Автоматическое распространение требований</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Мониторинг выполнения на всех площадках</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Сокращение затрат на локальных специалистов</span>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden bg-[#1e3a52]/90 border-2 border-[#10b981]/40 backdrop-blur-xl hover:border-[#10b981] hover:bg-[#2d4a5e]/90 transition-all group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#10b981]/20 to-transparent rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform">
                  <Shield className="w-9 h-9 text-white" />
                </div>
                <CardTitle className="text-white text-2xl mb-3">Госсектор</CardTitle>
                <CardDescription className="text-gray-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Соответствие требованиям ФСТЭК, ФСБ, Роскомнадзор</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Управление территориально распределёнными учреждениями</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Полный аудит и прослеживаемость действий</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Готовность к проверкам регуляторов</span>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Consulting Section */}
        <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-transparent via-[#10b981]/5 to-transparent">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Комплаенс-офицер на аутсорсе</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Наша команда экспертов заменяет целый отдел комплаенса. Вы получаете профессиональный сервис без затрат
              на штатных сотрудников
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-4 flex items-center gap-3">
                  <Award className="w-8 h-8 text-[#10b981]" />
                  Консалтинг и внедрение
                </CardTitle>
                <CardDescription className="text-gray-300 space-y-3 text-base">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Аудит текущего состояния комплаенса</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Разработка политик и процедур ИБ</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Настройка системы под ваши процессы</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Обучение сотрудников</span>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-4 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-[#10b981]" />
                  Аудит и проверки
                </CardTitle>
                <CardDescription className="text-gray-300 space-y-3 text-base">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Проведение внутреннего аудита ИБ</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Оценка соответствия требованиям</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Тестирование средств защиты</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Анализ уязвимостей и рисков</span>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-[#1e3a52]/90 border-[#10b981]/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-4 flex items-center gap-3">
                  <Users className="w-8 h-8 text-[#10b981]" />
                  Сопровождение и поддержка
                </CardTitle>
                <CardDescription className="text-gray-300 space-y-3 text-base">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Мониторинг изменений законодательства</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Актуализация документов и требований</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Подготовка к проверкам регуляторов</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Выделенный комплаенс-менеджер</span>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-12 max-w-4xl mx-auto">
            <Card className="bg-[#1e3a52]/95 border-2 border-[#10b981]/50 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-white mb-4">Экономия на ФОТ до 60%</h3>
                  <p className="text-gray-200 text-lg mb-6 leading-relaxed">
                    Стоимость аутсорсингового комплаенс-офицера в 2-3 раза ниже содержания штатной единицы с учётом
                    зарплаты, налогов, отпусков и больничных
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/auth/signup">
                      <Button size="lg" className="bg-[#10b981] hover:bg-[#0d9668] text-white shadow-lg">
                        Получить консультацию
                      </Button>
                    </Link>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-[#10b981] text-[#10b981] hover:bg-[#10b981]/20"
                      onClick={() => (window.location.href = "https://cyberosnova.ru")}
                    >
                      Расчёт стоимости
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section - яркий финальный блок */}
        <section id="contact" className="container mx-auto px-4 py-20">
          <Card className="relative overflow-hidden bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] border-none shadow-2xl">
            {/* Декоративные элементы */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            
            <CardContent className="relative z-10 p-12 text-center">
              <div className="inline-block mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-white text-sm font-bold uppercase tracking-wider">
                  🚀 Начните бесплатно
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Готовы начать?</h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                Попробуйте Кибероснова Комплаенс бесплатно в течение 30 дней. Без кредитной карты.
                Полный доступ ко всем функциям.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-white text-[#10b981] hover:bg-gray-100 text-lg px-10 py-7 shadow-2xl font-bold">
                    Попробовать бесплатно
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/20 text-lg px-10 py-7 font-bold"
                  onClick={() => (window.location.href = "https://cyberosnova.ru")}
                >
                  Связаться с нами
                </Button>
              </div>
              
              {/* Доверие */}
              <div className="mt-8 flex items-center justify-center gap-8 text-white/80 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Без кредитной карты</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>30 дней бесплатно</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Отмена в любой момент</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-xl bg-[#1e3a52]/80 mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-white font-bold mb-4">Продукт</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                      Возможности
                    </a>
                  </li>
                  <li>
                    <a href="#benefits" className="text-gray-300 hover:text-white transition-colors">
                      Преимущества
                    </a>
                  </li>
                  <li>
                    <Link href="/auth/signup" className="text-gray-300 hover:text-white transition-colors">
                      Цены
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold mb-4">Компания</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="https://cyberosnova.ru" className="text-gray-300 hover:text-white transition-colors">
                      О нас
                    </a>
                  </li>
                  <li>
                    <a href="https://cyberosnova.ru" className="text-gray-300 hover:text-white transition-colors">
                      Контакты
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold mb-4">Поддержка</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="https://cyberosnova.ru" className="text-gray-300 hover:text-white transition-colors">
                      Документация
                    </a>
                  </li>
                  <li>
                    <a href="https://cyberosnova.ru" className="text-gray-300 hover:text-white transition-colors">
                      Помощь
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold mb-4">Вход</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors">
                      Войти в систему
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/signup" className="text-gray-300 hover:text-white transition-colors">
                      Регистрация
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://static.tildacdn.com/tild3738-3365-4538-b862-653038663431/__.svg"
                  alt="Кибероснова"
                  className="h-8 w-auto"
                />
                <span className="text-gray-400 text-sm">© 2025 Кибероснова. Все права защищены.</span>
              </div>
              <div className="flex gap-4 text-sm text-gray-400">
                <a href="https://cyberosnova.ru" className="hover:text-white transition-colors">
                  Политика конфиденциальности
                </a>
                <a href="https://cyberosnova.ru" className="hover:text-white transition-colors">
                  Условия использования
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

