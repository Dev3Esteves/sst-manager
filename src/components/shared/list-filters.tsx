"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export type FilterOption = { value: string; label: string }

export type FilterConfig = {
  key: string
  label: string
  type: "text" | "select" | "date"
  options?: FilterOption[]
  placeholder?: string
}

export function ListFilters({ filters }: { filters: FilterConfig[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const hasActiveFilters = filters.some((f) => searchParams.has(f.key))

  function clearAll() {
    router.push(pathname)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {filters.map((f) => {
        const current = searchParams.get(f.key) ?? ""
        if (f.type === "select" && f.options) {
          return (
            <div key={f.key} className="space-y-1">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <Select value={current || "all"} onValueChange={(v) => updateParam(f.key, v)}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder={f.placeholder ?? "Todos"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
        if (f.type === "date") {
          return (
            <div key={f.key} className="space-y-1">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <Input
                type="date"
                className="w-[150px] h-9"
                value={current}
                onChange={(e) => updateParam(f.key, e.target.value)}
              />
            </div>
          )
        }
        return (
          <div key={f.key} className="space-y-1">
            <label className="text-xs text-muted-foreground">{f.label}</label>
            <Input
              type="text"
              className="w-[200px] h-9"
              placeholder={f.placeholder ?? `Buscar ${f.label.toLowerCase()}...`}
              value={current}
              onChange={(e) => updateParam(f.key, e.target.value)}
            />
          </div>
        )
      })}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-9">
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
