import type { Manual } from "../tipos"

export const manuaisAdministracao: Manual[] = [
  {
    slug: "usuarios",
    titulo: "Usuários e Perfis",
    modulo: "Usuários",
    categoria: "Administração",
    rota: "/usuarios",
    perfis: ["Administrador"],
    resumo: "Gestão de acessos: cria o login (e-mail/senha) e vincula o usuário a um perfil de acesso e a uma empresa. Restrito a administradores.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Define quem acessa o sistema e o que pode fazer. Cada usuário tem um perfil (admin, técnico de segurança, RH, gestor, etc.) e pertence a uma empresa (que isola os dados via RLS)." },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Em Usuários → 'Novo usuário'.",
          "Informe o e-mail, escolha o perfil e a empresa.",
          "O sistema cria o login e gera uma senha inicial segura (anote e repasse com segurança).",
          "O usuário pode trocar a senha em Configurações → Minha conta, ou via 'Esqueci minha senha'.",
        ] },
      ] },
      { titulo: "Perfis (resumo)", blocos: [
        { tipo: "campos", itens: [
          { campo: "admin", descricao: "Acesso total, incluindo usuários e configurações." },
          { campo: "tec_seguranca / engenheiro_seg", descricao: "Operação de SST (documentos, PGR, inspeções, etc.)." },
          { campo: "rh_administrativo", descricao: "Cadastros e exames." },
          { campo: "gestor_diretoria", descricao: "Leitura de relatórios e indicadores." },
        ] },
      ] },
      { titulo: "Atenção", blocos: [
        { tipo: "atencao", texto: "Conceda o menor privilégio necessário. Apenas administradores devem ter o perfil 'admin'." },
      ] },
    ],
  },
  {
    slug: "jobs",
    titulo: "Fila de Jobs",
    modulo: "Jobs",
    categoria: "Administração",
    rota: "/jobs",
    perfis: ["Administrador", "Técnico de Segurança"],
    resumo: "Acompanha o processamento assíncrono (ex.: geração de documentos em lote). Mostra progresso, status e o link de download do resultado.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Quando você envia uma geração grande para a fila (ex.: documentos em lote), ela roda em segundo plano. Aqui você acompanha o progresso e baixa o ZIP quando concluir." },
        { tipo: "campos", itens: [
          { campo: "queued / processing", descricao: "Aguardando ou em processamento." },
          { campo: "completed", descricao: "Pronto — botão de download disponível." },
          { campo: "failed", descricao: "Falhou após as tentativas — verifique e reenvie." },
        ] },
      ] },
      { titulo: "Dica", blocos: [
        { tipo: "dica", texto: "Use a fila para lotes grandes (>10 itens) — evita travar a tela e o link de download fica disponível por tempo limitado." },
      ] },
    ],
  },
  {
    slug: "auditoria",
    titulo: "Auditoria (Log)",
    modulo: "Auditoria",
    categoria: "Administração",
    rota: "/auditoria",
    perfis: ["Administrador"],
    resumo: "Trilha de auditoria das ações no sistema (LGPD Art. 37) — quem fez o quê e quando. Apenas leitura.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Registra automaticamente as alterações relevantes para fins de conformidade e investigação. Útil para responder 'quem alterou este registro?'." },
        { tipo: "dica", texto: "A trilha é gerada por gatilhos no banco — não precisa de ação manual; consulte quando houver dúvida sobre uma alteração." },
      ] },
    ],
  },
  {
    slug: "configuracoes",
    titulo: "Configurações",
    modulo: "Configurações",
    categoria: "Administração",
    rota: "/configuracoes",
    perfis: ["Administrador"],
    resumo: "Ajustes da conta: sua senha, aparência (tema) e o template padrão de certificado. A marca da Organização fica em Minha Organização.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Centraliza as preferências: trocar sua senha, escolher o tema e padronizar o texto dos certificados de treinamento. A identidade da Organização (nome/logo) é configurada em Minha Organização." },
        { tipo: "campos", itens: [
          { campo: "Minha conta", descricao: "Troca da sua própria senha." },
          { campo: "Aparência", descricao: "Tema claro/escuro/sistema (salvo no navegador)." },
          { campo: "Certificado", descricao: "Template padrão do texto do certificado, com variáveis {{...}}." },
        ] },
      ] },
      { titulo: "Padrões de escrita — template de certificado", blocos: [
        { tipo: "dica", texto: "Use as variáveis disponíveis ({{aluno_nome}}, {{curso_titulo}}, {{carga_horaria}}, etc.). Deixe em branco para usar o texto padrão do sistema. Um treinamento com texto próprio sempre tem precedência sobre o template da empresa." },
      ] },
    ],
  },
  {
    slug: "organizacao",
    titulo: "Minha Organização",
    modulo: "Organização",
    categoria: "Administração",
    rota: "/organizacao",
    perfis: ["Administrador"],
    resumo: "Identidade da Organização (a conta/marca): nome, nome fantasia e logo, além do modelo padrão de certificado. Aparece na interface e nos documentos emitidos.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "A Organização é a sua conta no sistema (a marca). Aqui você define o nome, o nome fantasia e o logo que aparecem na interface e no cabeçalho dos documentos, e ajusta o modelo padrão de certificado. Não confunda com o cadastro de Empresas: as empresas próprias e parceiros vivem em Empresas; aqui é só a identidade da conta." },
        { tipo: "campos", itens: [
          { campo: "Marca", descricao: "Nome, nome fantasia e logo da Organização — usados na identidade do sistema e nos documentos." },
          { campo: "Certificado padrão", descricao: "Modelo de texto do certificado de treinamento, com variáveis {{...}}." },
        ] },
      ] },
      { titulo: "Passo a passo", blocos: [
        { tipo: "passos", itens: [
          "Acesse Minha Organização.",
          "Na aba Marca, ajuste o nome e o nome fantasia e envie o logo (PNG/JPG/WebP).",
          "Salve a marca.",
          "Na aba Certificado padrão, ajuste o modelo de texto do certificado, se desejar.",
        ] },
      ] },
    ],
  },
  {
    slug: "controle-treinamento",
    titulo: "Controle de treinamento e trava",
    modulo: "Controle de treino",
    categoria: "Administração",
    rota: "/admin/treinamento",
    perfis: ["Administrador"],
    resumo: "Painel (admin) para acompanhar a conclusão da trilha por usuário e configurar a trava: o usuário só usa um módulo após concluir o treinamento dele (com quiz). Inclui carência e isenções.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Garante que cada pessoa aprenda o módulo antes de usá-lo. Quando a trava está ativa, ao tentar abrir um módulo sem ter concluído o treinamento dele, o usuário é levado ao treinamento; ao passar no quiz, volta automaticamente para onde estava." },
        { tipo: "campos", itens: [
          { campo: "Status (trava)", descricao: "Ativa = bloqueia quem não concluiu; Inativa = ninguém é bloqueado.", obrigatorio: true },
          { campo: "Carência (dias)", descricao: "Após ativar, ninguém é bloqueado durante esse período — tempo para todos se treinarem." },
          { campo: "Isenções", descricao: "Usuários que não são bloqueados (por módulo ou em todos), com motivo." },
        ] },
      ] },
      { titulo: "Como ativar com segurança", blocos: [
        { tipo: "passos", itens: [
          "Confira no painel quem ainda tem módulos pendentes.",
          "Defina uma carência (ex.: 7 a 15 dias) para a equipe concluir sem ser bloqueada.",
          "Avise a equipe para concluir a trilha em /treinamento.",
          "Mude o Status para 'Ativa' e salve — a carência começa a contar nesse momento.",
          "Acompanhe o avanço; isente pontualmente quem já domina um módulo.",
        ] },
      ] },
      { titulo: "Exemplo de uso", blocos: [
        { tipo: "exemplo", titulo: "Rollout dos módulos novos (ISO)", texto: "Você ativou a trava com 10 dias de carência numa segunda-feira. Durante 10 dias, todos acessam normalmente, mas veem o aviso de treinamento pendente. No 11º dia, quem não concluiu o módulo 'Governança do SGSST' é levado ao treinamento ao tentar abrir /politica ou /auditorias; após passar no quiz, é devolvido à tela que queria usar. O engenheiro sênior, que ajudou a desenhar os módulos, você isenta de 'Governança do SGSST' com motivo 'co-autor do processo'." },
        { tipo: "cenario", situacao: "Um auditor externo precisa navegar o sistema rapidamente.", orientacao: "Crie o usuário e adicione uma isenção de 'Todos os módulos' com motivo 'auditoria externa — acesso temporário'. Remova a isenção ao fim do trabalho." },
        { tipo: "atencao", texto: "Administradores nunca são bloqueados pela trava (para sempre conseguirem configurá-la). A trilha de treinamento (/treinamento) e a Ajuda nunca são travadas." },
        { tipo: "faq", itens: [
          { p: "O que conta como 'concluído'?", r: "Ler o módulo e acertar o quiz curto (a validação é no servidor). Só então o módulo correspondente é liberado." },
          { p: "A trava vale por empresa?", r: "Não — o treinamento é do sistema (não dos dados de uma empresa). A configuração é global e o progresso é por usuário." },
          { p: "Posso desligar a qualquer momento?", r: "Sim. Mudar o Status para 'Inativa' libera todos imediatamente. Ao reativar, a carência recomeça." },
        ] },
      ] },
    ],
  },
]
