import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

export type IntentType =
  | 'REGISTRAR_GASTO'
  | 'REGISTRAR_RECEITA'
  | 'CRIAR_COMPROMISSO'
  | 'CRIAR_NOTA'
  | 'CONSULTAR_RESUMO'
  | 'CONSULTAR_AGENDA'
  | 'COMANDO_AJUDA'
  | 'NAO_IDENTIFICADO';

export interface ExtractedTransacao {
  intent: 'REGISTRAR_GASTO' | 'REGISTRAR_RECEITA';
  valor: number;
  descricao: string;
  categoriaSugerida?: string;
  formaPagamento?: 'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO' | 'BOLETO' | 'TRANSFERENCIA';
}

export interface ExtractedCompromisso {
  intent: 'CRIAR_COMPROMISSO';
  titulo: string;
  inicio: string;       // ISO
  fim?: string;
  local?: string;
}

export interface ExtractedNota {
  intent: 'CRIAR_NOTA';
  titulo?: string;
  conteudo: string;
  tag: 'IDEIA' | 'INSIGHT' | 'LEMBRETE' | 'META' | 'REFERENCIA' | 'PERGUNTA';
}

export interface ExtractedConsulta {
  intent: 'CONSULTAR_RESUMO' | 'CONSULTAR_AGENDA' | 'COMANDO_AJUDA' | 'NAO_IDENTIFICADO';
}

export type ExtractedIntent =
  | ExtractedTransacao
  | ExtractedCompromisso
  | ExtractedNota
  | ExtractedConsulta;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly claude: Anthropic | null;
  private readonly openai: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const anthropicKey = config.get<string>('ANTHROPIC_API_KEY');
    const openaiKey = config.get<string>('OPENAI_API_KEY');

    this.claude = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
    this.openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    if (!this.claude) this.logger.warn('ANTHROPIC_API_KEY ausente — IA desativada');
    if (!this.openai) this.logger.warn('OPENAI_API_KEY ausente — transcrição desativada');
  }

  /**
   * Transcreve áudio via Whisper (OpenAI).
   */
  async transcribe(audioBuffer: Buffer, mimeType = 'audio/ogg'): Promise<string> {
    if (!this.openai) throw new Error('OpenAI não configurada');
    const ext = mimeType.includes('mpeg') ? 'mp3' : mimeType.includes('mp4') ? 'mp4' : 'ogg';
    const file = await toFile(audioBuffer, `audio.${ext}`, { type: mimeType });
    const r = await this.openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'pt',
    });
    return r.text;
  }

  /**
   * Classifica e extrai dados estruturados de uma mensagem em pt-BR.
   * Usa Claude com tool_use pra forçar JSON válido.
   */
  async extractIntent(
    text: string,
    contexto: { categorias: Array<{ nome: string }>; agora: Date },
  ): Promise<ExtractedIntent> {
    if (!this.claude) {
      return { intent: 'NAO_IDENTIFICADO' };
    }

    const categoriasNomes = contexto.categorias.map((c) => c.nome).join(', ');
    const agoraISO = contexto.agora.toISOString();
    const fusoBR = contexto.agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const systemPrompt = `Você é o cérebro de um assistente financeiro pessoal brasileiro chamado Assessor.
Você recebe mensagens em português e extrai a intenção do usuário em JSON estruturado.

CONTEXTO TEMPORAL:
- Agora (UTC ISO): ${agoraISO}
- Agora (BR São Paulo): ${fusoBR}
- Use sempre fuso America/Sao_Paulo ao interpretar "amanhã", "às 15h", etc.
- Datas devem ser retornadas em ISO 8601.

CATEGORIAS DISPONÍVEIS DO USUÁRIO: ${categoriasNomes || 'nenhuma cadastrada'}

INTENTS POSSÍVEIS:
- REGISTRAR_GASTO: usuário relata um gasto. Ex: "gastei 50 no mercado", "127,45 mercado extra", "almoço 35 reais no pix"
- REGISTRAR_RECEITA: usuário relata um recebimento. Ex: "recebi 3000 do cliente", "salário 8000 caiu"
- CRIAR_COMPROMISSO: agendar evento. Ex: "marca reunião amanhã 15h", "consulta dia 20 às 14h"
- CRIAR_NOTA: salvar ideia/lembrete. Ex: "anota: ideia de site novo", "lembrar de comprar presente"
- CONSULTAR_RESUMO: pediu informação financeira. Ex: "resumo", "quanto gastei esse mês", "saldo"
- CONSULTAR_AGENDA: pediu informação da agenda. Ex: "compromissos", "agenda", "o que tenho hoje"
- COMANDO_AJUDA: pediu ajuda. Ex: "ajuda", "o que você faz", "comandos"
- NAO_IDENTIFICADO: mensagem fora do escopo

REGRAS:
1. Use a tool "extrair_intencao" SEMPRE.
2. Para gasto/receita: extraia valor (número) e descrição (curta, capitalizada).
3. Para gasto: tente sugerir categoriaSugerida olhando a lista; se nenhuma se encaixa, omita.
4. Para gasto: detecte forma de pagamento se mencionada (pix, crédito, débito, dinheiro, boleto).
5. Para compromisso: extraia título limpo, data ISO em UTC (mas calculada no fuso BR).
6. Para nota: classifique tag (IDEIA / INSIGHT / LEMBRETE / META / REFERENCIA / PERGUNTA).
7. Se mensagem ambígua, prefira NAO_IDENTIFICADO.`;

    try {
      const res = await this.claude.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        tools: [
          {
            name: 'extrair_intencao',
            description: 'Extrai intenção e dados estruturados da mensagem',
            input_schema: {
              type: 'object',
              properties: {
                intent: {
                  type: 'string',
                  enum: [
                    'REGISTRAR_GASTO',
                    'REGISTRAR_RECEITA',
                    'CRIAR_COMPROMISSO',
                    'CRIAR_NOTA',
                    'CONSULTAR_RESUMO',
                    'CONSULTAR_AGENDA',
                    'COMANDO_AJUDA',
                    'NAO_IDENTIFICADO',
                  ],
                },
                valor: { type: 'number' },
                descricao: { type: 'string' },
                categoriaSugerida: { type: 'string' },
                formaPagamento: {
                  type: 'string',
                  enum: ['PIX', 'CREDITO', 'DEBITO', 'DINHEIRO', 'BOLETO', 'TRANSFERENCIA'],
                },
                titulo: { type: 'string' },
                inicio: { type: 'string', description: 'ISO 8601 UTC' },
                fim: { type: 'string', description: 'ISO 8601 UTC' },
                local: { type: 'string' },
                conteudo: { type: 'string' },
                tag: {
                  type: 'string',
                  enum: ['IDEIA', 'INSIGHT', 'LEMBRETE', 'META', 'REFERENCIA', 'PERGUNTA'],
                },
              },
              required: ['intent'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'extrair_intencao' },
        messages: [{ role: 'user', content: text }],
      });

      const block = res.content.find((c) => c.type === 'tool_use');
      if (!block || block.type !== 'tool_use') {
        return { intent: 'NAO_IDENTIFICADO' };
      }
      return block.input as ExtractedIntent;
    } catch (e: any) {
      this.logger.error(`Claude error: ${e.message}`);
      return { intent: 'NAO_IDENTIFICADO' };
    }
  }
}
