import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Shield,
  FileText,
  CheckCircle2,
  FileStack,
  BookOpen,
} from "lucide-react"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-[#1e3a52]/95 shadow-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src="https://static.tildacdn.com/tild3738-3365-4538-b862-653038663431/__.svg"
              alt="Кибероснова"
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-white">Кибероснова Комплаенс</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            {/* Выпадающее меню Функционал */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1">
                Функционал
                <svg
                  className="w-4 h-4 transition-transform group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Выпадающий список */}
              <div className="absolute top-full left-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-[#1e3a52]/95 backdrop-blur-xl border-2 border-[#10b981]/30 rounded-xl shadow-2xl overflow-hidden">
                  <Link
                    href="/landing/requirements"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#10b981]/20 transition-colors border-b border-white/10"
                  >
                    <FileText className="w-5 h-5 text-[#10b981]" />
                    <span className="text-white">Управление требованиями</span>
                  </Link>
                  <Link
                    href="/landing/controls"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#3b82f6]/20 transition-colors border-b border-white/10"
                  >
                    <Shield className="w-5 h-5 text-[#3b82f6]" />
                    <span className="text-white">Контрольные мероприятия</span>
                  </Link>
                  <Link
                    href="/landing/evidence"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#10b981]/20 transition-colors border-b border-white/10"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                    <span className="text-white">Управление доказательствами</span>
                  </Link>
                  <Link
                    href="/landing/documents"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#3b82f6]/20 transition-colors border-b border-white/10"
                  >
                    <FileText className="w-5 h-5 text-[#3b82f6]" />
                    <span className="text-white">Документооборот</span>
                  </Link>
                  <Link
                    href="/landing/templates"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#10b981]/20 transition-colors border-b border-white/10"
                  >
                    <FileStack className="w-5 h-5 text-[#10b981]" />
                    <span className="text-white">Библиотека шаблонов</span>
                  </Link>
                  <Link
                    href="/landing/knowledge"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#3b82f6]/20 transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-[#3b82f6]" />
                    <span className="text-white">База знаний</span>
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/landing#benefits" className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
              Преимущества
            </Link>
            <Link href="/landing#contact" className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
              Контакты
            </Link>
            <div className="h-6 w-px bg-white/20 mx-2"></div>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Войти
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-[#10b981] hover:bg-[#0d9668] text-white shadow-lg">Попробовать</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

