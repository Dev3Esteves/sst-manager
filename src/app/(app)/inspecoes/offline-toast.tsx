"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

export function OfflineToast() {
  const params = useSearchParams()
  useEffect(() => {
    if (params.get("offline") === "1") {
      toast.info("Inspeção salva offline", {
        description: "Será enviada automaticamente quando você reconectar.",
        duration: 6000,
      })
    }
  }, [params])
  return null
}
