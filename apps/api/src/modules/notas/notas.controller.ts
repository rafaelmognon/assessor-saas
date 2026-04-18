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
import { NotaTag } from '@prisma/client';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';

@Controller('me/notas')
export class NotasController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query('tag') tag?: NotaTag,
    @Query('q') q?: string,
    @Query('limit') limit = '100',
  ) {
    return this.prisma.nota.findMany({
      where: {
        userId: user.userId,
        deletedAt: null,
        ...(tag ? { tag } : {}),
        ...(q
          ? {
              OR: [
                { titulo: { contains: q, mode: 'insensitive' } },
                { conteudo: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ fixada: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(parseInt(limit, 10) || 100, 500),
    });
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const n = await this.prisma.nota.findFirst({
      where: { id, userId: user.userId, deletedAt: null },
    });
    if (!n) throw new NotFoundException('Nota não encontrada');
    return n;
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateNotaDto) {
    return this.prisma.nota.create({
      data: {
        userId: user.userId,
        titulo: dto.titulo,
        conteudo: dto.conteudo,
        tag: dto.tag ?? 'IDEIA',
        cor: dto.cor,
        fixada: dto.fixada ?? false,
        origem: dto.origem ?? 'MANUAL',
      },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateNotaDto,
  ) {
    await this.findOne(user, id);
    return this.prisma.nota.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.findOne(user, id);
    await this.prisma.nota.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
