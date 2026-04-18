import { Controller, Get, Query } from '@nestjs/common';
import { FieldCryptoService } from '../../common/crypto/field-crypto.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Histórico de mensagens do próprio usuário — conteúdo descriptografado
 * só na resposta da API (nunca armazenado em claro).
 *
 * Por design: só o DONO das mensagens (via JWT) consegue ler as suas.
 * Ninguém mais — nem mesmo um ADMIN — pode descriptografar sem a chave.
 */
@Controller('me/mensagens')
export class MensagensController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: FieldCryptoService,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit = '50',
  ) {
    const mensagens = await this.prisma.mensagem.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit, 10) || 50, 200),
    });

    // 🔓 Descriptografa só na hora da leitura
    return mensagens.map((m) => ({
      id: m.id,
      direcao: m.direcao,
      tipo: m.tipo,
      intent: m.intent,
      conteudo: this.crypto.decrypt(m.conteudo),
      transcricao: this.crypto.decryptOptional(m.transcricao),
      createdAt: m.createdAt,
    }));
  }
}
