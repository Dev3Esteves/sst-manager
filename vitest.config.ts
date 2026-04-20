import { defineConfig } from "vitest/config"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Render de PDFs cumulativos com @react-pdf/renderer pode demorar
    // ~1-4s por caso em Windows — rodando em paralelo com outros workers,
    // o primeiro render de cada arquivo (que carrega as fontes embutidas)
    // já pode bater nos 5s do default. Subimos o timeout pra eliminar
    // flakes sem esconder testes genuinamente travados.
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Usa o JSX runtime automático do React (auto-import de jsx-runtime)
    // — necessário para testar componentes/PDFs sem `import React` manual.
    jsx: "automatic",
  },
})
