import type React from "react"
import type { Metadata } from "next"
import { PT_Sans, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const ptSans = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-pt-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Кибероснова Комплаенс",
  description: "Система управления комплаенсом информационной безопасности",
  generator: "v0.app",
  icons: {
    icon: "https://static.tildacdn.com/tild6464-6361-4633-b238-396633363730/favicon.ico",
    shortcut: "https://static.tildacdn.com/tild6464-6361-4633-b238-396633363730/favicon.ico",
    apple: "https://static.tildacdn.com/tild6464-6361-4633-b238-396633363730/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`font-sans ${ptSans.variable} ${jetbrainsMono.variable} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
