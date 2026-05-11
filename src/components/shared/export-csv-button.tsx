"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportCsvButtonProps<T extends Record<string, unknown>> {
  data: T[]
  columns: { key: keyof T; label: string }[]
  filename: string
}

function toCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const header = columns.map((c) => escape(c.label)).join(",")
  const rows = data.map((row) =>
    columns.map((c) => escape(row[c.key])).join(","),
  )
  return "﻿" + [header, ...rows].join("\r\n")
}

export function ExportCsvButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
}: ExportCsvButtonProps<T>) {
  function handleExport() {
    const csv = toCsv(data, columns)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={data.length === 0}>
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  )
}
