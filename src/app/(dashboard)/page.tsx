import Image from "next/image"
import { MetricCard } from "@/components/ui/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Clock, 
  FolderOpen, 
  Users, 
  CheckCircle,
} from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Image 
            src="/credos-logo.svg" 
            alt="Кредо-С" 
            width={150} 
            height={45}
            className="h-12 w-auto"
          />
          <div className="border-l border-gray-300 pl-6">
            <h1 className="text-3xl font-bold text-gray-900">Дашборд</h1>
            <p className="text-gray-600 mt-1">Обзор проектов и активности команды</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('ru-RU', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Активные проекты"
          value={12}
          trend={{ value: 8, direction: "up" }}
          icon={<FolderOpen className="h-5 w-5" />}
          description="+2 за неделю"
        />
        
        <MetricCard
          label="Часы за месяц"
          value="1,247"
          trend={{ value: 12, direction: "up" }}
          icon={<Clock className="h-5 w-5" />}
          description="+150 к прошлому месяцу"
        />
        
        <MetricCard
          label="Сотрудники"
          value={24}
          trend={{ value: 0, direction: "neutral" }}
          icon={<Users className="h-5 w-5" />}
          description="Стабильно"
        />
        
        <MetricCard
          label="Завершено задач"
          value={89}
          trend={{ value: 15, direction: "up" }}
          icon={<CheckCircle className="h-5 w-5" />}
          description="За эту неделю"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Последняя активность</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Задача "Настройка CI/CD" завершена</p>
                <p className="text-xs text-gray-500">2 часа назад</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Новый проект "Мобильное приложение"</p>
                <p className="text-xs text-gray-500">4 часа назад</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Часы утверждены для 5 сотрудников</p>
                <p className="text-xs text-gray-500">6 часов назад</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Проекты по направлениям</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">Информационная безопасность</span>
              </div>
              <span className="text-sm font-semibold">5 проектов</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-cyan-500"></div>
                <span className="text-sm font-medium">Промышленная ИБ</span>
              </div>
              <span className="text-sm font-semibold">3 проекта</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                <span className="text-sm font-medium">Технический контроль</span>
              </div>
              <span className="text-sm font-semibold">2 проекта</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                <span className="text-sm font-medium">Аудит</span>
              </div>
              <span className="text-sm font-semibold">2 проекта</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-credos-border hover:bg-credos-muted cursor-pointer transition-colors">
              <Clock className="h-5 w-5 text-credos-primary" />
              <div>
                <p className="font-medium">Записать часы</p>
                <p className="text-sm text-gray-500">Добавить трудозатраты</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg border border-credos-border hover:bg-credos-muted cursor-pointer transition-colors">
              <FolderOpen className="h-5 w-5 text-credos-primary" />
              <div>
                <p className="font-medium">Новый проект</p>
                <p className="text-sm text-gray-500">Создать проект</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg border border-credos-border hover:bg-credos-muted cursor-pointer transition-colors">
              <CheckCircle className="h-5 w-5 text-credos-primary" />
              <div>
                <p className="font-medium">Утвердить часы</p>
                <p className="text-sm text-gray-500">Проверить трудозатраты</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

