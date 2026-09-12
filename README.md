# Replica Studio (nome provisório)

Gerador de posts para redes sociais da Réplica — v1: uso pessoal, um workspace, sem integrações externas.

Veja [`docs/PRD.md`](docs/PRD.md) para escopo, não-objetivos, modelo de dados e decisões técnicas.

## Rodando localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Provisionar Postgres e R2 (contas externas — só você tem acesso)

- **Postgres:** criar um serviço de banco no [Railway](https://railway.app). Copiar a `DATABASE_URL` gerada.
- **Cloudflare R2:** criar um bucket em [dash.cloudflare.com](https://dash.cloudflare.com) → R2. Gerar um token de API (Account ID, Access Key ID, Secret Access Key) e ativar acesso público ao bucket (ou domínio customizado) pra obter a `R2_PUBLIC_URL`.

Copiar `.env.example` pra `.env` e preencher com esses valores, mais uma senha (`APP_PASSWORD`) e um segredo aleatório (`SESSION_SECRET`).

```bash
cp .env.example .env
```

### 3. Rodar migrações e semear o brand kit da Réplica

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Abrir `http://localhost:3000` — vai pedir a senha configurada em `APP_PASSWORD`.

## Testes

```bash
npm test
```

Cobre a lógica pura de domínio (`src/lib/domain/`) e autenticação (`src/lib/auth/`). Não cobre a renderização Satori em si (isso exige fontes reais em disco e é mais lento) — pra verificar isso, rodar:

```bash
npx tsx scripts/smoke-test-render.ts
```

Gera `scripts/saida-foto.png` e `scripts/saida-card.png` com dados de exemplo, pra inspeção visual manual.

## Deploy (Railway)

1. Criar um novo serviço no Railway a partir deste repositório.
2. Adicionar um serviço de Postgres no mesmo projeto (Railway conecta a `DATABASE_URL` automaticamente).
3. Configurar as variáveis de ambiente do R2 e do gate de login (mesmas do `.env`).
4. Rodar `npm run db:migrate` e `npm run db:seed` uma vez (via Railway CLI ou shell do serviço) antes do primeiro deploy útil.

## Estrutura

```
src/lib/domain/     lógica de negócio pura (testada, sem I/O)
src/lib/render/     templates Satori + fontes + orquestração de renderização
src/lib/db/         Prisma client + repositórios (isolam o resto do app do ORM)
src/lib/storage/    cliente R2
src/lib/auth/       sessão via cookie assinado (Web Crypto — funciona em Edge e Node)
src/app/            páginas e rotas de API do Next.js
prisma/             schema e seed do banco
scripts/            ferramentas de verificação manual (não fazem parte do app em produção)
```
