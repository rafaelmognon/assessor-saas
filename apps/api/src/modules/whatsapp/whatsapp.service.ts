import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EvolutionAdapter } from './adapters/evolution.adapter';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adapter: EvolutionAdapter,
  ) {}

  /**
   * Cria nova instância WhatsApp para o usuário (ou recupera existente).
   * Retorna QR code pra escanear.
   */
  async connect(userId: string) {
    let instance = await this.prisma.whatsAppInstance.findUnique({ where: { userId } });

    if (!instance) {
      // Gera instanceId único e estável (usado tanto na Evolution quanto no nosso banco)
      const instanceId = `u_${randomBytes(12).toString('hex')}`;
      instance = await this.prisma.whatsAppInstance.create({
        data: {
          userId,
          provider: 'evolution',
          instanceId,
          status: 'PENDING',
        },
      });
    }

    // Se já está conectada, devolve status sem mexer
    if (instance.status === 'CONNECTED') {
      const status = await this.adapter.getStatus(instance.instanceId);
      if (status.status === 'CONNECTED') {
        return {
          status: 'CONNECTED' as const,
          numero: status.numero ?? instance.numero,
        };
      }
      // se a Evolution diz que caiu, atualizamos
    }

    // Cria/recria a instância na Evolution
    let result;
    try {
      result = await this.adapter.createInstance(instance.instanceId);
    } catch (e: any) {
      // Se já existe, busca o QR
      const status = await this.adapter.getStatus(instance.instanceId);
      result = {
        instanceId: instance.instanceId,
        qrcode: status.qrcode,
        status: status.status,
      };
    }

    await this.prisma.whatsAppInstance.update({
      where: { userId },
      data: {
        status: result.status,
        qrCode: result.qrcode ?? null,
      },
    });

    return {
      status: result.status,
      qrcode: result.qrcode,
    };
  }

  async getStatus(userId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { userId } });
    if (!instance) {
      return { status: 'NAO_CONFIGURADO' as const };
    }

    // O banco já está atualizado pelo webhook (qrcode.updated, connection.update).
    // Fallback: se está PENDING há mais de 10s sem QR, faz polling à Evolution.
    const idadeS = (Date.now() - instance.updatedAt.getTime()) / 1000;
    if (instance.status === 'PENDING' && idadeS > 10 && !instance.qrCode) {
      const remote = await this.adapter.getStatus(instance.instanceId);
      if (remote.qrcode || remote.status !== 'PENDING') {
        const updated = await this.prisma.whatsAppInstance.update({
          where: { userId },
          data: {
            status: remote.status,
            qrCode: remote.qrcode ?? null,
            numero: remote.numero ?? instance.numero,
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
      status: instance.status,
      numero: instance.numero ?? undefined,
      qrcode: instance.qrCode ?? undefined,
      conectadoEm: instance.conectadoEm,
    };
  }

  async disconnect(userId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { userId } });
    if (!instance) throw new NotFoundException('Sem instância WhatsApp');

    await this.adapter.deleteInstance(instance.instanceId);
    await this.prisma.whatsAppInstance.update({
      where: { userId },
      data: {
        status: 'DISCONNECTED',
        qrCode: null,
        numero: null,
      },
    });
    return { ok: true };
  }

  /**
   * Envia mensagem para o WhatsApp do usuário.
   * Usado pelo bot quando responde uma mensagem.
   */
  async sendToUser(userId: string, text: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { userId } });
    if (!instance || !instance.numero || instance.status !== 'CONNECTED') {
      this.logger.warn(`User ${userId} sem WhatsApp conectado — msg não enviada`);
      return;
    }
    await this.adapter.sendText(instance.instanceId, {
      to: instance.numero,
      text,
    });
  }

  /**
   * Encontra usuário pelo número que mandou mensagem (E.164).
   * Usado pelo webhook pra rotear msg pro tenant certo.
   */
  async findUserByNumero(numero: string) {
    const onlyDigits = numero.replace(/\D/g, '');
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { numero: { contains: onlyDigits } },
      include: { user: true },
    });
    return instance?.user;
  }
}
