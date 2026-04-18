'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import {
  connectWhatsAppAction,
  disconnectWhatsAppAction,
} from '@/lib/crud-actions';

interface Status {
  status: 'NAO_CONFIGURADO' | 'PENDING' | 'QR_CODE' | 'CONNECTED' | 'DISCONNECTED' | 'BANNED';
  numero?: string;
  qrcode?: string;
  conectadoEm?: string | null;
}

export function WhatsAppClient({ initialStatus }: { initialStatus: Status }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Polling do status enquanto QR code está ativo (a cada 4s)
  useEffect(() => {
    if (status.status !== 'QR_CODE' && status.status !== 'PENDING') return;
    const id = setInterval(() => {
      router.refresh();
    }, 4000);
    return () => clearInterval(id);
  }, [status.status, router]);

  // Sync prop -> state quando router refresh atualizar
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  function handleConnect() {
    setError(null);
    start(async () => {
      const res = await connectWhatsAppAction();
      if (!res.ok) {
        setError(res.error ?? 'Falha ao conectar. Verifique se a Evolution API está rodando.');
        return;
      }
      const data = res.data as { status: string; qrcode?: string };
      setStatus({
        status: data.status as Status['status'],
        qrcode: data.qrcode,
      });
    });
  }

  function handleDisconnect() {
    if (!confirm('Desconectar seu WhatsApp?')) return;
    start(async () => {
      await disconnectWhatsAppAction();
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">WhatsApp</h1>
        <p className="text-sm text-slate-500 mt-1">Conecte seu número pra usar o assistente por mensagem ou áudio.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status / QR */}
        <div className="bg-white border border-[#f1f1f3] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-2xl">💬</div>
            <div>
              <div className="font-semibold text-slate-900">Conexão WhatsApp</div>
              <div className="text-xs text-slate-500">{labelStatus(status.status)}</div>
            </div>
          </div>

          {/* Estados */}
          {(status.status === 'NAO_CONFIGURADO' || status.status === 'DISCONNECTED') && (
            <div className="text-center py-8">
              <Smartphone className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-600 mb-4">
                Clica em "Gerar QR code" e escaneia com seu WhatsApp.
              </p>
              <button
                onClick={handleConnect}
                disabled={pending}
                className="bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
              >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Gerar QR code
              </button>
              {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mt-4">{error}</div>}
            </div>
          )}

          {status.status === 'PENDING' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-slate-600">Preparando QR code...</p>
            </div>
          )}

          {status.status === 'QR_CODE' && status.qrcode && (
            <div>
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-center mb-4">
                <img
                  src={status.qrcode}
                  alt="QR Code WhatsApp"
                  className="max-w-[280px] w-full"
                />
              </div>
              <ol className="text-xs text-slate-600 space-y-1 mb-3">
                <li>1. Abra o WhatsApp no seu celular</li>
                <li>2. Toque em <b>Configurações → Aparelhos conectados</b></li>
                <li>3. Toque em <b>Conectar um aparelho</b></li>
                <li>4. Aponte a câmera pra esse QR</li>
              </ol>
              <p className="text-xs text-slate-400 text-center">Atualizando automaticamente...</p>
            </div>
          )}

          {status.status === 'CONNECTED' && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-3" />
              <div className="font-semibold text-slate-900 mb-1">Conectado!</div>
              {status.numero && (
                <div className="text-sm text-slate-600 mb-4">
                  Número: <strong>{status.numero}</strong>
                </div>
              )}
              {status.conectadoEm && (
                <div className="text-xs text-slate-400 mb-4">
                  Desde {new Date(status.conectadoEm).toLocaleString('pt-BR')}
                </div>
              )}
              <button
                onClick={handleDisconnect}
                disabled={pending}
                className="text-sm text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-lg"
              >
                Desconectar
              </button>
            </div>
          )}

          {status.status === 'BANNED' && (
            <div className="text-center py-6">
              <XCircle className="w-16 h-16 mx-auto text-rose-500 mb-3" />
              <div className="font-semibold text-slate-900 mb-2">Número banido</div>
              <p className="text-sm text-slate-600">
                O WhatsApp baniu este número. Use outro número ou aguarde.
              </p>
            </div>
          )}
        </div>

        {/* Como usar */}
        <div className="bg-white border border-[#f1f1f3] rounded-2xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4">O que você pode pedir</h3>

          <div className="space-y-3">
            <Exemplo emoji="💸" titulo="Registrar gasto" exemplos={['"gastei 45 no mercado"', '"pix de 30 no uber"', '"127,45 mercado extra crédito nubank"']} />
            <Exemplo emoji="💰" titulo="Registrar receita" exemplos={['"recebi 3000 do cliente atto"', '"salário 8000 caiu"']} />
            <Exemplo emoji="📅" titulo="Criar compromisso" exemplos={['"marca reunião amanhã às 15h"', '"consulta dia 25 às 14h dr pereira"']} />
            <Exemplo emoji="📝" titulo="Salvar nota/ideia" exemplos={['"anota: ideia de site novo com vídeo no hero"', '"lembrar de comprar presente da ana"']} />
            <Exemplo emoji="📊" titulo="Consultar" exemplos={['"resumo"', '"agenda"', '"saldo do mês"']} />
            <Exemplo emoji="🎤" titulo="Áudio" exemplos={['Mande qualquer mensagem acima como áudio — eu transcrevo e processo']} />
          </div>
        </div>
      </div>
    </>
  );
}

function Exemplo({ emoji, titulo, exemplos }: { emoji: string; titulo: string; exemplos: string[] }) {
  return (
    <div className="border border-slate-100 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{emoji}</span>
        <span className="text-sm font-semibold text-slate-900">{titulo}</span>
      </div>
      <div className="space-y-0.5 ml-7">
        {exemplos.map((e, i) => (
          <div key={i} className="text-xs text-slate-500 italic">{e}</div>
        ))}
      </div>
    </div>
  );
}

function labelStatus(s: Status['status']): string {
  return {
    NAO_CONFIGURADO: 'Não configurado',
    PENDING: 'Aguardando...',
    QR_CODE: 'Aguardando você escanear',
    CONNECTED: '● Conectado',
    DISCONNECTED: 'Desconectado',
    BANNED: 'Número banido',
  }[s];
}
