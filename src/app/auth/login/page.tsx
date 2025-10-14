"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

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

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Ошибка входа")
      }

      router.push("/")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      {/* Base gradient background - синий градиент */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f2942] via-[#1e3a5e] to-[#2563eb]" />

      {/* Overlay gradients for depth - голубые оттенки */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0ea5e9]/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#2563eb]/20 via-transparent to-transparent" />

      {/* Animated blobs - голубые */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -right-48 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, rgba(14, 165, 233, 0.1) 50%, transparent 100%)",
            animation: "float 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-25 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, rgba(37, 99, 235, 0.1) 50%, transparent 100%)",
            animation: "float 25s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 100%)",
            animation: "pulse 15s ease-in-out infinite",
          }}
        />
      </div>

      {/* Login card */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl border-slate-200/20 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-credos-primary to-credos-accent flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Добро пожаловать</CardTitle>
          <CardDescription>Credos Project Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@credos.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Войти
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Нет аккаунта?{" "}
              <Link href="/auth/signup" className="text-credos-primary hover:underline font-medium">
                Зарегистрироваться
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.3; transform: translate(-50%, -50%) scale(1.05); }
        }
      `}</style>
    </div>
  )
}
