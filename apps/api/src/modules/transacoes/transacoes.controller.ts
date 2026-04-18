import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('me/transacoes')
export class TransacoesController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista as transações do usuário logado.
   * Filtra por userId no service E o RLS no Postgres garante isolamento.
   */
  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit = '50',
    @Query('tipo') tipo?: 'ENTRADA' | 'SAIDA',
  ) {
    return this.prisma.transacao.findMany({
      where: {
        userId: user.userId,           // 1ª camada: filtro explícito
        deletedAt: null,
        ...(tipo ? { tipo } : {}),
      },
      include: {
        categoria: { select: { nome: true, icone: true, cor: true } },
        cartao:    { select: { apelido: true, ultimos4: true, cor: true } },
      },
      orderBy: { data: 'desc' },
      take: Math.min(parseInt(limit, 10) || 50, 200),
    });
    // 2ª camada: RLS bloqueia se algum query escapar do filtro
    // (graças ao TenantInterceptor que setou app.current_user_id)
  }

  /**
   * Resumo do mês: totais por tipo + por categoria.
   */
  @Get('resumo')
  async resumo(@CurrentUser() user: RequestUser) {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [entradas, saidas, porCategoria] = await Promise.all([
      this.prisma.transacao.aggregate({
        where: { userId: user.userId, tipo: 'ENTRADA', data: { gte: inicioMes }, deletedAt: null },
        _sum: { valor: true },
        _count: true,
      }),
      this.prisma.transacao.aggregate({
        where: { userId: user.userId, tipo: 'SAIDA', data: { gte: inicioMes }, deletedAt: null },
        _sum: { valor: true },
        _count: true,
      }),
      this.prisma.transacao.groupBy({
        by: ['categoriaId'],
        where: { userId: user.userId, tipo: 'SAIDA', data: { gte: inicioMes }, deletedAt: null },
        _sum: { valor: true },
        _count: true,
      }),
    ]);

    const categoriasMap = await this.prisma.categoria.findMany({
      where: { id: { in: porCategoria.map((p) => p.categoriaId).filter(Boolean) as string[] } },
      select: { id: true, nome: true, icone: true, cor: true },
    });

    return {
      mesAtual: inicioMes.toISOString(),
      receitas: { total: entradas._sum.valor ?? 0, transacoes: entradas._count },
      despesas: { total: saidas._sum.valor ?? 0, transacoes: saidas._count },
      saldo: Number(entradas._sum.valor ?? 0) - Number(saidas._sum.valor ?? 0),
      porCategoria: porCategoria.map((p) => ({
        categoria: categoriasMap.find((c) => c.id === p.categoriaId) ?? null,
        total: p._sum.valor ?? 0,
        transacoes: p._count,
      })),
    };
  }
}
