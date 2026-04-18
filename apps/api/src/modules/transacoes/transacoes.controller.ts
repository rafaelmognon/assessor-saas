import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransacaoDto } from './dto/create-transacao.dto';
import { UpdateTransacaoDto } from './dto/update-transacao.dto';

@Controller('me/transacoes')
export class TransacoesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit = '50',
    @Query('tipo') tipo?: 'ENTRADA' | 'SAIDA',
    @Query('categoriaId') categoriaId?: string,
    @Query('cartaoId') cartaoId?: string,
  ) {
    return this.prisma.transacao.findMany({
      where: {
        userId: user.userId,
        deletedAt: null,
        ...(tipo ? { tipo } : {}),
        ...(categoriaId ? { categoriaId } : {}),
        ...(cartaoId ? { cartaoId } : {}),
      },
      include: {
        categoria: { select: { nome: true, icone: true, cor: true } },
        cartao: { select: { apelido: true, ultimos4: true, cor: true } },
      },
      orderBy: { data: 'desc' },
      take: Math.min(parseInt(limit, 10) || 50, 200),
    });
  }

  @Get('resumo')
  async resumo(@CurrentUser() user: RequestUser) {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [entradas, saidas, porCategoria, porPagamento] = await Promise.all([
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
      this.prisma.transacao.groupBy({
        by: ['formaPagamento'],
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
      porPagamento: porPagamento.map((p) => ({
        forma: p.formaPagamento,
        total: p._sum.valor ?? 0,
        transacoes: p._count,
      })),
    };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const t = await this.prisma.transacao.findFirst({
      where: { id, userId: user.userId, deletedAt: null },
      include: {
        categoria: { select: { nome: true, icone: true, cor: true } },
        cartao: { select: { apelido: true, ultimos4: true, cor: true } },
      },
    });
    if (!t) throw new NotFoundException('Transação não encontrada');
    return t;
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateTransacaoDto) {
    if (dto.categoriaId) await this.assertOwnership('categoria', user.userId, dto.categoriaId);
    if (dto.cartaoId) await this.assertOwnership('cartao', user.userId, dto.cartaoId);

    if ((dto.parcelaAtual && !dto.parcelasTotal) || (!dto.parcelaAtual && dto.parcelasTotal)) {
      throw new BadRequestException('Parcelamento exige parcelaAtual + parcelasTotal');
    }

    return this.prisma.transacao.create({
      data: {
        userId: user.userId,
        descricao: dto.descricao,
        valor: dto.valor,
        tipo: dto.tipo,
        formaPagamento: dto.formaPagamento,
        origem: dto.origem ?? 'MANUAL',
        data: dto.data ? new Date(dto.data) : new Date(),
        categoriaId: dto.categoriaId,
        cartaoId: dto.cartaoId,
        parcelaAtual: dto.parcelaAtual,
        parcelasTotal: dto.parcelasTotal,
        valorTotal: dto.valorTotal,
      },
      include: {
        categoria: { select: { nome: true, icone: true, cor: true } },
        cartao: { select: { apelido: true, ultimos4: true, cor: true } },
      },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateTransacaoDto,
  ) {
    await this.findOne(user, id);
    if (dto.categoriaId) await this.assertOwnership('categoria', user.userId, dto.categoriaId);
    if (dto.cartaoId) await this.assertOwnership('cartao', user.userId, dto.cartaoId);

    return this.prisma.transacao.update({
      where: { id },
      data: {
        ...dto,
        data: dto.data ? new Date(dto.data) : undefined,
      },
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.findOne(user, id);
    await this.prisma.transacao.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertOwnership(
    entity: 'categoria' | 'cartao',
    userId: string,
    id: string,
  ) {
    const exists =
      entity === 'categoria'
        ? await this.prisma.categoria.findFirst({
            where: { id, userId, deletedAt: null },
            select: { id: true },
          })
        : await this.prisma.cartao.findFirst({
            where: { id, userId, deletedAt: null },
            select: { id: true },
          });
    if (!exists) throw new BadRequestException(`${entity}Id inválido`);
  }
}
