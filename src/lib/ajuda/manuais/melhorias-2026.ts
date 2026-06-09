import type { Manual } from "../tipos"

/**
 * Manuais das funcionalidades adicionadas no programa de melhorias (2026).
 * Catálogos de apoio, Obras como fonte de verdade, EPIs NR-06, Treinamentos
 * em lote, templates pré-configurados, Painel GRO e aderência ISO 45001.
 */
export const manuaisMelhorias2026: Manual[] = [
  {
    slug: "medicos",
    titulo: "Médicos",
    modulo: "Médicos",
    categoria: "Cadastros",
    rota: "/medicos",
    perfis: ["Administrador", "Técnico de Segurança", "RH"],
    resumo: "Cadastro dos médicos responsáveis pelos ASOs, com busca automática pelo CRM e status (ativo/inativo/suspenso). Substitui o texto livre no exame.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Centraliza os médicos do trabalho. No exame, em vez de digitar o nome solto, você seleciona o médico cadastrado — o nome e o CRM ficam gravados como histórico do ASO (snapshot)." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Acesse Médicos → Cadastrar médico.",
          "Digite o número do CRM e a UF e clique em 'Buscar dados do CRM'.",
          "Confira o nome (preenchido em Title Case), a especialidade e a situação.",
          "Defina o status (ativo/inativo/suspenso) e salve.",
        ] },
        { tipo: "dica", texto: "A busca por CRM depende da chave de integração configurada. Sem ela, o cadastro manual funciona normalmente." },
      ] },
      { titulo: "Uso no exame", blocos: [
        { tipo: "paragrafo", texto: "No formulário de exame, escolha o médico no seletor 'Médico responsável (cadastro)'. O nome e CRM são copiados para os campos do ASO e podem ser ajustados manualmente." },
      ] },
    ],
  },
  {
    slug: "clinicas",
    titulo: "Clínicas",
    modulo: "Clínicas",
    categoria: "Cadastros",
    rota: "/clinicas",
    perfis: ["Administrador", "Técnico de Segurança", "RH"],
    resumo: "Cadastro de clínicas/laboratórios de medicina ocupacional, com endereço autopreenchido por CNPJ/CEP (BrasilAPI).",
    secoes: [
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Acesse Clínicas → Cadastrar clínica.",
          "Informe o CNPJ e clique em 'Buscar CNPJ' para preencher razão social e endereço.",
          "Ou informe o CEP e clique em 'Buscar CEP'.",
          "Salve. A clínica fica disponível no seletor do exame.",
        ] },
      ] },
    ],
  },
  {
    slug: "instrutores",
    titulo: "Instrutores",
    modulo: "Instrutores",
    categoria: "Cadastros",
    rota: "/instrutores",
    perfis: ["Administrador", "Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Profissionais que ministram treinamentos, com registro profissional (MTE/CREA/CREF/CRM) e formação.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Ao registrar uma realização de treinamento (individual ou em lote), você seleciona o instrutor cadastrado; o nome fica gravado no certificado." },
      ] },
    ],
  },
  {
    slug: "entidades-treinamento",
    titulo: "Entidades de treinamento",
    modulo: "Entidades",
    categoria: "Cadastros",
    rota: "/entidades-treinamento",
    perfis: ["Administrador", "Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Instituições que emitem certificados (Senai, Senac, escolas técnicas), com endereço por CNPJ (BrasilAPI).",
    secoes: [
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Acesse Entidades → Cadastrar entidade.",
          "Busque pelo CNPJ para preencher os dados.",
          "Use a entidade no registro de realizações de treinamento.",
        ] },
      ] },
    ],
  },
  {
    slug: "obras-locais",
    titulo: "Obras e locais",
    modulo: "Obras",
    categoria: "Cadastros",
    rota: "/obras",
    perfis: ["Administrador", "Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "A obra é a fonte de verdade do grupo: CNPJ, endereço, empreitada e os locais (áreas) usados em inspeções, ocorrências e documentos. O People (RH) consome essas obras.",
    secoes: [
      { titulo: "Cadastro da obra", blocos: [
        { tipo: "campos", itens: [
          { campo: "CNPJ da obra", descricao: "Busca o endereço pela Receita (CNO). Opcional." },
          { campo: "Empreitada", descricao: "Total ou parcial, conforme o registro CNO." },
          { campo: "Endereço", descricao: "Autopreenchido por CNPJ/CEP; editável." },
        ] },
      ] },
      { titulo: "Locais da obra", blocos: [
        { tipo: "paragrafo", texto: "Ao criar a obra, são gerados automaticamente os locais 'Área Interna' e 'Área Externa'. Na edição da obra, você adiciona novos locais (ex.: Subestação, Galpão 2) e pode inativá-los." },
        { tipo: "dica", texto: "Os locais ficam disponíveis para vincular em inspeções, ocorrências e documentos de campo." },
      ] },
      { titulo: "Integração com o People", blocos: [
        { tipo: "paragrafo", texto: "O SST expõe as obras por API. O People (RH) concilia seus centros de responsabilidade (tipo obra) pelo código da obra — mantenha o campo 'código interno' preenchido e único." },
      ] },
    ],
  },
  {
    slug: "epi-matriz",
    titulo: "Matriz EPI × Cargo e entrega (NR-06)",
    modulo: "EPIs",
    categoria: "Cadastros",
    rota: "/epis/matriz",
    perfis: ["Administrador", "Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Define os EPIs obrigatórios por função e reforça a entrega com assinatura + termo de ciência e o controle de devolução.",
    secoes: [
      { titulo: "Matriz EPI × Cargo", blocos: [
        { tipo: "passos", itens: [
          "Em EPIs, clique em 'Matriz EPI×Cargo'.",
          "Selecione o cargo e marque os EPIs obrigatórios.",
          "Salve. Na entrega, o sistema mostra os EPIs obrigatórios do cargo do colaborador.",
        ] },
      ] },
      { titulo: "Entrega com ciência e devolução", blocos: [
        { tipo: "atencao", texto: "A entrega só é registrada após a assinatura do colaborador e a marcação do termo de ciência (NR-6.6.1)." },
        { tipo: "paragrafo", texto: "Para registrar a devolução de um EPI, abra a entrega e clique em 'Registrar devolução', informando a data." },
      ] },
    ],
  },
  {
    slug: "treinamento-matriz-lote",
    titulo: "Treinamentos: matriz por cargo e aplicação em lote",
    modulo: "Treinamentos",
    categoria: "Operação",
    rota: "/treinamentos/matriz",
    perfis: ["Administrador", "Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Defina os treinamentos obrigatórios por função e registre a mesma realização para vários colaboradores de uma vez.",
    secoes: [
      { titulo: "Matriz por cargo", blocos: [
        { tipo: "paragrafo", texto: "Em Treinamentos → 'Matriz por cargo', selecione o cargo e marque os treinamentos exigidos. Complementa o gap analysis por NR já existente na Matriz de Treinamentos." },
      ] },
      { titulo: "Aplicar em lote", blocos: [
        { tipo: "passos", itens: [
          "Em Treinamentos realizados, clique em 'Aplicar em lote'.",
          "Escolha o treinamento, a data, instrutor/entidade e o local.",
          "Busque e marque os colaboradores (ou 'Selecionar todos').",
          "Confirme — uma realização é criada para cada um, com vencimento calculado automaticamente.",
        ] },
      ] },
    ],
  },
  {
    slug: "dds-catalogo",
    titulo: "Catálogo de DDS (temas e mediadores)",
    modulo: "DDS",
    categoria: "Operação",
    rota: "/dds-catalogo",
    perfis: ["Administrador", "Técnico de Segurança", "Encarregado de Campo"],
    resumo: "Padroniza temas e mediadores de DDS e acelera o registro com 'Selecionar todos' os participantes.",
    secoes: [
      { titulo: "Como usar", blocos: [
        { tipo: "passos", itens: [
          "Em DDS, abra 'Gerenciar catálogo' para cadastrar temas e mediadores.",
          "Ao criar um DDS, o tema sugere os itens do catálogo e o mediador pode ser selecionado (preenche nome/cargo).",
          "Use 'Selecionar todos' para adicionar todos os colaboradores de uma vez.",
        ] },
      ] },
    ],
  },
  {
    slug: "templates-sst",
    titulo: "Templates de inspeção e ocorrência",
    modulo: "Templates",
    categoria: "Operação",
    rota: "/inspecoes/templates",
    perfis: ["Administrador", "Técnico de Segurança", "Engenheiro de Segurança"],
    resumo: "Checklists de inspeção reutilizáveis e modelos pré-configurados de ocorrência (roteiro de descrição + 5 Porquês).",
    secoes: [
      { titulo: "Templates de inspeção", blocos: [
        { tipo: "paragrafo", texto: "Em Inspeções → Templates, crie/edite checklists (grupos, perguntas, NR de referência e exigência de foto em não conformidade)." },
      ] },
      { titulo: "Templates de ocorrência", blocos: [
        { tipo: "paragrafo", texto: "Em Ocorrências → Templates, edite os modelos por tipo. Ao registrar uma ocorrência, escolha um modelo que pré-preenche a descrição e o roteiro de investigação. Templates de sistema podem ser revertidos ao padrão." },
      ] },
    ],
  },
  {
    slug: "gro",
    titulo: "Painel GRO (PDCA)",
    modulo: "GRO",
    categoria: "Operação",
    rota: "/gro",
    perfis: ["Administrador", "Engenheiro de Segurança", "Gestor/Diretoria"],
    resumo: "Visão de gestão do Gerenciamento de Riscos Ocupacionais como ciclo PDCA, sobre o PGR já existente.",
    secoes: [
      { titulo: "Como ler", blocos: [
        { tipo: "campos", itens: [
          { campo: "Planejar", descricao: "Inventário de riscos e GHE do PGR." },
          { campo: "Fazer", descricao: "Plano de ação 5W1H e medidas de controle (NIOSH)." },
          { campo: "Verificar", descricao: "Inspeções, NCs e vencimentos." },
          { campo: "Agir", descricao: "Ações corretivas com verificação de eficácia." },
        ] },
        { tipo: "paragrafo", texto: "O GRO é o processo; o PGR é o documento que o materializa. O painel apenas consolida o que já está cadastrado." },
      ] },
    ],
  },
  {
    slug: "iso-45001",
    titulo: "Aderência ISO 45001",
    modulo: "ISO 45001",
    categoria: "Relatórios",
    rota: "/iso-45001",
    perfis: ["Administrador", "Engenheiro de Segurança", "Gestor/Diretoria"],
    resumo: "Mapa dos requisitos da ISO 45001 (cláusulas 4–10) às funcionalidades do sistema, com status e relatório de gaps.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Apoia a preparação para certificação: mostra onde o sistema atende, atende parcialmente, depende de processo externo, ou apresenta lacuna (gap) a tratar." },
      ] },
    ],
  },
]
