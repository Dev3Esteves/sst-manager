"use client"

import { ConfirmDialog } from "./confirm-dialog"
import { Button } from "@/components/ui/button"
import { Ban } from "lucide-react"

interface InativarButtonProps {
  action: () => Promise<{ error?: { _form?: string[] } } | void>
  entityName: string
}

export function InativarButton({ action, entityName }: InativarButtonProps) {
  return (
    <ConfirmDialog
      title={`Inativar ${entityName}`}
      description={`Tem certeza que deseja inativar este registro? Ele não aparecerá mais nas listagens, mas os dados serão mantidos.`}
      action={action}
      trigger={
        <Button variant="destructive" size="sm">
          <Ban className="h-4 w-4 mr-1" />
          Inativar
        </Button>
      }
    />
  )
}
