import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppService } from './whatsapp.service';

/**
 * Endpoints ADMIN — só o dono do SaaS (User.role = ADMIN) pode usar.
 * São eles que conectam o número central da empresa.
 */
@Controller('admin/whatsapp')
export class AdminWhatsAppController {
  constructor(
    private readonly service: WhatsAppService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('connect')
  async connect(@CurrentUser() user: RequestUser) {
    await this.ensureAdmin(user.userId);
    return this.service.adminConnect();
  }

  @Get('status')
  async status(@CurrentUser() user: RequestUser) {
    await this.ensureAdmin(user.userId);
    return this.service.adminStatus();
  }

  @Delete()
  async disconnect(@CurrentUser() user: RequestUser) {
    await this.ensureAdmin(user.userId);
    return this.service.adminDisconnect();
  }

  private async ensureAdmin(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (u?.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores');
    }
  }
}

/**
 * Endpoints CLIENTE — qualquer user logado vê o número público do Assessor
 * e o status da conexão global (pra saber se o bot está ativo ou off).
 */
@Controller('me/whatsapp')
export class ClientWhatsAppController {
  constructor(
    private readonly service: WhatsAppService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async info() {
    const status = await this.service.adminStatus();
    const publicNumber = this.service.getPublicNumber();
    return {
      numeroAssessor: publicNumber ?? status.numero ?? null,
      online: status.status === 'CONNECTED',
    };
  }
}
