"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Ошибка регистрации")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
        {/* Base mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2942] via-[#1e3a52] to-[#2d4a5e]" />

        {/* Overlay gradients for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#10b981]/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#3b82f6]/10 via-transparent to-transparent" />

        {/* Animated organic blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-48 -right-48 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl float" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-25 blur-3xl float reverse" />
        </div>

        {/* Enhanced grid pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="enhanced-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white" />
              <circle cx="0" cy="0" r="1" fill="currentColor" className="text-white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#enhanced-grid)" />
        </svg>

        <Card className="relative z-10 w-full max-w-md shadow-2xl backdrop-blur-xl bg-[#1e3a52]/90 border-[#3d5a73]/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Проверьте email</CardTitle>
            <CardDescription className="text-gray-300">
              Мы отправили письмо с подтверждением на {email}. Пожалуйста, перейдите по ссылке в письме для активации
              аккаунта.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/login">Вернуться к входу</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
        <div className="absolute -top-48 -right-48 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl float" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-25 blur-3xl float reverse" />
        <div
          className="absolute top-1/2 right-1/4 h-[350px] w-[350px] rounded-full opacity-20 blur-2xl float"
          style={{
            animationDelay: "5s",
          }}
        />
        <div
          className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full opacity-15 blur-2xl float reverse"
          style={{
            animationDelay: "8s",
          }}
        />
      </div>

      {/* Geometric elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
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

      {/* Enhanced grid pattern */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="enhanced-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white" />
            <circle cx="0" cy="0" r="1" fill="currentColor" className="text-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#enhanced-grid)" />
      </svg>

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
        }}
      />

      {/* Glassmorphism card */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl backdrop-blur-xl bg-[#1e3a52]/90 border-[#3d5a73]/50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 items-center justify-center">
            <img
              src="https://static.tildacdn.com/tild3738-3365-4538-b862-653038663431/__.svg"
              alt="Кибероснова"
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Регистрация</CardTitle>
          <CardDescription className="text-gray-300">Создайте аккаунт для доступа к системе</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-200">
                Полное имя
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Иван Иванов"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="bg-[#2d4a5e] border-[#3d5a73] text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="bg-[#2d4a5e] border-[#3d5a73] text-white placeholder:text-gray-400"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
            <p className="text-center text-sm text-gray-300">
              Уже есть аккаунт?{" "}
              <Link href="/auth/login" className="text-[#10b981] hover:underline font-medium">
                Войти
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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
