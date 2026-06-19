import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock do admin client: a marca é lida do singleton `organizacao`.
const state = vi.hoisted(() => ({ row: null as Record<string, unknown> | null }))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        limit: () => ({
          maybeSingle: async () => ({ data: state.row, error: null }),
        }),
      }),
    }),
  }),
}))

import { getMarca, getOrganizacao } from "./marca"

describe("branding determinístico (Organização)", () => {
  beforeEach(() => {
    state.row = null
  })

  it("getMarca retorna nome + logo da Organização", async () => {
    state.row = {
      nome: "Acme SST",
      nome_fantasia: null,
      logo_url: "https://x/logo.png",
      template_certificado: null,
    }
    expect(await getMarca()).toEqual({ nome: "Acme SST", logoUrl: "https://x/logo.png" })
  })

  it("getMarca usa fallback neutro quando não há Organização", async () => {
    state.row = null
    expect(await getMarca()).toEqual({ nome: "SST Manager", logoUrl: null })
  })

  it("getOrganizacao expõe template para os PDFs e null sem organização", async () => {
    state.row = { nome: "Acme", nome_fantasia: "Acme", logo_url: null, template_certificado: "TPL" }
    expect((await getOrganizacao())?.templateCertificado).toBe("TPL")
    state.row = null
    expect(await getOrganizacao()).toBeNull()
  })
})
