import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  const user = await prisma.user.upsert({
    where: { email: 'rafael@attostudio.com.br' },
    update: {},
    create: {
      email: 'rafael@attostudio.com.br',
      nome: 'Rafael Mognon',
    },
  });

  console.log('✅ Usuário de teste criado:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
