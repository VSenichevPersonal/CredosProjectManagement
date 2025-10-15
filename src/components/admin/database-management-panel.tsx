'use client'

import { useState } from 'react'
import { Database, Trash2, Loader2, AlertTriangle, CheckCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

interface SeedStats {
  directions: number
  employees: number
  projects: number
  tasks: number
  timeEntries: number
}

interface IntegrityReport {
  status: 'excellent' | 'good' | 'warning' | 'critical'
  message: string
  report: {
    tables: Record<string, { exists: boolean; count: number }>
    orphans: any[]
    warnings: string[]
    errors: string[]
    summary: {
      totalRecords: number
      tablesChecked: number
      activeEmployees: number
      activeDirections: number
      activeProjects: number
      recentTimeEntries: number
    }
  }
}

export function DatabaseManagementPanel() {
  const { toast } = useToast()
  const [isSeeding, setIsSeeding] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [seedStats, setSeedStats] = useState<SeedStats | null>(null)
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null)

  const handleSeedDatabase = async () => {
    setIsSeeding(true)
    setSeedStats(null)

    try {
      const response = await fetch('/api/admin/seed-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при заполнении БД')
      }

      setSeedStats(data.stats)
      toast({
        title: '✅ База данных заполнена',
        description: `Создано: ${data.stats.directions} направлений, ${data.stats.employees} сотрудников, ${data.stats.projects} проектов`,
      })
    } catch (error: any) {
      console.error('Seed error:', error)
      toast({
        title: '❌ Ошибка',
        description: error.message || 'Не удалось заполнить базу данных',
        variant: 'destructive',
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleCheckIntegrity = async () => {
    setIsChecking(true)
    setIntegrityReport(null)

    try {
      const response = await fetch('/api/admin/check-db', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при проверке БД')
      }

      setIntegrityReport(data)
      
      const statusEmojis: Record<'excellent' | 'good' | 'warning' | 'critical', string> = {
        excellent: '✅',
        good: '👍',
        warning: '⚠️',
        critical: '❌'
      }
      const statusEmoji = statusEmojis[data.status as 'excellent' | 'good' | 'warning' | 'critical']
      
      toast({
        title: `${statusEmoji} ${data.message}`,
        description: `Проверено таблиц: ${data.report.summary.tablesChecked}, Всего записей: ${data.report.summary.totalRecords}`,
        variant: data.status === 'critical' || data.status === 'warning' ? 'destructive' : 'default',
      })
    } catch (error: any) {
      console.error('Check integrity error:', error)
      toast({
        title: '❌ Ошибка',
        description: error.message || 'Не удалось проверить целостность БД',
        variant: 'destructive',
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleResetDatabase = async () => {
    setShowResetDialog(false)
    setIsResetting(true)
    setSeedStats(null)
    setIntegrityReport(null)

    try {
      const response = await fetch('/api/admin/reset-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm: 'УДАЛИТЬ ВСЕ ДАННЫЕ',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при очистке БД')
      }

      toast({
        title: '⚠️ База данных очищена',
        description: 'Все данные удалены. Используйте "Заполнить тестовыми данными" для восстановления.',
      })
    } catch (error: any) {
      console.error('Reset error:', error)
      toast({
        title: '❌ Ошибка',
        description: error.message || 'Не удалось очистить базу данных',
        variant: 'destructive',
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-600" />
            <CardTitle>Управление базой данных</CardTitle>
          </div>
          <CardDescription>
            Инструменты для тестирования и разработки. Используйте с осторожностью!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Check Integrity Button */}
          <div className="flex items-start gap-4 p-4 border border-blue-200 rounded-lg bg-blue-50/50">
            <div className="flex-1">
              <h3 className="font-medium mb-1 text-blue-900">Проверить целостность БД</h3>
              <p className="text-sm text-blue-700">
                Проверяет таблицы, foreign keys, orphaned records и бизнес-логику.
                Безопасная операция без изменения данных.
              </p>
              {integrityReport && (
                <div className={`mt-3 p-3 border rounded-md ${
                  integrityReport.status === 'excellent' ? 'bg-green-50 border-green-200' :
                  integrityReport.status === 'good' ? 'bg-blue-50 border-blue-200' :
                  integrityReport.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {integrityReport.status === 'excellent' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {integrityReport.status === 'good' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    {integrityReport.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    {integrityReport.status === 'critical' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    <span className={`text-sm font-medium ${
                      integrityReport.status === 'excellent' ? 'text-green-900' :
                      integrityReport.status === 'good' ? 'text-blue-900' :
                      integrityReport.status === 'warning' ? 'text-yellow-900' :
                      'text-red-900'
                    }`}>
                      {integrityReport.message}
                    </span>
                  </div>
                  <ul className={`text-xs space-y-1 ml-6 ${
                    integrityReport.status === 'excellent' ? 'text-green-800' :
                    integrityReport.status === 'good' ? 'text-blue-800' :
                    integrityReport.status === 'warning' ? 'text-yellow-800' :
                    'text-red-800'
                  }`}>
                    <li>• Всего записей: {integrityReport.report.summary.totalRecords}</li>
                    <li>• Активных сотрудников: {integrityReport.report.summary.activeEmployees}</li>
                    <li>• Активных направлений: {integrityReport.report.summary.activeDirections}</li>
                    <li>• Активных проектов: {integrityReport.report.summary.activeProjects}</li>
                    {integrityReport.report.errors.length > 0 && (
                      <li className="text-red-700">⚠️ Ошибок: {integrityReport.report.errors.length}</li>
                    )}
                    {integrityReport.report.orphans.length > 0 && (
                      <li className="text-yellow-700">⚠️ Orphaned записей: {integrityReport.report.orphans.length}</li>
                    )}
                    {integrityReport.report.warnings.length > 0 && (
                      <li className="text-yellow-700">⚠️ Предупреждений: {integrityReport.report.warnings.length}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <Button
              onClick={handleCheckIntegrity}
              disabled={isChecking}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверяем...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Проверить
                </>
              )}
            </Button>
          </div>

          {/* Seed Button */}
          <div className="flex items-start gap-4 p-4 border rounded-lg bg-white">
            <div className="flex-1">
              <h3 className="font-medium mb-1">Заполнить тестовыми данными</h3>
              <p className="text-sm text-muted-foreground">
                Добавляет в БД тестовые направления, сотрудников, проекты, задачи и записи времени 
                <strong> за 3 месяца (август-октябрь 2025)</strong>.
                Безопасно использовать на заполненной базе (дубликаты не создаются).
              </p>
              {seedStats && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Данные добавлены:</span>
                  </div>
                  <ul className="text-xs text-green-800 space-y-1 ml-6">
                    <li>• Направлений: {seedStats.directions}</li>
                    <li>• Сотрудников: {seedStats.employees}</li>
                    <li>• Проектов: {seedStats.projects}</li>
                    <li>• Задач: {seedStats.tasks}</li>
                    <li>• Записей времени: {seedStats.timeEntries}</li>
                  </ul>
                </div>
              )}
            </div>
            <Button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Заполняем...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Заполнить
                </>
              )}
            </Button>
          </div>

          {/* Reset Button */}
          <div className="flex items-start gap-4 p-4 border border-red-200 rounded-lg bg-red-50/50">
            <div className="flex-1">
              <h3 className="font-medium mb-1 text-red-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Очистить базу данных
              </h3>
              <p className="text-sm text-red-700">
                ОПАСНО! Удаляет ВСЕ данные из базы (кроме системных таблиц).
                Это действие необратимо! Используйте только для тестирования.
              </p>
            </div>
            <Button
              onClick={() => setShowResetDialog(true)}
              disabled={isResetting}
              variant="destructive"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Очищаем...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Очистить
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-start gap-2 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Внимание:</strong> Эти инструменты предназначены только для разработки и тестирования.
              Не используйте на production окружении!
            </p>
          </div>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Вы абсолютно уверены?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Это действие удалит <strong>ВСЕ ДАННЫЕ</strong> из базы данных:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Все направления</li>
                <li>Все сотрудники</li>
                <li>Все проекты и задачи</li>
                <li>Все записи времени</li>
                <li>Все финансовые данные</li>
              </ul>
              <p className="font-semibold text-red-600 mt-4">
                Это действие необратимо!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDatabase}
              className="bg-red-600 hover:bg-red-700"
            >
              Да, удалить всё
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

