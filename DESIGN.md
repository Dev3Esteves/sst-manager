# DESIGN.md — Sistema de design do SST Manager

Sistema de design portátil deste projeto (padrão inspirado no `DESIGN.md` do **open-design**,
`nexu-io/open-design`). Descreve tokens, componentes e padrões reais já em uso, para que qualquer
geração/edição de UI fique consistente. Fonte de verdade do código: `tailwind.config.ts`,
`src/app/globals.css`, `src/components/ui/*`.

## Identidade

- **Produto:** SST Manager — gestão de Saúde e Segurança do Trabalho (SST/PGR/PCMSO).
- **Tom:** institucional, técnico, sóbrio. Densidade de informação alta (tabelas, mapas de calor,
  relatórios). Nada lúdico.
- **White-label:** o repo comercial (`sst-manager`) troca o branding (logo/nome); tokens e
  componentes são idênticos.

## Cor

Tokens HSL em CSS vars (`globals.css`), expostos no Tailwind (`tailwind.config.ts`). Use sempre os
tokens semânticos — nunca hex cru.

| Token | Light (HSL) | Uso |
|---|---|---|
| `--background` / `--foreground` | `0 0% 100%` / `240 10% 3.9%` | fundo / texto (neutros zinc) |
| `--primary` | `215 28% 17%` (slate-800) | azul institucional — ações primárias, ring |
| `--muted` / `--muted-foreground` | `240 4.8% 95.9%` / `240 3.8% 46.1%` | superfícies neutras, texto secundário |
| `--destructive` | `0 72% 42%` | destrutivo (alinhado a "vencido") |
| `--border` / `--input` / `--ring` | `240 5.9% 90%` / idem / `215 28% 17%` | bordas, inputs, foco |

**Paleta SST — semáforo de status** (vencimento/risco). É a cor mais característica do produto:

| Token | Light | Significado |
|---|---|---|
| `status-regular` | `142 71% 29%` (verde-700) | em dia / risco baixo |
| `status-alerta` | `45 93% 47%` (amarelo-500) | ≤ 60 dias / risco médio |
| `status-critico` | `24 95% 43%` (laranja-600) | ≤ 30 dias |
| `status-vencido` | `0 72% 42%` (vermelho-700) | vencido / risco alto |

- Classes: `bg-status-regular`, `text-status-vencido`, etc.
- **Dark mode** (`.dark`): há variantes mais claras de cada token (ver `globals.css`).
- **Contraste do texto sobre status:** `regular/critico/vencido` → texto branco; `alerta` (amarelo)
  → texto **preto** (ver variantes do `Badge`).

## Tipografia

- Fonte única: **Inter** (`next/font/google`), via `--font-sans` → `font-sans`.
- `font-feature-settings: "rlig" 1, "calt" 1` no `body`.
- Números tabulares (`tabular-nums`) em datas/contadores de tabelas.

## Forma & espaçamento

- Raio: `--radius: 0.5rem` → `rounded-lg/md/sm` derivados.
- Container central, `padding: 2rem`, breakpoint máx. `2xl: 1400px`.
- Animações: `tailwindcss-animate` (`accordion-down/up`).

## Componentes (shadcn/ui + Radix)

Em `src/components/ui/`: `alert-dialog`, `badge`, `button`, `card`, `command`, `dialog`, `input`,
`label`, `select`, `skeleton`, `submit-on-change-select`, `table`. Compostos com o util `cn`
(clsx + tailwind-merge). Padrões:

- **Badge** — variantes semânticas: `regular | alerta | critico | vencido` (+ `default`/`outline`).
  Use para status de vencimento e classificação de risco.
- **Card** — `Card/CardHeader/CardTitle/CardDescription/CardContent`. Unidade base de seção.
- **Table** — listagens densas; cabeçalho `bg-muted/50`; células `text-xs` em dados tabulares.
- **Mapa de calor (psicossocial)** — tabela GHE × dimensão; célula colorida pela classificação
  (`bg-status-*`), cinza (`bg-muted`) = suprimido (k-anonimato).
- **Ícones:** `lucide-react`.
- **Toasts:** `sonner`.

## Relatórios / impressão

Dois caminhos: **PDF programático** (`@react-pdf/renderer`, em `src/lib/pdf/*` e rotas
`/api/**/relatorio`) e **print do navegador** (stylesheet em `globals.css`):

- `@media print`: A4 retrato, margem 15mm, `print-color-adjust: exact` (força cores de
  badges/mapas), `break-inside: avoid` em `section`/`table`.
- Navegação marcada com `print:hidden` (sidebar/topbar).
- Datas de documentos no fuso **America/Sao_Paulo**.

## Regras de uso (para gerar/editar UI)

1. Só tokens semânticos; o semáforo `status-*` é a linguagem de status do produto.
2. Reaproveite os componentes `ui/` e o util `cn`; não recrie primitivos.
3. Densidade alta: `text-xs`/`text-sm` em tabelas, `tabular-nums` em números.
4. Cada tela de relatório precisa funcionar no print (cores + quebras de página).
5. Acessibilidade: respeite o contraste do amarelo (`alerta` → texto preto).
