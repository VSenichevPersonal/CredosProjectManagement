'use client'

import { useState } from 'react'
import { Database, Trash2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
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

export function DatabaseManagementPanel() {
  const { toast } = useToast()
  const [isSeeding, setIsSeeding] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [seedStats, setSeedStats] = useState<SeedStats | null>(null)

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

  const handleResetDatabase = async () => {
    setShowResetDialog(false)
    setIsResetting(true)
    setSeedStats(null)

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
          {/* Seed Button */}
          <div className="flex items-start gap-4 p-4 border rounded-lg bg-white">
            <div className="flex-1">
              <h3 className="font-medium mb-1">Заполнить тестовыми данными</h3>
              <p className="text-sm text-muted-foreground">
                Добавляет в БД тестовые направления, сотрудников, проекты, задачи и записи времени.
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

