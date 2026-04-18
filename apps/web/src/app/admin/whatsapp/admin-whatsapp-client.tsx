'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Loader2, CheckCircle2, XCircle, RefreshCw, Shield } from 'lucide-react';
import {
  adminConnectWhatsAppAction,
  adminDisconnectWhatsAppAction,
} from '@/lib/crud-actions';

interface Status {
  status: 'NAO_CONFIGURADO' | 'PENDING' | 'QR_CODE' | 'CONNECTED' | 'DISCONNECTED' | 'BANNED';
  numero?: string;
  qrcode?: string;
  conectadoEm?: string | null;
}

export function AdminWhatsAppClient({ initialStatus }: { initialStatus: Status }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status.status !== 'QR_CODE' && status.status !== 'PENDING') return;
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [status.status, router]);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  function handleConnect() {
    setError(null);
    start(async () => {
      const res = await adminConnectWhatsAppAction();
      if (!res.ok) {
        setError(res.error ?? 'Falha ao conectar');
        return;
      }
      const data = res.data as { status: string; qrcode?: string };
      setStatus({ status: data.status as Status['status'], qrcode: data.qrcode });
    });
  }

  function handleDisconnect() {
    if (!confirm('Desconectar o Assessor? Todos os clientes ficarão sem poder usar.')) return;
    start(async () => {
      await adminDisconnectWhatsAppAction();
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Admin</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Conexão do Assessor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Conecte o número central que TODOS os seus clientes vão usar.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#f1f1f3] rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-2xl">💬</div>
          <div>
            <div className="font-semibold text-slate-900">Número central do SaaS</div>
            <div className="text-xs text-slate-500">{labelStatus(status.status)}</div>
          </div>
        </div>

        {(status.status === 'NAO_CONFIGURADO' || status.status === 'DISCONNECTED') && (
          <div className="text-center py-8">
            <Smartphone className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
              Clique em "Gerar QR code" e escaneie com o WhatsApp da empresa (o número que todos os clientes vão salvar).
            </p>
            <button
              onClick={handleConnect}
              disabled={pending}
              className="bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Gerar QR code
            </button>
            {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mt-4 max-w-md mx-auto">{error}</div>}
          </div>
        )}

        {status.status === 'PENDING' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 mx-auto text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-slate-600">Preparando QR code...</p>
          </div>
        )}

        {status.status === 'QR_CODE' && status.qrcode && (
          <div className="max-w-md mx-auto">
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-center mb-4">
              <img src={status.qrcode} alt="QR Code WhatsApp" className="max-w-[280px] w-full" />
            </div>
            <ol className="text-xs text-slate-600 space-y-1 mb-3">
              <li>1. Abra o WhatsApp da empresa no celular</li>
              <li>2. Configurações → <b>Aparelhos conectados</b></li>
              <li>3. <b>Conectar um aparelho</b></li>
              <li>4. Aponte a câmera pro QR</li>
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
            <div className="font-semibold text-slate-900 mb-2">Número banido pelo WhatsApp</div>
            <p className="text-sm text-slate-600">Use outro número ou aguarde desbloqueio.</p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm">
        <div className="font-semibold text-amber-900 mb-2">⚠️ Importante</div>
        <ul className="space-y-1 text-amber-800 list-disc list-inside">
          <li>Use um chip dedicado da empresa (não o WhatsApp pessoal).</li>
          <li>Uma vez conectado, o número fica ativo 24/7 atendendo seus clientes.</li>
          <li>Não enviamos mensagens em massa — só respondemos ao que os clientes mandam.</li>
        </ul>
      </div>
    </>
  );
}

function labelStatus(s: Status['status']): string {
  return {
    NAO_CONFIGURADO: 'Não configurado',
    PENDING: 'Aguardando...',
    QR_CODE: 'Aguardando escaneamento',
    CONNECTED: '● Conectado',
    DISCONNECTED: 'Desconectado',
    BANNED: 'Número banido',
  }[s];
}
