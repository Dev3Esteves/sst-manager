"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Ban, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { LocalInput } from "@/lib/validations/estoque"
import { LocalForm } from "./local-form"

type Obra = { id: string; nome: string }
type Local = {
  id: string
  nome: string
  tipo: "central" | "obra"
  obra_id: string | null
  obra_nome: string | null
  ativo: boolean
}
type FormErrors = { _form?: string[] }
type ActionResult = { error?: FormErrors } | { ok: true }

export function LocaisClient({
  locais, obras, criar, atualizar, inativar,
}: {
  locais: Local[]
  obras: Obra[]
  criar: (payload: LocalInput) => Promise<ActionResult>
  atualizar: (id: string, payload: LocalInput) => Promise<ActionResult>
  inativar: (id: string) => Promise<ActionResult>
}) {
  const [editando, setEditando] = useState<Local | null>(null)
  const [inativandoId, setInativandoId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleInativar(id: string) {
    setInativandoId(id)
    startTransition(async () => {
      const r = await inativar(id)
      setInativandoId(null)
      if ("error" in r && r.error) toast.error(r.error._form?.[0] ?? "Falha ao inativar.")
      else toast.success("Local inativado.")
    })
  }

  return (
    <div className="space-y-6">
      <LocalForm
        key={editando?.id ?? "novo"}
        obras={obras}
        criar={criar}
        atualizar={atualizar}
        local={editando ?? undefined}
        onDone={() => setEditando(null)}
      />
      {editando && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setEditando(null)}>Cancelar edição</Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{locais.length} local(is)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locais.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell className="capitalize">{l.tipo}</TableCell>
                  <TableCell className="text-sm">{l.obra_nome ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {l.ativo ? <Badge variant="regular">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" aria-label="Editar local" onClick={() => setEditando(l)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {l.ativo && (
                        <Button
                          variant="ghost" size="icon" aria-label="Inativar local"
                          disabled={pending && inativandoId === l.id}
                          onClick={() => handleInativar(l.id)}
                        >
                          {pending && inativandoId === l.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Ban className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {locais.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum local cadastrado. Crie o primeiro acima.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
