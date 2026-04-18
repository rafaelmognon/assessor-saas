'use client';

import { Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Info {
  numeroAssessor: string | null;
  online: boolean;
}

interface Me {
  whatsapp: string | null;
  nome: string;
}

export function WhatsAppClient({ info, me }: { info: Info; me: Me }) {
  const [copied, setCopied] = useState(false);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const numero = info.numeroAssessor;
  const whatsLink = numero
    ? `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent('Olá!')}`
    : null;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Seu Assessor no WhatsApp</h1>
        <p className="text-sm text-slate-500 mt-1">
          Salve o contato e mande mensagens ou áudios. Eu anoto tudo automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Card principal — número do Assessor */}
        <div className="lg:col-span-3 bg-white border border-[#f1f1f3] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center text-white text-3xl">💬</div>
            <div>
              <div className="font-bold text-slate-900 text-lg">Meu Assessor</div>
              <div className="flex items-center gap-2 text-xs">
                {info.online ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Online agora
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <AlertCircle className="w-3 h-3" />
                    Offline no momento
                  </span>
                )}
              </div>
            </div>
          </div>

          {numero ? (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Número do Assessor
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-bold text-slate-900 font-mono">{formatNumber(numero)}</div>
                  <button
                    onClick={() => copy(numero)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {whatsLink && (
                <a
                  href={whatsLink}
                  target="_blank"
                  rel="noopener"
                  className="w-full bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  💬 Abrir conversa no WhatsApp
                </a>
              )}

              <ol className="text-sm text-slate-700 space-y-3 mt-6 border-t border-slate-100 pt-5">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Salve o número acima no seu celular como <strong>"Meu Assessor"</strong>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Mande <strong>"olá"</strong> pra começar — eu reconheço você pelo seu número.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>Use texto ou áudio — eu entendo as duas formas. 🎤</span>
                </li>
              </ol>
            </>
          ) : (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
              <div className="font-semibold text-slate-900 mb-1">Assessor ainda não configurado</div>
              <p className="text-sm text-slate-500">
                O administrador precisa conectar o número da empresa primeiro.
              </p>
            </div>
          )}
        </div>

        {/* Lado direito: seu número + exemplos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#f1f1f3] rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Seu número cadastrado
            </div>
            <div className="font-mono text-slate-900 font-semibold">
              {me.whatsapp ? formatNumber(me.whatsapp) : '—'}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Mensagens deste número são identificadas como suas automaticamente.
            </p>
          </div>

          <div className="bg-white border border-[#f1f1f3] rounded-2xl p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Exemplos do que você pode pedir</h3>
            <div className="space-y-2">
              <Exemplo emoji="💸" texto='"gastei 50 no mercado"' />
              <Exemplo emoji="💸" texto='"pix de 30 no uber"' />
              <Exemplo emoji="💰" texto='"recebi 3000 do cliente atto"' />
              <Exemplo emoji="📅" texto='"marca reunião amanhã 15h"' />
              <Exemplo emoji="📝" texto='"anota: ideia de site novo"' />
              <Exemplo emoji="📊" texto='"resumo"' />
              <Exemplo emoji="📅" texto='"agenda"' />
              <Exemplo emoji="❓" texto='"ajuda"' />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Exemplo({ emoji, texto }: { emoji: string; texto: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{emoji}</span>
      <span className="text-slate-600 italic">{texto}</span>
    </div>
  );
}

function formatNumber(e164: string): string {
  const d = e164.replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('55')) {
    return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  if (d.length === 12 && d.startsWith('55')) {
    return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 8)}-${d.slice(8)}`;
  }
  return e164;
}
