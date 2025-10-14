"use client"

import type React from "react"
import Link from "next/link"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    logger.info("Login attempt started", { email })

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logger.error("Login failed", error, { email })
        throw error
      }

      logger.info("Login successful, redirecting to dashboard", { email })

      window.location.href = "/"
    } catch (err: any) {
      logger.error("Login error", err, { email })
      setError(err.message || "Ошибка входа")
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      {/* Base mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f2942] via-[#1e3a52] to-[#2d4a5e]" />

      {/* Overlay gradients for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#10b981]/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#3b82f6]/10 via-transparent to-transparent" />

      {/* Animated organic blobs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large animated blob - top right */}
        <div
          className="absolute -top-48 -right-48 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.1) 50%, transparent 100%)",
            animation: "float 20s ease-in-out infinite",
          }}
        />

        {/* Medium animated blob - bottom left */}
        <div
          className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)",
            animation: "float 25s ease-in-out infinite reverse",
          }}
        />

        {/* Small animated blob - center right */}
        <div
          className="absolute top-1/2 right-1/4 h-[350px] w-[350px] rounded-full opacity-20 blur-2xl"
          style={{
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)",
            animation: "float 18s ease-in-out infinite",
            animationDelay: "5s",
          }}
        />

        {/* Accent blob - top left */}
        <div
          className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full opacity-15 blur-2xl"
          style={{
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
            animation: "float 22s ease-in-out infinite",
            animationDelay: "8s",
          }}
        />
      </div>

      {/* Geometric elements for tech feel */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {/* Hexagon pattern */}
        <svg className="absolute top-10 right-10 w-32 h-32 text-white" viewBox="0 0 100 100">
          <polygon
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <polygon
            points="50,15 80,32.5 80,67.5 50,85 20,67.5 20,32.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </svg>

        <svg className="absolute bottom-20 left-20 w-40 h-40 text-white" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Enhanced grid pattern with perspective */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="enhanced-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white" />
            <circle cx="0" cy="0" r="1" fill="currentColor" className="text-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#enhanced-grid)" />
      </svg>

      {/* Subtle noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
        }}
      />

      {/* Glassmorphism card with enhanced backdrop blur */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl backdrop-blur-xl bg-[#1e3a52]/90 border-[#3d5a73]/50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 items-center justify-center">
            <img
              src="https://static.tildacdn.com/tild3738-3365-4538-b862-653038663431/__.svg"
              alt="Кибероснова"
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Кибероснова Комплаенс</CardTitle>
          <CardDescription className="text-gray-300">Войдите в систему управления комплаенсом</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-[#2d4a5e] border-[#3d5a73] text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-[#2d4a5e] border-[#3d5a73] text-white placeholder:text-gray-400"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Вход..." : "Войти"}
            </Button>

            <p className="text-center text-sm text-gray-300">
              Нет аккаунта?{" "}
              <Link href="/auth/signup" className="text-[#10b981] hover:underline font-medium">
                Зарегистрироваться
              </Link>
            </p>

            <div className="text-center mt-4">
              <Link href="/landing">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-[#10b981] hover:text-[#0d9668] hover:bg-[#10b981]/10"
                >
                  Узнать подробнее о продукте
                </Button>
              </Link>
            </div>

            <div className="mt-4 rounded-md bg-[#2d4a5e]/50 border border-[#3d5a73] p-3 text-xs text-gray-300">
              <p className="font-medium mb-1">Для входа используйте:</p>
              <p>Email и пароль вашей учетной записи</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
