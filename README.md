# Assessor SaaS

Assistente pessoal via WhatsApp — finanças, compromissos, notas e insights.

## Stack

- **Monorepo:** npm workspaces
- **Backend:** NestJS + TypeScript + Prisma
- **Frontend:** Next.js 15 + Tailwind + shadcn/ui
- **Banco:** PostgreSQL 16 com Row-Level Security
- **Filas:** Redis + BullMQ
- **WhatsApp:** Evolution API (inicial) — pluggable via adapter
- **IA:** Claude (classificação/extração) + Whisper (transcrição áudio)

## Estrutura

```
assessor-saas/
├── apps/
│   ├── api/              # NestJS — REST + webhooks + workers
│   └── web/              # Next.js — dashboard + landing
├── packages/
│   └── database/         # Prisma schema + migrations + seed
├── docker-compose.yml    # Postgres + Redis + Evolution API (dev)
├── .env.example
└── package.json          # Root com workspaces
```

## Pré-requisitos

- Node.js >= 20
- npm >= 10
- Docker + Docker Compose

## Setup local

```bash
# 1. Clonar e instalar
git clone <repo>
cd assessor-saas
npm install

# 2. Configurar env
cp .env.example .env
# Editar .env com seus valores

# 3. Subir infra (Postgres, Redis)
npm run docker:up

# 4. Rodar migrations e seed
npm run db:migrate
npm run db:seed

# 5. Iniciar dev (API + Web em paralelo)
npm run dev
```

Acessos:
- Web: http://localhost:3000
- API: http://localhost:3333

## Scripts úteis

```bash
npm run dev              # API + Web em paralelo
npm run dev:api          # só API
npm run dev:web          # só Web
npm run build            # build de tudo
npm run db:studio        # Prisma Studio (GUI do banco)
npm run docker:logs      # ver logs dos containers
```

## Roadmap

- **Fase 1** (atual): Fundação técnica — multi-tenant, CRUD, WhatsApp, deploy
- **Fase 2**: Landing page + signup + onboarding + trial
- **Fase 3**: Billing (Stripe + Asaas)
- **Fase 4**: Admin panel + suporte
- **Fase 5**: Legal (LGPD) + lançamento público

Ver detalhes em `docs/roadmap.md` (em breve).

## Licença

Proprietária — todos os direitos reservados.
