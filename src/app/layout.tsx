import type { Metadata } from 'next'
import { PT_Sans, JetBrains_Mono } from 'next/font/google'
import { Suspense } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from '@/lib/providers/query-provider'
import './globals.css'

const ptSans = PT_Sans({
  weight: ['400', '700'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-pt-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Credos Project Management',
  description: 'Система управления проектами и трудозатратами Кредо-С',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`font-sans ${ptSans.variable} ${jetbrainsMono.variable} antialiased`}>
        <QueryProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
