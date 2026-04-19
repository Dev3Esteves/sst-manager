"use client"

/**
 * Select HTML nativo que submete o form pai ao mudar valor.
 * Usado em páginas server-rendered onde trocar o dropdown deve recarregar
 * a página com query param atualizado (ex: seletor de mês em relatórios).
 */

type Props = {
  name: string
  defaultValue: string
  className?: string
  children: React.ReactNode
}

export function SubmitOnChangeSelect({ name, defaultValue, className, children }: Props) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.submit()}
      className={className ?? "rounded-md border px-3 py-2 text-sm bg-background"}
    >
      {children}
    </select>
  )
}
