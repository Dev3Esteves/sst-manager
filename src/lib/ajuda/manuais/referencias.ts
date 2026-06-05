import type { Manual } from "../tipos"

export const manuaisReferencias: Manual[] = [
  {
    slug: "referencias-nrs",
    titulo: "Catálogo de Normas Regulamentadoras",
    modulo: "Normas (NRs)",
    categoria: "Referências",
    rota: "/referencias/nrs",
    perfis: ["Todos"],
    resumo: "Consulta às NRs (Normas Regulamentadoras) catalogadas, para referência rápida durante o preenchimento de documentos e treinamentos.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Biblioteca de consulta das NRs vigentes. Use para confirmar a norma aplicável a um treinamento, autorização ou risco." },
        { tipo: "dica", texto: "Ao preencher o 'NR de referência' de um treinamento ou autorização, confirme aqui o número e o título corretos." },
      ] },
    ],
  },
  {
    slug: "referencias-esocial",
    titulo: "Tabela 22 do eSocial",
    modulo: "eSocial",
    categoria: "Referências",
    rota: "/referencias/esocial",
    perfis: ["Técnico de Segurança", "RH"],
    resumo: "Catálogo dos códigos de agentes nocivos (Tabela 22 do eSocial), usados no inventário do PGR e no evento S-2240.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Consulta dos códigos oficiais de agentes nocivos para classificar os riscos do inventário e preparar o S-2240 (condições ambientais do trabalho)." },
        { tipo: "atencao", texto: "Agentes ergonômicos, de acidente e psicossociais não têm código de agente nocivo para PPP (caem em 'ausência'/'outros'), mas ainda compõem o inventário do PGR." },
      ] },
    ],
  },
]
