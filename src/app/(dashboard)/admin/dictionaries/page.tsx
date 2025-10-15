import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, FolderOpen, Book } from "lucide-react"

export default function DictionariesPage() {
  const dictionaries = [
    { 
      name: "Направления", 
      href: "/admin/dictionaries/directions",
      icon: Building2,
      description: "Управление направлениями компании"
    },
    { 
      name: "Сотрудники", 
      href: "/admin/dictionaries/employees",
      icon: Users,
      description: "Справочник сотрудников"
    },
    { 
      name: "Проекты", 
      href: "/admin/dictionaries/projects",
      icon: FolderOpen,
      description: "Управление проектами"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Справочники</h1>
        <p className="text-gray-600 mt-1">Управление справочниками системы</p>
      </div>

      {/* Dictionaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dictionaries.map((dict) => {
          const Icon = dict.icon
          return (
            <Link key={dict.href} href={dict.href}>
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-credos-primary">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-credos-muted flex items-center justify-center">
                      <Icon className="h-6 w-6 text-credos-primary" />
                    </div>
                    <div>
                      <CardTitle>{dict.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{dict.description}</CardDescription>
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
            <Book className="h-5 w-5" />
            О справочниках
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Справочники содержат основные данные системы. Здесь вы можете управлять направлениями, 
            сотрудниками, проектами и другими сущностями.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
