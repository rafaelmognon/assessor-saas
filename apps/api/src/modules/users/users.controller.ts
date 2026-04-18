import { Controller, Get, NotFoundException } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('me')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async me(@CurrentUser() user: RequestUser) {
    const u = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        nome: true,
        whatsapp: true,
        avatarUrl: true,
        plano: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        fusoHorario: true,
        moeda: true,
        createdAt: true,
      },
    });
    if (!u) throw new NotFoundException();
    return u;
  }
}
