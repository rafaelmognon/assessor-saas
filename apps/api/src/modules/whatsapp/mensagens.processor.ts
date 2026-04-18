import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CategoriaTipo, FormaPagamento, MensagemDirecao, MensagemTipo, OrigemTransacao, TransacaoTipo, NotaTag, CompromissoOrigem, NotaOrigem, MensagemIntent } from '@prisma/client';
import { FieldCryptoService } from '../../common/crypto/field-crypto.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService, ExtractedIntent } from '../ai/ai.service';
import { EvolutionAdapter } from './adapters/evolution.adapter';
import { WhatsAppService } from './whatsapp.service';
import { IncomingMessage } from './adapters/whatsapp-adapter.interface';
import { MENSAGENS_QUEUE } from './webhook.controller';

@Processor(MENSAGENS_QUEUE)
export class MensagensProcessor extends WorkerHost {
  private readonly logger = new Logger(MensagensProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly adapter: EvolutionAdapter,
    private readonly whats: WhatsAppService,
    private readonly crypto: FieldCryptoService,
  ) {
    super();
  }

  async process(job: Job<IncomingMessage>): Promise<void> {
    const msg = job.data;

    // Dedup
    const existing = await this.prisma.mensagem.findUnique({
      where: { externalId: msg.externalId },
    });
    if (existing) {
      this.logger.log(`msg ${msg.externalId} já processada — ignorando`);
      return;
    }

    // Identifica o user pelo NÚMERO DO REMETENTE (modelo SaaS centralizado)
    const user = await this.whats.findUserByNumero(msg.from);
    if (!user) {
      this.logger.log(`Número desconhecido: ${msg.from} — enviando mensagem de cadastro`);
      const webUrl = process.env.WEB_URL ?? 'http://76.13.169.247';
      await this.whats.sendToNumber(
        msg.from,
        `👋 Olá! Eu sou o *Assessor*, seu assistente pessoal de finanças e agenda.\n\n` +
          `Pra começar a usar, crie sua conta no site:\n` +
          `🔗 ${webUrl}/signup\n\n` +
          `Coloque este número (${msg.from}) no cadastro e a gente se conecta automaticamente. ✨`,
      );
      return;
    }
    const userId = user.id;

    // Setar tenant pra RLS
    await this.prisma.setTenant(userId);

    // Salva a mensagem (recebida)
    let conteudo = msg.text ?? '';
    let transcricao: string | null = null;

    if (msg.type === 'AUDIO' && msg.mediaUrl) {
      let audioBuffer: Buffer | null = null;
      try {
        audioBuffer = await this.adapter.downloadMedia(msg.mediaUrl);
        transcricao = await this.ai.transcribe(audioBuffer, msg.mediaMimeType);
        conteudo = transcricao;
      } catch (e: any) {
        this.logger.error(`Falha ao transcrever áudio: ${e.message}`);
        await this.whats.sendToNumber(msg.from, '🤔 Não consegui entender seu áudio. Pode escrever?');
        return;
      } finally {
        // 🔒 Descarta buffer do áudio imediatamente após processar
        // (garbage collector libera da memória, nunca foi gravado em disco)
        audioBuffer = null;
      }
    }

    if (!conteudo.trim()) {
      this.logger.warn('Mensagem sem texto/transcrição');
      return;
    }

    // 🔐 Criptografa conteúdo e transcrição antes de persistir
    const mensagem = await this.prisma.mensagem.create({
      data: {
        userId,
        externalId: msg.externalId,
        direcao: MensagemDirecao.ENTRADA,
        tipo: msg.type === 'AUDIO' ? MensagemTipo.AUDIO : MensagemTipo.TEXTO,
        conteudo: this.crypto.encrypt(conteudo),
        transcricao: this.crypto.encryptOptional(transcricao),
        createdAt: msg.timestamp,
      },
    });

    // Busca categorias do user pra dar contexto à IA
    const categorias = await this.prisma.categoria.findMany({
      where: { userId, deletedAt: null },
      select: { nome: true, tipo: true, icone: true },
    });

    // Extrai intenção via Claude
    const intent = await this.ai.extractIntent(conteudo, {
      categorias,
      agora: new Date(),
    });

    // 🔒 Log sem expor conteúdo da mensagem
    this.logger.log(`Intent: ${intent.intent} | userId: ${userId} | chars: ${conteudo.length}`);

    await this.prisma.mensagem.update({
      where: { id: mensagem.id },
      data: {
        intent: intent.intent as MensagemIntent,
        processadaEm: new Date(),
      },
    });

    // Executa a ação correspondente
    let resposta = '';
    try {
      resposta = await this.executar(userId, intent, mensagem.id, categorias);
    } catch (e: any) {
      this.logger.error(`Erro ao executar intent: ${e.message}`, e.stack);
      resposta = '😅 Tive um problema ao processar. Tenta de novo daqui a pouco.';
    }

    // Responde ao usuário (pelo número dele)
    if (resposta) {
      await this.whats.sendToNumber(msg.from, resposta);
      await this.prisma.mensagem.create({
        data: {
          userId,
          direcao: MensagemDirecao.SAIDA,
          tipo: MensagemTipo.SISTEMA,
          conteudo: this.crypto.encrypt(resposta),
        },
      });
    }
  }

