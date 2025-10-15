import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, ShoppingCart, Coins, Wallet, Share2 } from "lucide-react"

export default function FinanceRegistersPage() {
  const registers = [
    { 
      name: "Заказы", 
      href: "/admin/finance/orders",
      icon: ShoppingCart,
      description: "Управление заказами и контрактами"
    },
    { 
      name: "Услуги заказа", 
      href: "/admin/finance/services",
      icon: FileText,
      description: "Услуги в рамках заказов"
    },
    { 
      name: "Ручные доходы", 
      href: "/admin/finance/revenues",
      icon: Coins,
      description: "Регистрация дополнительных доходов"
    },
    { 
      name: "Доп.затраты", 
      href: "/admin/finance/extra-costs",
      icon: Wallet,
      description: "Дополнительные расходы проектов"
    },
    { 
      name: "Реестр зарплат", 
      href: "/admin/finance/salary",
      icon: DollarSign,
      description: "Управление выплатами сотрудникам"
    },
    { 
      name: "Правила распределения", 
      href: "/admin/finance/allocations",
      icon: Share2,
      description: "Правила распределения затрат"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Финансовые регистры</h1>
        <p className="text-gray-600 mt-1">Управление финансовыми данными системы</p>
      </div>

      {/* Registers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {registers.map((register) => {
          const Icon = register.icon
          return (
            <Link key={register.href} href={register.href}>
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-credos-primary">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-credos-muted flex items-center justify-center">
                      <Icon className="h-6 w-6 text-credos-primary" />
                    </div>
                    <div>
                      <CardTitle>{register.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{register.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            О финансовых регистрах
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Финансовые регистры содержат все данные о доходах, расходах и распределении средств. 
            Здесь вы можете управлять заказами, зарплатами, дополнительными доходами и затратами.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
