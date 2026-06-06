# Backup & restauração do banco

Backup **self-managed**: dump diário do banco de produção, **criptografado
(AES-256)** e guardado como **artifact privado** do GitHub Actions. Roda na
nuvem (não depende do notebook ligado). Workflow: `.github/workflows/db-backup.yml`.

> ⚠️ Os dados são sensíveis (LGPD). O dump é **sempre criptografado** antes de
> sair do runner — o artifact guarda só o `.gpg` (cifrado). Sem a passphrase,
> ninguém (nem o GitHub) abre o backup.

## Ativar (uma vez)
1. **`BACKUP_DB_URL`** (conexão de prod, modo Session/porta 5432) — secret do repo.
   Decida conscientemente: isso coloca a credencial de prod no GitHub Actions
   (criptografada). Defina em *Settings → Secrets and variables → Actions*, ou:
   ```bash
   gh secret set BACKUP_DB_URL --repo <owner>/<repo>   # cola a URL e Enter
   ```
2. **`BACKUP_PASSPHRASE`** — a **chave** dos backups. **Defina você mesmo** (não
   compartilhe) e **guarde no gerenciador de senhas**. Sem ela o backup é
   irrecuperável:
   ```bash
   gh secret set BACKUP_PASSPHRASE --repo <owner>/<repo>
   ```
3. Rode manualmente uma vez para validar: *Actions → DB backup (encrypted) → Run workflow*.

## Restaurar
1. Baixe o artifact `db-backup-<stamp>` (aba Actions do run desejado) → `backup-<stamp>.dump.gpg`.
2. Decifre:
   ```bash
   gpg --batch --decrypt --passphrase 'SUA_PASSPHRASE' \
     -o backup.dump backup-<stamp>.dump.gpg
   ```
3. Restaure num banco (ex.: um projeto novo ou local):
   ```bash
   pg_restore --clean --if-exists --no-owner \
     -d "postgresql://...:5432/postgres" backup.dump
   # (teste a restauração periodicamente — backup que nunca foi restaurado não é backup)
   ```

## Limitações e evolução
- **Retenção: 90 dias** (máximo do artifact no plano padrão). Para retenção
  maior / cópia fora do GitHub, trocar o passo de upload por envio a um
  armazenamento que você controle (Backblaze B2 / S3 / Drive) — o dump já sai
  criptografado, é só mudar o destino.
- **Teste de restauração**: agende restaurar um backup num banco descartável de
  tempos em tempos. Backup não testado não conta.
