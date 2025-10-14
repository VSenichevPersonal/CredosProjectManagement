"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, FileText, Building2, BookOpen, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchResults {
  requirements: Array<{ id: string; code: string; title: string; category: string }>
  organizations: Array<{ id: string; name: string; type: string }>
  articles: Array<{ id: string; title: string; category: string }>
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>({ requirements: [], organizations: [], articles: [] })
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults({ requirements: [], organizations: [], articles: [] })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    performSearch(debouncedQuery)
  }, [debouncedQuery, performSearch])

  const handleSelect = (type: string, id: string) => {
    setOpen(false)
    setQuery("")

    switch (type) {
      case "requirement":
        router.push(`/requirements/${id}`)
        break
      case "organization":
        router.push(`/organizations/${id}`)
        break
      case "article":
        router.push(`/knowledge-base/${id}`)
        break
    }
  }

  return (
    <>
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
        <Input
          type="search"
          placeholder="Поиск... (Ctrl+K)"
          className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/15 focus:border-white/30"
          onClick={() => setOpen(true)}
          readOnly
        />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Поиск требований, организаций, статей..." value={query} onValueChange={setQuery} />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && query.length >= 2 && (
            <>
              <CommandEmpty>Ничего не найдено</CommandEmpty>

              {results.requirements.length > 0 && (
                <CommandGroup heading="Требования">
                  {results.requirements.map((req) => (
                    <CommandItem key={req.id} onSelect={() => handleSelect("requirement", req.id)}>
                      <FileText className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {req.code}: {req.title}
                        </span>
                        <span className="text-xs text-muted-foreground">{req.category}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.organizations.length > 0 && (
                <CommandGroup heading="Организации">
                  {results.organizations.map((org) => (
                    <CommandItem key={org.id} onSelect={() => handleSelect("organization", org.id)}>
                      <Building2 className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{org.name}</span>
                        <span className="text-xs text-muted-foreground">{org.type}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.articles.length > 0 && (
                <CommandGroup heading="База знаний">
                  {results.articles.map((article) => (
                    <CommandItem key={article.id} onSelect={() => handleSelect("article", article.id)}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{article.title}</span>
                        <span className="text-xs text-muted-foreground">{article.category}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          {!loading && query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">Введите минимум 2 символа для поиска</div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