  private async executar(
    userId: string,
    intent: ExtractedIntent,
    mensagemId: string,
    categorias: Array<{ nome: string; tipo: CategoriaTipo; icone: string }>,
  ): Promise<string> {
    switch (intent.intent) {
      case 'REGISTRAR_GASTO':
      case 'REGISTRAR_RECEITA': {
        if (!intent.valor || !intent.descricao) {
          return '🤔 Não consegui identificar o valor ou a descrição. Tenta tipo: "gastei 50 no mercado".';
        }
        const tipo = intent.intent === 'REGISTRAR_GASTO' ? TransacaoTipo.SAIDA : TransacaoTipo.ENTRADA;
        const cat = intent.categoriaSugerida
          ? categorias.find((c) => c.nome.toLowerCase() === intent.categoriaSugerida!.toLowerCase())
          : null;
        const categoriaDb = cat
          ? await this.prisma.categoria.findFirst({
              where: { userId, nome: cat.nome, deletedAt: null },
            })
          : null;

        const t = await this.prisma.transacao.create({
          data: {
            userId,
            descricao: intent.descricao,
            valor: intent.valor,
            tipo,
            formaPagamento: (intent.formaPagamento as FormaPagamento) ?? FormaPagamento.PIX,
            origem: OrigemTransacao.WHATSAPP_TEXTO, // ajustamos pra AUDIO se veio de transcrição (não temos esse dado aqui, simplifica)
            mensagemId,
          },
        });

        const emoji = tipo === TransacaoTipo.SAIDA ? '💸' : '💰';
        const sinal = tipo === TransacaoTipo.SAIDA ? '-' : '+';
        const fmt = (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        let resposta = `${emoji} *Registrado!*\n\n${categoriaDb?.icone ?? '•'} ${t.descricao}\n${sinal} ${fmt(Number(t.valor))}`;
        if (categoriaDb) resposta += `\n📂 ${categoriaDb.nome}`;
        return resposta;
      }

      case 'CRIAR_COMPROMISSO': {
        if (!intent.titulo || !intent.inicio) {
          return '📅 Não consegui identificar título ou data. Ex: "marca reunião amanhã às 15h"';
        }
        const inicio = new Date(intent.inicio);
        const fim = intent.fim ? new Date(intent.fim) : new Date(inicio.getTime() + 60 * 60e3);
        const c = await this.prisma.compromisso.create({
          data: {
            userId,
            titulo: intent.titulo,
            inicio,
            fim,
            local: intent.local,
            origem: CompromissoOrigem.WHATSAPP_TEXTO,
            mensagemId,
          },
        });
        const dataFmt = c.inicio.toLocaleString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        });
        return `📅 *Agendado!*\n\n${c.titulo}\n🕒 ${dataFmt}${c.local ? `\n📍 ${c.local}` : ''}`;
      }

      case 'CRIAR_NOTA': {
        if (!intent.conteudo) return '📝 Conteúdo da nota está vazio.';
        await this.prisma.nota.create({
          data: {
            userId,
            titulo: intent.titulo,
            conteudo: intent.conteudo,
            tag: (intent.tag as NotaTag) ?? NotaTag.IDEIA,
            origem: NotaOrigem.WHATSAPP_TEXTO,
            mensagemId,
          },
        });
        return `✅ *Nota salva* (${intent.tag ?? 'IDEIA'})`;
      }

      case 'CONSULTAR_RESUMO': {
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);
        const [r, s] = await Promise.all([
          this.prisma.transacao.aggregate({
            where: { userId, tipo: 'ENTRADA', data: { gte: inicioMes }, deletedAt: null },
            _sum: { valor: true },
          }),
          this.prisma.transacao.aggregate({
            where: { userId, tipo: 'SAIDA', data: { gte: inicioMes }, deletedAt: null },
            _sum: { valor: true },
          }),
        ]);
        const rec = Number(r._sum.valor ?? 0);
        const desp = Number(s._sum.valor ?? 0);
        const fmt = (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        return `📊 *Resumo de ${inicioMes.toLocaleDateString('pt-BR', { month: 'long' })}*\n\n💰 Receitas: ${fmt(rec)}\n💸 Despesas: ${fmt(desp)}\n━━━━━━━━━━\n✨ Saldo: ${fmt(rec - desp)}`;
      }

      case 'CONSULTAR_AGENDA': {
        const proximos = await this.prisma.compromisso.findMany({
          where: { userId, inicio: { gte: new Date() }, deletedAt: null },
          orderBy: { inicio: 'asc' },
          take: 5,
        });
        if (proximos.length === 0) return '📅 Nenhum compromisso agendado.';
        const linhas = proximos.map((c) => {
          const dt = c.inicio.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo',
          });
          return `• ${dt} — ${c.titulo}`;
        });
        return `📅 *Próximos compromissos:*\n\n${linhas.join('\n')}`;
      }

      case 'COMANDO_AJUDA':
        return [
          '👋 *Comandos disponíveis:*',
          '',
          '💰 _Gastos_: "gastei 50 no mercado", "pix de 30 no uber"',
          '💵 _Receitas_: "recebi 3000 do cliente"',
          '📅 _Agenda_: "marca reunião amanhã 15h"',
          '📝 _Notas_: "anota: ideia de site"',
          '📊 _Consultas_: "resumo", "agenda", "saldo"',
          '',
          'Pode mandar áudio também! 🎤',
        ].join('\n');

      case 'NAO_IDENTIFICADO':
      default:
        return '🤔 Não entendi bem. Tenta algo como "gastei 30 no almoço" ou manda "ajuda".';
    }
  }
}
