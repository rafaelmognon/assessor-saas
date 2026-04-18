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
  Query,
} from '@nestjs/common';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompromissoDto } from './dto/create-compromisso.dto';
import { UpdateCompromissoDto } from './dto/update-compromisso.dto';

@Controller('me/compromissos')
export class CompromissosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query('de') de?: string,
    @Query('ate') ate?: string,
    @Query('limit') limit = '100',
  ) {
    return this.prisma.compromisso.findMany({
      where: {
        userId: user.userId,
        deletedAt: null,
        ...(de || ate
          ? {
              inicio: {
                ...(de ? { gte: new Date(de) } : {}),
                ...(ate ? { lte: new Date(ate) } : {}),
              },
            }
          : {}),
      },
      orderBy: { inicio: 'asc' },
      take: Math.min(parseInt(limit, 10) || 100, 500),
    });
  }

  @Get('proximos')
  proximos(@CurrentUser() user: RequestUser, @Query('limit') limit = '4') {
    return this.prisma.compromisso.findMany({
      where: {
        userId: user.userId,
        deletedAt: null,
        inicio: { gte: new Date() },
      },
      orderBy: { inicio: 'asc' },
      take: Math.min(parseInt(limit, 10) || 4, 20),
    });
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const c = await this.prisma.compromisso.findFirst({
      where: { id, userId: user.userId, deletedAt: null },
    });
    if (!c) throw new NotFoundException('Compromisso não encontrado');
    return c;
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCompromissoDto) {
    return this.prisma.compromisso.create({
      data: {
        userId: user.userId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        local: dto.local,
        inicio: new Date(dto.inicio),
        fim: dto.fim ? new Date(dto.fim) : null,
        diaInteiro: dto.diaInteiro ?? false,
        cor: dto.cor ?? 'indigo',
        lembretesMinutos: dto.lembretesMinutos ?? [30],
        origem: dto.origem ?? 'MANUAL',
      },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCompromissoDto,
  ) {
    await this.findOne(user, id);
    return this.prisma.compromisso.update({
      where: { id },
      data: {
        ...dto,
        inicio: dto.inicio ? new Date(dto.inicio) : undefined,
        fim: dto.fim ? new Date(dto.fim) : undefined,
      },
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.findOne(user, id);
    await this.prisma.compromisso.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
