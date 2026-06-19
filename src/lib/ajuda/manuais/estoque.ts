import type { Manual } from "../tipos"

export const manuaisEstoque: Manual[] = [
  {
    slug: "estoque-epis",
    titulo: "Estoque de EPIs",
    modulo: "Estoque",
    categoria: "Operação",
    rota: "/epis/estoque",
    perfis: ["Administrador", "Técnico de Segurança", "Engenheiro de Segurança"],
    resumo:
      "Controle completo do estoque de EPIs: saldo e custo médio por local, compras (entrada), entrega que dá baixa automática, transferências, validade (FEFO) e inventário — com curva ABC, ponto de pedido e valorização.",
    secoes: [
      {
        titulo: "Como funciona",
        blocos: [
          { tipo: "paragrafo", texto: "O estoque é controlado por LOCAL: um almoxarifado central e/ou um local por obra. Cada EPI tem saldo e custo médio ponderado em cada local. Tudo é interligado — comprar dá entrada, entregar ao colaborador dá baixa, e cada movimento fica registrado no Kardex." },
          { tipo: "campos", itens: [
            { campo: "Local", descricao: "Onde o EPI fica guardado: 'central' (1 por empresa) ou 'obra' (vinculado a uma obra)." },
            { campo: "Custo médio ponderado", descricao: "Recalculado a cada compra; é o custo usado nas saídas e na valorização." },
            { campo: "Lote / validade (FEFO)", descricao: "Validade do produto (diferente do CA). O consumo sai primeiro do lote que vence antes (FEFO)." },
          ] },
        ],
      },
      {
        titulo: "Passo a passo",
        blocos: [
          { tipo: "passos", itens: [
            "Em Estoque de EPIs, abra 'Locais' e crie o almoxarifado central (e, se quiser, um local por obra).",
            "Em 'Compras', registre a compra (fornecedor, nota fiscal, itens com quantidade, custo e validade) e clique em 'Confirmar' — isso dá ENTRADA no estoque.",
            "Ao entregar um EPI ao colaborador (em EPIs › Entregas), o sistema dá BAIXA automática no local da obra dele (ou no central).",
            "Use 'Transferências' para mover saldo entre locais e 'Inventário' para contar e ajustar divergências.",
            "Defina mín/máx, estoque de segurança e lead time em 'Parâmetros' para habilitar os alertas.",
          ] },
          { tipo: "dica", texto: "O fornecedor da compra é uma empresa cadastrada com o papel 'Fornecedor' (em Empresas)." },
        ],
      },
      {
        titulo: "Controles e relatórios",
        blocos: [
          { tipo: "campos", itens: [
            { campo: "Curva ABC", descricao: "Classifica os EPIs por valor consumido (A = poucos itens que concentram o gasto)." },
            { campo: "Ponto de pedido", descricao: "Consumo médio diário × lead time + estoque de segurança. Abaixo disso, alerta de ruptura." },
            { campo: "Giro e cobertura", descricao: "Quantas vezes o estoque gira e por quantos dias o saldo cobre o consumo." },
            { campo: "Validade (FEFO)", descricao: "Lotes próximos do vencimento aparecem com alerta para priorizar o uso." },
            { campo: "Valorização", descricao: "Valor total do estoque (saldo × custo médio) por local e no total." },
          ] },
        ],
      },
      {
        titulo: "Erros comuns e dúvidas",
        blocos: [
          { tipo: "atencao", texto: "O estoque não fica negativo: uma entrega ou saída sem saldo suficiente no local é bloqueada. Registre a compra (entrada) antes." },
          { tipo: "faq", itens: [
            { p: "De onde vem a entrada de estoque?", r: "Da confirmação de uma Compra (fornecedor + nota fiscal + custo). Ajustes de inventário também podem dar entrada." },
            { p: "O que acontece no estoque quando eu entrego um EPI?", r: "Gera uma saída automática que debita o saldo do local da obra do colaborador (ou do almoxarifado central) e registra o custo." },
            { p: "Qual método de custo é usado?", r: "Custo médio ponderado: a cada compra o custo médio do item é recalculado." },
            { p: "Como devolver um EPI ao estoque?", r: "Na entrega, registre a devolução — ela credita o saldo de volta no local." },
            { p: "Não tenho saldo inicial. Como começo?", r: "Crie os locais e faça um Inventário inicial (contagem) por local, ou registre as compras. Não há lançamento retroativo automático." },
          ] },
        ],
      },
    ],
  },
]
