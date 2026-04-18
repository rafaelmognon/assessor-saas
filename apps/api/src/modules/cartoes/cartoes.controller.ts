import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCartaoDto } from './dto/create-cartao.dto';
import { UpdateCartaoDto } from './dto/update-cartao.dto';

@Controller('me/cartoes')
export class CartoesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    const cartoes = await this.prisma.cartao.findMany({
      where: { userId: user.userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    // Calcula fatura aberta (gasto do mês no crédito)
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const faturas = await this.prisma.transacao.groupBy({
      by: ['cartaoId'],
      where: {
        userId: user.userId,
        cartaoId: { in: cartoes.map((c) => c.id) },
        formaPagamento: 'CREDITO',
        data: { gte: inicioMes },
        deletedAt: null,
      },
      _sum: { valor: true },
      _count: true,
    });

    return cartoes.map((c) => {
      const f = faturas.find((x) => x.cartaoId === c.id);
      return {
        ...c,
        faturaAberta: f?._sum.valor ?? 0,
        transacoesMes: f?._count ?? 0,
      };
    });
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const cartao = await this.prisma.cartao.findFirst({
      where: { id, userId: user.userId, deletedAt: null },
    });
    if (!cartao) throw new NotFoundException('Cartão não encontrado');
    return cartao;
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCartaoDto) {
    return this.prisma.cartao.create({
      data: { ...dto, userId: user.userId },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCartaoDto,
  ) {
    await this.findOne(user, id);
    return this.prisma.cartao.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.findOne(user, id);
    await this.prisma.cartao.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
