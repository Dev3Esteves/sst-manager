"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts"

export function OcorrenciasPorMesChart({ data }: { data: { mes: string; total: number; acidentes: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="mes" fontSize={11} />
        <YAxis fontSize={11} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 6 }}
          labelFormatter={(m) => `Mês: ${m}`}
        />
        <Bar dataKey="total" fill="hsl(215 28% 17%)" name="Total" />
        <Bar dataKey="acidentes" fill="hsl(0 72% 42%)" name="Acidentes" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TopDesviosChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" fontSize={11} allowDecimals={false} />
        <YAxis type="category" dataKey="label" fontSize={11} width={110} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
        <Bar dataKey="count" name="Ocorrências">
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? "hsl(0 72% 42%)" : i === 1 ? "hsl(24 95% 43%)" : "hsl(215 28% 17%)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
