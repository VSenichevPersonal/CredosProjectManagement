"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, ChevronLeft, ChevronRight, Copy, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  code?: string;
}

interface Task {
  id: string;
  name: string;
  projectId: string;
}

interface TimeEntry {
  id?: string;
  projectId: string;
  taskId: string;
  description: string;
  hours: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
}

interface WeeklyTimesheetProps {
  employeeId: string;
}

export default function WeeklyTimesheet({ employeeId }: WeeklyTimesheetProps) {
  const { toast } = useToast();
  
  // Состояние недели
  const [currentWeek, setCurrentWeek] = useState(getWeekStart(new Date()));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Дни недели
  const weekDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
  const weekDaysRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  useEffect(() => {
    loadData();
  }, [currentWeek, employeeId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Загрузка проектов
      const projectsRes = await fetch('/api/projects');
      const projectsData = await projectsRes.json();
      setProjects(projectsData);

      // Загрузка задач
      const tasksRes = await fetch('/api/tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

      // Загрузка записей времени за текущую неделю
      const weekStart = currentWeek.toISOString().split('T')[0];
      const weekEnd = getWeekEnd(currentWeek).toISOString().split('T')[0];
      
      const entriesRes = await fetch(
        `/api/time-entries?employeeId=${employeeId}&startDate=${weekStart}&endDate=${weekEnd}`
      );
      
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(groupEntriesByProjectTask(entriesData));
      } else {
        // Если нет данных, инициализируем 3 пустых строки
        setEntries(getEmptyEntries(3));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      });
      setEntries(getEmptyEntries(3));
    } finally {
      setIsLoading(false);
    }
  };

  const groupEntriesByProjectTask = (rawEntries: any[]): TimeEntry[] => {
    const grouped = new Map<string, TimeEntry>();

    rawEntries.forEach((entry) => {
      const key = `${entry.projectId}-${entry.taskId}`;
      const dayOfWeek = new Date(entry.date).getDay();
      const dayKey = weekDays[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: entry.id,
          projectId: entry.projectId,
          taskId: entry.taskId,
          description: entry.description || '',
          hours: {
            mon: 0,
            tue: 0,
            wed: 0,
            thu: 0,
            fri: 0,
            sat: 0,
            sun: 0,
          },
        });
      }

      const groupedEntry = grouped.get(key)!;
      groupedEntry.hours[dayKey] += entry.hours || 0;
    });

    return Array.from(grouped.values());
  };

  const getEmptyEntries = (count: number): TimeEntry[] => {
    return Array.from({ length: count }, () => ({
      projectId: '',
      taskId: '',
      description: '',
      hours: {
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
        sat: 0,
        sun: 0,
      },
    }));
  };

  const handleAddRow = () => {
    setEntries([...entries, ...getEmptyEntries(1)]);
  };

  const handleUpdateEntry = (index: number, field: keyof TimeEntry, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const handleUpdateHours = (index: number, day: typeof weekDays[number], value: string) => {
    const parsed = parseHours(value);
    const updated = [...entries];
    updated[index] = {
      ...updated[index],
      hours: {
        ...updated[index].hours,
        [day]: parsed,
      },
    };
    setEntries(updated);
    
    // Автосохранение с дебаунсом (можно улучшить)
    if (updated[index].projectId && updated[index].taskId) {
      debouncedSave(updated[index], day);
    }
  };

  const parseHours = (value: string): number => {
    if (!value || value === '0') return 0;
    
    // Поддержка форматов: "8", "8h", "4.5", "2:30"
    const trimmed = value.trim().toLowerCase().replace('h', '');
    
    if (trimmed.includes(':')) {
      const [hours, minutes] = trimmed.split(':').map(Number);
      return hours + (minutes / 60);
    }
    
    return parseFloat(trimmed) || 0;
  };

  const formatHours = (hours: number): string => {
    if (hours === 0) return '';
    return hours.toFixed(1).replace('.0', '');
  };

  let saveTimeout: NodeJS.Timeout;
  const debouncedSave = (entry: TimeEntry, day: string) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveEntry(entry, day);
    }, 1000);
  };

  const saveEntry = async (entry: TimeEntry, day: string) => {
    try {
      const dayIndex = weekDays.indexOf(day as any);
      const date = new Date(currentWeek);
      date.setDate(date.getDate() + dayIndex);

      const payload = {
        employeeId,
        projectId: entry.projectId,
        taskId: entry.taskId,
        date: date.toISOString().split('T')[0],
        hours: entry.hours[day as keyof typeof entry.hours],
        description: entry.description,
      };

      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error();

      toast({
        title: "Сохранено",
        description: "Время успешно записано",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить",
        variant: "destructive",
      });
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      for (const entry of entries) {
        if (!entry.projectId || !entry.taskId) continue;
        
        for (const day of weekDays) {
          if (entry.hours[day] > 0) {
            await saveEntry(entry, day);
          }
        }
      }
      
      toast({
        title: "Успех",
        description: "Все записи сохранены",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить все записи",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDayTotal = (day: typeof weekDays[number]): number => {
    return entries.reduce((sum, entry) => sum + entry.hours[day], 0);
  };

  const calculateRowTotal = (entry: TimeEntry): number => {
    return Object.values(entry.hours).reduce((sum, h) => sum + h, 0);
  };

  const calculateWeekTotal = (): number => {
    return entries.reduce((sum, entry) => sum + calculateRowTotal(entry), 0);
  };

  const changeWeek = (direction: number) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + direction * 7);
    setCurrentWeek(newWeek);
  };

  const copyLastWeek = async () => {
    // TODO: Реализовать копирование прошлой недели
    toast({
      title: "В разработке",
      description: "Функция копирования прошлой недели скоро будет доступна",
    });
  };

  const getDateForDay = (dayIndex: number): string => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  const isWeekend = (dayIndex: number): boolean => {
    return dayIndex >= 5; // Сб, Вс
  };

  const isOvertime = (hours: number, isDay: boolean): boolean => {
    return isDay ? hours > 8 : hours > 40;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-['PT_Sans'] text-2xl">
            Недельный табель
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeWeek(-1)}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-['JetBrains_Mono'] text-sm min-w-[200px] text-center">
              {currentWeek.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
              {' - '}
              {getWeekEnd(currentWeek).toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: 'long' 
              })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeWeek(1)}
              disabled={isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLastWeek}
              disabled={isLoading}
            >
              <Copy className="h-4 w-4 mr-2" />
              Копировать прошлую неделю
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Сохранить всё
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2">
                <th className="text-left p-2 font-['PT_Sans'] font-semibold min-w-[200px]">
                  Проект
                </th>
                <th className="text-left p-2 font-['PT_Sans'] font-semibold min-w-[200px]">
                  Задача
                </th>
                <th className="text-left p-2 font-['PT_Sans'] font-semibold min-w-[200px]">
                  Описание
                </th>
                {weekDays.map((day, idx) => (
                  <th
                    key={day}
                    className={`text-center p-2 font-['PT_Sans'] font-semibold min-w-[80px] ${
                      isWeekend(idx) ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div>{weekDaysRu[idx]}</div>
                    <div className="text-xs font-normal text-gray-500">
                      {getDateForDay(idx)}
                    </div>
                  </th>
                ))}
                <th className="text-center p-2 font-['PT_Sans'] font-semibold min-w-[80px]">
                  Итого
                </th>
              </tr>
            </thead>

            <tbody>
              {entries.map((entry, idx) => {
                const rowTotal = calculateRowTotal(entry);
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <Select
                        value={entry.projectId}
                        onValueChange={(v) => handleUpdateEntry(idx, 'projectId', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите проект" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((proj) => (
                            <SelectItem key={proj.id} value={proj.id}>
                              {proj.code ? `[${proj.code}] ` : ''}{proj.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    <td className="p-2">
                      <Select
                        value={entry.taskId}
                        onValueChange={(v) => handleUpdateEntry(idx, 'taskId', v)}
                        disabled={!entry.projectId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите задачу" />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks
                            .filter((t) => t.projectId === entry.projectId)
                            .map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </td>

                    <td className="p-2">
                      <Input
                        value={entry.description}
                        onChange={(e) =>
                          handleUpdateEntry(idx, 'description', e.target.value)
                        }
                        placeholder="Описание работы..."
                        className="font-['JetBrains_Mono'] text-sm"
                      />
                    </td>

                    {weekDays.map((day, dayIdx) => {
                      const hours = entry.hours[day];
                      const isOverHours = hours > 8;
                      return (
                        <td
                          key={day}
                          className={`p-2 ${isWeekend(dayIdx) ? 'bg-gray-50' : ''}`}
                        >
                          <Input
                            value={formatHours(hours)}
                            onChange={(e) =>
                              handleUpdateHours(idx, day, e.target.value)
                            }
                            disabled={!entry.projectId || !entry.taskId}
                            className={`text-center font-['JetBrains_Mono'] text-sm ${
                              isOverHours ? 'bg-red-50 border-red-300' : ''
                            }`}
                            placeholder="0"
                          />
                        </td>
                      );
                    })}

                    <td className="p-2 text-center">
                      <span
                        className={`font-['JetBrains_Mono'] font-semibold ${
                          rowTotal > 40 ? 'text-red-600' : ''
                        }`}
                      >
                        {formatHours(rowTotal) || '0'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="border-t-2 font-semibold">
                <td colSpan={3} className="p-2 text-right font-['PT_Sans']">
                  Итого за день:
                </td>
                {weekDays.map((day, dayIdx) => {
                  const dayTotal = calculateDayTotal(day);
                  const isOver = isOvertime(dayTotal, true);
                  return (
                    <td
                      key={day}
                      className={`p-2 text-center ${
                        isWeekend(dayIdx) ? 'bg-gray-50' : ''
                      }`}
                    >
                      <span
                        className={`font-['JetBrains_Mono'] ${
                          isOver ? 'text-red-600' : ''
                        }`}
                      >
                        {formatHours(dayTotal) || '0'}
                      </span>
                    </td>
                  );
                })}
                <td className="p-2 text-center">
                  <span
                    className={`font-['JetBrains_Mono'] text-lg ${
                      isOvertime(calculateWeekTotal(), false) ? 'text-red-600' : ''
                    }`}
                  >
                    {formatHours(calculateWeekTotal()) || '0'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleAddRow}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить строку
          </Button>

          <div className="text-sm text-gray-600 font-['JetBrains_Mono']">
            Формат ввода: <code className="bg-gray-100 px-2 py-1 rounded">8</code>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">4.5</code>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">2:30</code>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">8h</code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Утилиты для работы с датами
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник
  return new Date(d.setDate(diff));
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d;
}

