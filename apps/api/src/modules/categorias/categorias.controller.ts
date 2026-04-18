import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Controller('me/categorias')
export class CategoriasController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.prisma.categoria.findMany({
      where: { userId: user.userId, deletedAt: null },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const cat = await this.prisma.categoria.findFirst({
      where: { id, userId: user.userId, deletedAt: null },
    });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return cat;
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateCategoriaDto) {
    try {
      return await this.prisma.categoria.create({
        data: { ...dto, userId: user.userId },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Você já tem uma categoria com esse nome');
      }
      throw e;
    }
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoriaDto,
  ) {
    await this.findOne(user, id); // valida existência + tenant
    return this.prisma.categoria.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.findOne(user, id);
    // Soft delete: mantém histórico (LGPD + transações que referenciam)
    await this.prisma.categoria.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
