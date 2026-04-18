import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EvolutionAdapter } from './adapters/evolution.adapter';

/**
 * WhatsAppService — modelo SaaS centralizado.
 *
 * Existe UMA única instância Evolution compartilhada por TODOS os clientes.
 * O identificador é fixo (GLOBAL_INSTANCE_ID). Os clientes não conectam nada —
 * eles só salvam o número do SaaS como contato e mandam mensagem.
 *
 * A identificação do tenant acontece no webhook, olhando o número remetente
 * (campo User.whatsapp).
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  /** ID estável da instância global. Um e apenas um no sistema. */
  static readonly GLOBAL_INSTANCE_ID = 'assessor-saas-global';

  constructor(
    private readonly prisma: PrismaService,
    private readonly adapter: EvolutionAdapter,
    private readonly config: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // ADMIN (só o dono do SaaS usa)
  // ─────────────────────────────────────────────────────────────

  /** Cria (ou recupera) a instância global e devolve QR pra escanear. */
  async adminConnect() {
    const id = WhatsAppService.GLOBAL_INSTANCE_ID;

    // Registro local (1 linha só, sem userId fixo)
    let row = await this.prisma.whatsAppInstance.findFirst({
      where: { instanceId: id },
    });
    if (!row) {
      row = await this.prisma.whatsAppInstance.create({
        data: {
          instanceId: id,
          provider: 'evolution',
          status: 'PENDING',
          // WhatsAppInstance precisa de userId (schema atual exige).
          // Pra instância global usamos o primeiro ADMIN. Se não houver, usa o user mais antigo.
          userId: await this.firstAdminUserId(),
        },
      });
    }

    if (row.status === 'CONNECTED') {
      const s = await this.adapter.getStatus(id);
      if (s.status === 'CONNECTED') {
        return { status: 'CONNECTED' as const, numero: s.numero ?? row.numero };
      }
    }

    // Tenta criar na Evolution. Se já existir, só pega o QR atual.
    let result;
    try {
      result = await this.adapter.createInstance(id);
    } catch {
      const s = await this.adapter.getStatus(id);
      result = { instanceId: id, qrcode: s.qrcode, status: s.status };
    }

    await this.prisma.whatsAppInstance.update({
      where: { id: row.id },
      data: {
        status: result.status,
        qrCode: result.qrcode ?? null,
      },
    });

    return { status: result.status, qrcode: result.qrcode };
  }

  async adminStatus() {
    const id = WhatsAppService.GLOBAL_INSTANCE_ID;
    const row = await this.prisma.whatsAppInstance.findFirst({ where: { instanceId: id } });
    if (!row) return { status: 'NAO_CONFIGURADO' as const };

    // Fallback polling se está PENDING há mais de 10s sem QR
    const idadeS = (Date.now() - row.updatedAt.getTime()) / 1000;
    if (row.status === 'PENDING' && idadeS > 10 && !row.qrCode) {
      const remote = await this.adapter.getStatus(id);
      if (remote.qrcode || remote.status !== 'PENDING') {
        const updated = await this.prisma.whatsAppInstance.update({
          where: { id: row.id },
          data: {
            status: remote.status,
            qrCode: remote.qrcode ?? null,
            numero: remote.numero ?? row.numero,
            ultimoPingEm: new Date(),
          },
        });
        return {
          status: updated.status,
          numero: updated.numero ?? undefined,
          qrcode: updated.qrCode ?? undefined,
          conectadoEm: updated.conectadoEm,
        };
      }
    }

    return {
      status: row.status,
      numero: row.numero ?? undefined,
      qrcode: row.qrCode ?? undefined,
      conectadoEm: row.conectadoEm,
    };
  }

  async adminDisconnect() {
    const id = WhatsAppService.GLOBAL_INSTANCE_ID;
    await this.adapter.deleteInstance(id);
    await this.prisma.whatsAppInstance.updateMany({
      where: { instanceId: id },
      data: { status: 'DISCONNECTED', qrCode: null, numero: null },
    });
    return { ok: true };
  }

  // ─────────────────────────────────────────────────────────────
  // USO INTERNO (bot falando com cliente)
  // ─────────────────────────────────────────────────────────────

  /**
   * Envia mensagem pra um cliente específico (usado pelo worker ao responder).
   */
  async sendToNumber(numero: string, text: string) {
    const id = WhatsAppService.GLOBAL_INSTANCE_ID;
    await this.adapter.sendText(id, { to: numero, text });
  }

  /** Busca user pelo número do WhatsApp. Compara só os dígitos (tolera formatação). */
  async findUserByNumero(numero: string) {
    const onlyDigits = numero.replace(/\D/g, '');
    if (!onlyDigits) return null;

    // Busca por sufixo (em geral salvamos +55... mas o webhook pode vir sem +)
    const users = await this.prisma.user.findMany({
      where: {
        whatsapp: { not: null },
        deletedAt: null,
      },
      select: { id: true, email: true, nome: true, whatsapp: true },
    });
    return users.find((u) => (u.whatsapp ?? '').replace(/\D/g, '') === onlyDigits);
  }

  /** Retorna o número público do SaaS (exibido na UI para o cliente salvar) */
  getPublicNumber(): string | null {
    const row = this.config.get<string>('WHATSAPP_PUBLIC_NUMBER');
    return row ?? null;
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers privados
  // ─────────────────────────────────────────────────────────────

  private async firstAdminUserId(): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (admin) return admin.id;
    // fallback: o user mais antigo (provavelmente o dono em dev)
    const any = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!any) throw new Error('Nenhum user no sistema');
    return any.id;
  }
}
