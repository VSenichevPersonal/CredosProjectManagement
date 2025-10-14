"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqData = [
  {
    category: "Общие вопросы",
    questions: [
      {
        q: "Как начать работу с системой?",
        a: "После входа в систему вы увидите дашборд с вашими требованиями. Начните с просмотра назначенных требований и изучения их деталей.",
      },
      {
        q: "Как изменить статус требования?",
        a: "Откройте детальную страницу требования и нажмите кнопку 'Изменить статус'. Выберите новый статус и добавьте комментарий.",
      },
      {
        q: "Как загрузить подтверждающие документы?",
        a: "На странице требования нажмите 'Загрузить документы', затем перетащите файлы или выберите их через диалог. Поддерживаются PDF, DOCX, JPG, PNG до 50 МБ.",
      },
    ],
  },
  {
    category: "Требования",
    questions: [
      {
        q: "Что означают цвета критичности?",
        a: "Красный - критическая, оранжевый - высокая, желтый - средняя, зеленый - низкая критичность.",
      },
      {
        q: "Как запросить помощь по требованию?",
        a: "На странице требования нажмите 'Запросить помощь', опишите ваш вопрос, и ответственное лицо получит уведомление.",
      },
      {
        q: "Можно ли отметить требование как неприменимое?",
        a: "Да, измените статус на 'Не применимо' и обязательно укажите обоснование в комментарии.",
      },
    ],
  },
  {
    category: "Отчеты и аналитика",
    questions: [
      {
        q: "Как экспортировать отчет?",
        a: "Перейдите в раздел 'Отчеты', выберите тип отчета, настройте фильтры и нажмите 'Экспортировать в Excel'.",
      },
      {
        q: "Что показывает Compliance Heatmap?",
        a: "Heatmap визуализирует статус выполнения требований по всем организациям. Цвета показывают прогресс: зеленый - выполнено, желтый - в работе, красный - просрочено.",
      },
    ],
  },
]

const quickLinks = [
  { title: "Руководство пользователя", url: "/docs/user-guide" },
  { title: "Видеоинструкции", url: "/docs/videos" },
  { title: "API документация", url: "/docs/api" },
  { title: "Связаться с поддержкой", url: "mailto:support@hcmp.ru" },
]

export function HelpButton() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFAQ = faqData.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) || q.a.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  }))

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Помощь</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Центр помощи</SheetTitle>
          <SheetDescription>Найдите ответы на ваши вопросы или свяжитесь с поддержкой</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="faq" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="resources">Ресурсы</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-4">
            <Input
              placeholder="Поиск по вопросам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            <div className="space-y-4">
              {filteredFAQ.map(
                (category) =>
                  category.questions.length > 0 && (
                    <div key={category.category}>
                      <h3 className="font-semibold mb-2">{category.category}</h3>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((item, index) => (
                          <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ),
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold mb-3">Полезные ссылки</h3>
              {quickLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.url}
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <p className="font-medium">{link.title}</p>
                </a>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Нужна помощь?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Наша команда поддержки готова помочь вам с любыми вопросами
              </p>
              <Button className="w-full" asChild>
                <a href="mailto:support@hcmp.ru">Связаться с поддержкой</a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
