import { Card } from "@/components/ui/card"
import {
  Database,
  Shield,
  Clock,
  CheckCircle,
  Users,
  FileType,
  Gauge,
  FolderCheck,
  Scale,
  Building2,
  FileText,
  ListChecks,
} from "lucide-react"
import Link from "next/link"

const dictionarySections = [
  {
    category: "Системные справочники",
    description: "Общие для всех тенантов",
    items: [
      {
        title: "Нормативные документы",
        description: "Законы и нормативные акты",
        icon: Scale,
        href: "/admin/dictionaries/regulatory-frameworks",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "Типы организаций",
        description: "Классификация организаций",
        icon: Building2,
        href: "/admin/dictionaries/organization-types",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
      {
        title: "Типы доказательств",
        description: "Виды доказательств выполнения требований",
        icon: FileText,
        href: "/admin/dictionaries/evidence-types",
        color: "text-teal-600",
        bgColor: "bg-teal-50",
      },
    ],
  },
  {
    category: "Справочники тенанта",
    description: "Настраиваются для каждого тенанта",
    items: [
      {
        title: "Регуляторы",
        description: "Регуляторные органы",
        icon: Shield,
        href: "/admin/dictionaries/regulators",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        title: "Категории требований",
        description: "Классификация требований",
        icon: Database,
        href: "/admin/dictionaries/categories",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
      {
        title: "Периодичности",
        description: "Частота выполнения требований",
        icon: Clock,
        href: "/admin/dictionaries/periodicities",
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
      },
      {
        title: "Способы подтверждения",
        description: "Методы подтверждения соответствия",
        icon: CheckCircle,
        href: "/admin/dictionaries/verification-methods",
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "Ответственные роли",
        description: "Роли ответственных за выполнение",
        icon: Users,
        href: "/admin/dictionaries/responsible-roles",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
      {
        title: "Шаблоны мер контроля",
        description: "Типовые меры защиты для выполнения требований",
        icon: ListChecks,
        href: "/admin/dictionaries/control-measure-templates",
        color: "text-violet-600",
        bgColor: "bg-violet-50",
      },
    ],
  },
  {
    category: "Системные параметры",
    description: "Предопределенные значения",
    items: [
      {
        title: "Типы мер защиты",
        description: "Превентивная, детективная, корректирующая",
        icon: FileType,
        href: "/admin/dictionaries/control-types",
        color: "text-pink-600",
        bgColor: "bg-pink-50",
      },
      {
        title: "Частота выполнения мер",
        description: "Ежедневно, еженедельно, ежемесячно",
        icon: Gauge,
        href: "/admin/dictionaries/control-frequencies",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      },
      {
        title: "Статусы доказательств",
        description: "Ожидает, одобрено, отклонено, архив",
        icon: FolderCheck,
        href: "/admin/dictionaries/evidence-statuses",
        color: "text-rose-600",
        bgColor: "bg-rose-50",
      },
    ],
  },
]

export default function DictionariesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Справочники</h1>
        <p className="text-sm text-muted-foreground">Управление справочными данными системы</p>
      </div>

      {dictionarySections.map((section) => (
        <div key={section.category} className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{section.category}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="group p-4 transition-all hover:shadow-md hover:border-primary/50">
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-md p-2 ${item.bgColor} ${item.color} transition-transform group-hover:scale-110`}
                    >
                      {item.icon && <item.icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
