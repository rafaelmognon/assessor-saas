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

## 🔐 Segurança — gestão da chave AES

Conteúdo sensível (mensagens do WhatsApp) é **criptografado com AES-256-GCM** antes
de ser persistido. A chave vive em `FIELD_ENCRYPTION_KEY` (`.env`).

### ⚠️ Proteção da chave

**Dev:** chave em `.env` local (permissão `600`, nunca commitar).

**Produção:** chave deve viver FORA do servidor de aplicação. Opções:
- [Doppler](https://www.doppler.com) (grátis até 5 usuários, super simples)
- [HashiCorp Vault](https://www.vaultproject.io) (open-source, mais robusto)
- AWS Secrets Manager / GCP Secret Manager

Se alguém ganhar SSH no seu servidor, a chave não pode estar lá em `.env` — senão
quebra todo o propósito.

### Backup offline da chave (MVP)

Enquanto não usa secrets manager, **anote a chave num lugar físico seguro** (papel
num cofre, 1Password offline). Se o servidor pifar e você recriar sem a chave,
perde TODO o histórico criptografado (irreversível).

### Gerar nova chave

```bash
openssl rand -base64 32
```

Cole em `FIELD_ENCRYPTION_KEY=...` no `.env`.

### Rotação de chave (futuro)

O código usa prefixo `v1:` no ciphertext. Pra trocar chave, implementar `v2:` que
tenta descriptografar com a nova primeiro, cai pra antiga. Script de migração
re-criptografa tudo.

## Licença

Proprietária — todos os direitos reservados.
