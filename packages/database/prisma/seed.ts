/**
 * Seed — Sprint 1.2
 * Cria 1 usuário + categorias + cartões + transações + compromissos + notas
 * Espelha os dados do protótipo HTML pra ter algo realista no dashboard.
 */

import { PrismaClient, CategoriaTipo, CartaoTipo, CartaoBandeira, TransacaoTipo, FormaPagamento, OrigemTransacao, NotaTag, NotaOrigem, CompromissoOrigem, Plan, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding banco multi-tenant...');

  // -- 1. USUÁRIO --
  const user = await prisma.user.upsert({
    where: { email: 'rafael@attostudio.com.br' },
    update: {},
    create: {
      email: 'rafael@attostudio.com.br',
      nome: 'Rafael Mognon',
      whatsapp: '+5554999999999',
      plano: Plan.PRO,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  });
  console.log(`✅ Usuário: ${user.email} (id ${user.id})`);

  // Limpa dados antigos pra não duplicar em re-runs
  await prisma.transacao.deleteMany({ where: { userId: user.id } });
  await prisma.compromisso.deleteMany({ where: { userId: user.id } });
  await prisma.nota.deleteMany({ where: { userId: user.id } });
  await prisma.cartao.deleteMany({ where: { userId: user.id } });
  await prisma.categoria.deleteMany({ where: { userId: user.id } });

  // -- 2. CATEGORIAS --
  const cats: Record<string, string> = {};
  const categoriasData = [
    { nome: 'Mercado',     icone: '🛒', cor: 'indigo',  tipo: CategoriaTipo.SAIDA,   metaMensal: 2000 },
    { nome: 'Restaurante', icone: '🍔', cor: 'purple',  tipo: CategoriaTipo.SAIDA,   metaMensal: 800 },
    { nome: 'Transporte',  icone: '🚗', cor: 'pink',    tipo: CategoriaTipo.SAIDA,   metaMensal: 500 },
    { nome: 'Lazer',       icone: '🎬', cor: 'orange',  tipo: CategoriaTipo.SAIDA,   metaMensal: 600 },
    { nome: 'Saúde',       icone: '💊', cor: 'teal',    tipo: CategoriaTipo.SAIDA,   metaMensal: null },
    { nome: 'Casa',        icone: '🏠', cor: 'amber',   tipo: CategoriaTipo.SAIDA,   metaMensal: 1500 },
    { nome: 'Trabalho',    icone: '💼', cor: 'slate',   tipo: CategoriaTipo.SAIDA,   metaMensal: null },
    { nome: 'Salário',     icone: '💰', cor: 'emerald', tipo: CategoriaTipo.ENTRADA, metaMensal: null },
    { nome: 'Freelance',   icone: '📈', cor: 'cyan',    tipo: CategoriaTipo.ENTRADA, metaMensal: null },
  ];
  for (const c of categoriasData) {
    const cat = await prisma.categoria.create({ data: { ...c, userId: user.id } });
    cats[c.nome] = cat.id;
  }
  console.log(`✅ ${categoriasData.length} categorias`);

  // -- 3. CARTÕES --
  const nubank = await prisma.cartao.create({
    data: {
      userId: user.id,
      apelido: 'Nubank',
      tipo: CartaoTipo.CREDITO,
      bandeira: CartaoBandeira.MASTERCARD,
      ultimos4: '4532',
      cor: 'violet-purple',
      limite: 5000,
      diaFecha: 28,
      diaVence: 5,
    },
  });
  const itau = await prisma.cartao.create({
    data: {
      userId: user.id,
      apelido: 'Itaú Platinum',
      tipo: CartaoTipo.CREDITO,
      bandeira: CartaoBandeira.VISA,
      ultimos4: '8821',
      cor: 'orange-amber',
      limite: 8000,
      diaFecha: 3,
      diaVence: 10,
    },
  });
  console.log('✅ 2 cartões (Nubank, Itaú)');

  // -- 4. TRANSAÇÕES --
  const hoje = new Date();
  const ontem = new Date(Date.now() - 86400e3);
  const dia2 = new Date(Date.now() - 2 * 86400e3);
  const dia3 = new Date(Date.now() - 3 * 86400e3);
  const dia5 = new Date(Date.now() - 5 * 86400e3);

  const transacoesData = [
    // Compra parcelada
    { descricao: 'MacBook Air M3', valor: 750, tipo: TransacaoTipo.SAIDA, formaPagamento: FormaPagamento.CREDITO, origem: OrigemTransacao.MANUAL, data: dia2, categoriaId: cats['Trabalho'], cartaoId: itau.id, parcelaAtual: 3, parcelasTotal: 12, valorTotal: 9000 },
    // Hoje
    { descricao: 'Mercado Extra', valor: 127.45, tipo: TransacaoTipo.SAIDA, formaPagamento: FormaPagamento.CREDITO, origem: OrigemTransacao.WHATSAPP_AUDIO, data: hoje, categoriaId: cats['Mercado'], cartaoId: nubank.id },
    { descricao: 'Pagamento cliente Atto', valor: 3500, tipo: TransacaoTipo.ENTRADA, formaPagamento: FormaPagamento.PIX, origem: OrigemTransacao.WHATSAPP_TEXTO, data: hoje, categoriaId: cats['Freelance'] },
    // Ontem
    { descricao: 'iFood — almoço', valor: 42.90, tipo: TransacaoTipo.SAIDA, formaPagamento: FormaPagamento.PIX, origem: OrigemTransacao.WHATSAPP_AUDIO, data: ontem, categoriaId: cats['Restaurante'] },
    { descricao: 'Uber — aeroporto', valor: 38.20, tipo: TransacaoTipo.SAIDA, formaPagamento: FormaPagamento.CREDITO, origem: OrigemTransacao.WHATSAPP_TEXTO, data: ontem, categoriaId: cats['Transporte'], cartaoId: nubank.id },
    // Dias anteriores
    { descricao: 'Starbucks', valor: 24, tipo: TransacaoTipo.SAIDA, formaPagamento: FormaPagamento.DEBITO, origem: OrigemTransacao.WHATSAPP_AUDIO, data: dia3, categoriaId: cats['Lazer'] },
    { descricao: 'Posto Shell', valor: 220, tipo: TransacaoTipo.SAIDA, formaPagamento: FormaPagamento.DEBITO, origem: OrigemTransacao.WHATSAPP_TEXTO, data: dia3, categoriaId: cats['Transporte'] },
    { descricao: 'Netflix', valor: 55.90, tipo: TransacaoTipo.SAIDA, formaPagamento: FormaPagamento.CREDITO, origem: OrigemTransacao.RECORRENTE, data: dia5, categoriaId: cats['Lazer'], cartaoId: nubank.id },
    { descricao: 'Drogasil', valor: 87.30, tipo: TransacaoTipo.SAIDA, formaPagamento: FormaPagamento.DINHEIRO, origem: OrigemTransacao.WHATSAPP_AUDIO, data: dia5, categoriaId: cats['Saúde'] },
    // Salário (mês anterior)
    { descricao: 'Salário Atto Studio', valor: 8000, tipo: TransacaoTipo.ENTRADA, formaPagamento: FormaPagamento.TRANSFERENCIA, origem: OrigemTransacao.MANUAL, data: new Date(Date.now() - 7 * 86400e3), categoriaId: cats['Salário'] },
  ];

  for (const t of transacoesData) {
    await prisma.transacao.create({ data: { ...t, userId: user.id } });
  }
  console.log(`✅ ${transacoesData.length} transações`);

  // -- 5. COMPROMISSOS --
  const amanha = new Date(Date.now() + 86400e3);
  amanha.setHours(15, 0, 0, 0);
  const segunda = new Date(Date.now() + 2 * 86400e3);
  segunda.setHours(14, 0, 0, 0);
  const terca = new Date(Date.now() + 3 * 86400e3);
  terca.setHours(10, 0, 0, 0);

  await prisma.compromisso.createMany({
    data: [
      { userId: user.id, titulo: 'Reunião cliente Atto',  inicio: amanha,  fim: new Date(amanha.getTime() + 60 * 60e3),     local: 'Google Meet',     cor: 'indigo',  origem: CompromissoOrigem.WHATSAPP_AUDIO },
      { userId: user.id, titulo: 'Consulta dentista',     inicio: segunda, fim: new Date(segunda.getTime() + 60 * 60e3),    local: 'Dr. Pereira',     cor: 'purple',  origem: CompromissoOrigem.WHATSAPP_TEXTO },
      { userId: user.id, titulo: 'Call planejamento Q2',  inicio: terca,   fim: new Date(terca.getTime() + 60 * 60e3),      local: 'Zoom',            cor: 'orange',  origem: CompromissoOrigem.MANUAL },
    ],
  });
  console.log('✅ 3 compromissos');

  // -- 6. NOTAS & INSIGHTS --
  await prisma.nota.createMany({
    data: [
      { userId: user.id, titulo: 'Hero do novo site da Atto', conteudo: 'Testar abrir com vídeo em loop + headline forte. Benchmarks: Linear, Vercel, Stripe.', tag: NotaTag.IDEIA, fixada: true, origem: NotaOrigem.MANUAL },
      { userId: user.id, conteudo: 'Clientes marcam reunião com mais facilidade nas terças à tarde — padronizar esse horário como preferencial.', tag: NotaTag.INSIGHT, fixada: true, origem: NotaOrigem.WHATSAPP_AUDIO },
      { userId: user.id, titulo: 'Comprar presente da Ana', conteudo: 'Aniversário dia 28. Ela comentou do livro "A Biblioteca da Meia-Noite".', tag: NotaTag.LEMBRETE, origem: NotaOrigem.WHATSAPP_TEXTO },
      { userId: user.id, titulo: 'Atomic Habits', conteudo: 'Livro recomendado pelo Pedro. Aplicar método "2 minutos" nos hábitos que quero criar.', tag: NotaTag.REFERENCIA, origem: NotaOrigem.WHATSAPP_TEXTO },
      { userId: user.id, titulo: 'Meta de Q2', conteudo: 'Fechar 3 clientes novos até junho. Focar em lojas Shopify que já têm tráfego mas baixa conversão.', tag: NotaTag.META, origem: NotaOrigem.MANUAL },
    ],
  });
  console.log('✅ 5 notas');

  console.log('\n🎉 Seed completo!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
