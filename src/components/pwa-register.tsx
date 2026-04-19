"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV !== "production") return // evita ruído em dev

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // fail silently
    })
  }, [])
  return null
}
