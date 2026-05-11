import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { NcForm } from "../nc-form"
import {
  deleteNc,
  replace5whys,
  replaceIshikawa,
  updateNc,
  createAc,
  updateAc,
  deleteAc,
  type Cinco5WhysItem,
  type IshikawaItem,
} from "../actions"
import { CincoWhysEditor } from "./cinco-whys-editor"
import { IshikawaEditor } from "./ishikawa-editor"
import { AcoesEditor, type AcRow } from "./acoes-editor"
import {
  NC_ORIGEM_LABEL,
  NC_SEVERIDADE_LABEL,
  NC_STATUS_LABEL,
  type IshikawaCategoria,
  type NcOrigem,
  type NcSeveridade,
  type NcStatus,
  type NcMetodoAnalise,
} from "@/lib/validations/nao-conformidade"

type NcRow = {
  id: string
  empresa_id: string
  obra_id: string | null
  ocorrencia_id: string | null
  numero_sequencial: number
  titulo: string
  descricao: string
  origem: NcOrigem
  data_identificacao: string
  identificado_por_nome: string | null
  severidade: NcSeveridade
  status: NcStatus
  data_encerramento: string | null
  metodo_analise: NcMetodoAnalise | null
  causa_raiz_consolidada: string | null
  observacoes: string | null
}

type Whys = {
  ordem: number
  pergunta: string
  resposta: string
  eh_causa_raiz: boolean
}

type Ishi = {
  categoria: IshikawaCategoria
  causa: string
  eh_causa_raiz: boolean
  ordem: number
}

const SEVERIDADE_BADGE: Record<NcSeveridade, "default" | "outline" | "alerta" | "critico"> = {
  baixa: "outline",
  media: "default",
  alta: "alerta",
  critica: "critico",
}

const STATUS_BADGE: Record<NcStatus, "default" | "outline" | "secondary"> = {
  aberta: "default",
  em_analise: "default",
  em_tratamento: "default",
  verificacao: "default",
  encerrada: "secondary",
  cancelada: "outline",
}

export default async function NcDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: nc } = await supabase
    .from("nao_conformidades")
    .select("*")
    .eq("id", id)
    .single<NcRow>()

  if (!nc) notFound()

  const [
    { data: empresas },
    { data: obras },
    { data: whys },
    { data: ishikawas },
    { data: acoes },
  ] = await Promise.all([
    supabase.from("empresas").select("id, razao_social").eq("ativo", true).order("razao_social"),
    supabase.from("obras").select("id, nome, empresa_id").eq("ativa", true).order("nome"),
    supabase
      .from("nc_causa_5whys")
      .select("ordem, pergunta, resposta, eh_causa_raiz")
      .eq("nao_conformidade_id", id)
      .order("ordem")
      .returns<Whys[]>(),
    supabase
      .from("nc_causa_ishikawa")
      .select("categoria, causa, eh_causa_raiz, ordem")
      .eq("nao_conformidade_id", id)
      .order("categoria")
      .order("ordem")
      .returns<Ishi[]>(),
    supabase
      .from("nc_acoes_corretivas")
      .select(`
        id, numero_sequencial, tipo, descricao, responsavel_nome, data_prazo,
        data_inicio, data_conclusao, status, evidencia_eficacia, verificado_em,
        verificado_por_nome, eficaz
      `)
      .eq("nao_conformidade_id", id)
      .order("numero_sequencial")
      .returns<AcRow[]>(),
  ])

  const whysList = whys ?? []
  const ishikawaList = ishikawas ?? []
  const acoesList = acoes ?? []
  const proximoNumeroAc =
    acoesList.length === 0 ? 1 : Math.max(...acoesList.map((a) => a.numero_sequencial)) + 1

  async function handleUpdate(formData: FormData) {
    "use server"
    return updateNc(id, formData)
  }

  async function handleDelete() {
    "use server"
    return deleteNc(id)
  }

  async function handleSave5whys(itens: Cinco5WhysItem[]) {
    "use server"
    return replace5whys(id, itens)
  }

  async function handleSaveIshikawa(itens: IshikawaItem[]) {
    "use server"
    return replaceIshikawa(id, itens)
  }

  return (
    <div className="container py-8 max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-3">
        <Link href="/nao-conformidades">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono">
              NC-{String(nc.numero_sequencial).padStart(4, "0")}
            </Badge>
            <Badge variant={SEVERIDADE_BADGE[nc.severidade]}>
              {NC_SEVERIDADE_LABEL[nc.severidade]}
            </Badge>
            <Badge variant={STATUS_BADGE[nc.status]}>{NC_STATUS_LABEL[nc.status]}</Badge>
            <Badge variant="outline" className="text-[10px]">
              {NC_ORIGEM_LABEL[nc.origem]}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{nc.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Identificada em{" "}
            {new Date(nc.data_identificacao).toLocaleDateString("pt-BR")}
            {nc.identificado_por_nome ? ` por ${nc.identificado_por_nome}` : ""}
            {nc.ocorrencia_id && (
              <>
                {" · "}
                <Link
                  href={`/ocorrencias/${nc.ocorrencia_id}`}
                  className="underline hover:text-foreground"
                >
                  Ocorrência vinculada
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      <NcForm
        nc={nc}
        empresas={empresas ?? []}
        obras={obras ?? []}
        action={handleUpdate}
        onDelete={handleDelete}
        modo="editar"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">5 Porquês</CardTitle>
        </CardHeader>
        <CardContent>
          <CincoWhysEditor inicial={whysList} action={handleSave5whys} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ishikawa (6M)</CardTitle>
        </CardHeader>
        <CardContent>
          <IshikawaEditor inicial={ishikawaList} action={handleSaveIshikawa} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Ações corretivas ({acoesList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AcoesEditor
            ncId={id}
            acoes={acoesList}
            proximoNumero={proximoNumeroAc}
            createAction={createAc}
            updateAction={updateAc}
            deleteAction={deleteAc}
          />
        </CardContent>
      </Card>
    </div>
  )
}
