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
    resumo: "Ajustes da organização: dados da empresa-dona, sua conta (senha), aparência (tema) e o template padrão de certificado.",
    secoes: [
      { titulo: "Para que serve", blocos: [
        { tipo: "paragrafo", texto: "Centraliza as preferências: editar a empresa-dona, trocar sua senha, escolher o tema e padronizar o texto dos certificados de treinamento." },
        { tipo: "campos", itens: [
          { campo: "Empresa", descricao: "Dados/logo da empresa dona (admin)." },
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
]
