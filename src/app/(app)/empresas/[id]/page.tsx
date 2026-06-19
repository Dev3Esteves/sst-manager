import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EmpresaForm } from "../empresa-form"
import { updateEmpresa, inativarEmpresa } from "../actions"
import { InativarButton } from "@/components/shared/inativar-button"

export default async function EditEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: empresa }, { data: proprias }, { data: papeis }, { data: enderecos }, { data: contatos }, { data: fiscal }] =
    await Promise.all([
      supabase.from("empresas").select("*").eq("id", id).single(),
      supabase
        .from("empresas")
        .select("id, razao_social")
        .eq("propria", true)
        .neq("id", id) // nunca pode ser mãe de si mesma
        .order("razao_social"),
      supabase.from("empresa_papeis").select("papel").eq("empresa_id", id),
      supabase
        .from("empresa_enderecos")
        .select("tipo, cep, logradouro, numero, complemento, bairro, municipio, uf, principal")
        .eq("empresa_id", id)
        .order("principal", { ascending: false }),
      supabase
        .from("empresa_contatos")
        .select("tipo, valor, nome_contato, cargo_contato, principal")
        .eq("empresa_id", id)
        .order("principal", { ascending: false }),
      supabase
        .from("empresa_fiscal")
        .select("inscricao_municipal, cnae_principal, regime_tributario, situacao_cadastral")
        .eq("empresa_id", id)
        .maybeSingle(),
    ])
  if (!empresa) notFound()

  const empresaCompleta = {
    ...empresa,
    papeis: (papeis ?? []).map((p) => p.papel as string),
    enderecos: (enderecos ?? []).map((e) => ({
      tipo: e.tipo ?? "sede",
      cep: e.cep ?? "", logradouro: e.logradouro ?? "", numero: e.numero ?? "",
      complemento: e.complemento ?? "", bairro: e.bairro ?? "", municipio: e.municipio ?? "",
      uf: e.uf ?? "", principal: !!e.principal,
    })),
    contatos: (contatos ?? []).map((c) => ({
      tipo: c.tipo ?? "telefone", valor: c.valor ?? "", nome_contato: c.nome_contato ?? "",
      cargo_contato: c.cargo_contato ?? "", principal: !!c.principal,
    })),
    fiscal: fiscal
      ? {
          inscricao_municipal: fiscal.inscricao_municipal ?? "",
          cnae_principal: fiscal.cnae_principal ?? "",
          regime_tributario: fiscal.regime_tributario ?? "",
          situacao_cadastral: fiscal.situacao_cadastral ?? "",
        }
      : null,
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex justify-end mb-4">
        <InativarButton action={inativarEmpresa.bind(null, id)} entityName="empresa" />
      </div>
      <EmpresaForm
        empresa={empresaCompleta}
        propriasDisponiveis={proprias ?? []}
        action={updateEmpresa.bind(null, id)}
      />
    </div>
  )
}
