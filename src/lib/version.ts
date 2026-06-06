// Versão exibida na UI — fonte de verdade é o `package.json`, exposto em build
// via `NEXT_PUBLIC_APP_VERSION` (ver next.config.mjs). O release oficial é feito
// por `npm run release:<patch|minor|major>`, que bumpa o package.json + CHANGELOG.
// Em dev (sem a env), cai para "dev".
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"
