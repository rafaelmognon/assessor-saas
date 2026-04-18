'use client';

import { useMemo, useState, useTransition } from 'react';
import { Pin, PinOff, Trash2, Search } from 'lucide-react';
import { fmtRelative } from '@/lib/format';
import {
  createNotaAction,
  updateNotaAction,
  deleteNotaAction,
} from '@/lib/crud-actions';

interface Nota {
  id: string;
  titulo: string | null;
  conteudo: string;
  tag: 'IDEIA' | 'INSIGHT' | 'LEMBRETE' | 'META' | 'REFERENCIA' | 'PERGUNTA';
  fixada: boolean;
  origem: string;
  createdAt: string;
}

const TAGS = {
  IDEIA: { label: 'Ideia', emoji: '💡', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  INSIGHT: { label: 'Insight', emoji: '✨', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  LEMBRETE: { label: 'Lembrete', emoji: '📝', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  META: { label: 'Meta', emoji: '🎯', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  REFERENCIA: { label: 'Referência', emoji: '📚', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  PERGUNTA: { label: 'Pergunta', emoji: '❓', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
};

const ORIGEM_LABEL: Record<string, string> = {
  WHATSAPP_TEXTO: '💬 WhatsApp',
  WHATSAPP_AUDIO: '🎤 WhatsApp',
  MANUAL: '✏️ Manual',
};

type TagKey = keyof typeof TAGS;

export function NotasClient({ notas }: { notas: Nota[] }) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'TODAS' | TagKey>('TODAS');
  const [pending, start] = useTransition();

  const filtradas = useMemo(() => {
    return notas
      .filter((n) => {
        if (filtro !== 'TODAS' && n.tag !== filtro) return false;
        if (busca) {
          const q = busca.toLowerCase();
          if (!(n.titulo?.toLowerCase().includes(q) ?? false) && !n.conteudo.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => Number(b.fixada) - Number(a.fixada));
  }, [notas, filtro, busca]);

  function onPin(n: Nota) {
    start(async () => {
      await updateNotaAction(n.id, { fixada: !n.fixada });
    });
  }
  function onDelete(id: string) {
    if (!confirm('Excluir esta nota?')) return;
    start(async () => {
      await deleteNotaAction(id);
    });
  }

  const fixadas = filtradas.filter((n) => n.fixada);
  const normais = filtradas.filter((n) => !n.fixada);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notas & Insights</h1>
          <p className="text-sm text-slate-500 mt-1">
            Capture ideias, lembretes e reflexões — sem compromisso com agenda.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2 w-4 h-4 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nota..."
            className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Quick capture */}
      <QuickCapture />

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap mt-6 mb-4">
        <button
          onClick={() => setFiltro('TODAS')}
          className={
            filtro === 'TODAS'
              ? 'text-xs px-3 py-1.5 rounded-full border bg-slate-900 text-white border-slate-900'
              : 'text-xs px-3 py-1.5 rounded-full border bg-white border-slate-200 hover:bg-slate-50'
          }
        >
          Todas <span className="opacity-60 ml-1">{notas.length}</span>
        </button>
        {(Object.keys(TAGS) as TagKey[]).map((k) => {
          const t = TAGS[k];
          const count = notas.filter((n) => n.tag === k).length;
          return (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              className={
                filtro === k
                  ? `text-xs px-3 py-1.5 rounded-full border ${t.bg} ${t.text} ${t.border}`
                  : 'text-xs px-3 py-1.5 rounded-full border bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }
            >
              {t.emoji} {t.label} <span className="opacity-60 ml-1">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Fixadas */}
      {fixadas.length > 0 && (
        <>
          <div className="text-xs uppercase font-semibold text-slate-500 mb-3 mt-6">📌 Fixadas</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {fixadas.map((n) => (
              <NotaCard key={n.id} n={n} onPin={onPin} onDelete={onDelete} />
            ))}
          </div>
        </>
      )}

      {/* Outras */}
      {normais.length > 0 && (
        <>
          {fixadas.length > 0 && (
            <div className="text-xs uppercase font-semibold text-slate-500 mb-3">Todas as notas</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {normais.map((n) => (
              <NotaCard key={n.id} n={n} onPin={onPin} onDelete={onDelete} />
            ))}
          </div>
        </>
      )}

      {filtradas.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">💭</div>
          <p className="text-sm">Nenhuma nota encontrada.</p>
        </div>
      )}
    </>
  );
}

function NotaCard({ n, onPin, onDelete }: { n: Nota; onPin: (n: Nota) => void; onDelete: (id: string) => void }) {
  const t = TAGS[n.tag];
  return (
    <div className={`${t.bg} ${t.border} border rounded-xl p-4 group`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${t.text} bg-white/60 px-2 py-0.5 rounded-full`}>
          {t.emoji} {t.label}
        </span>
        <div className="opacity-0 group-hover:opacity-100 transition flex gap-0.5">
          <button onClick={() => onPin(n)} className="p-1 hover:bg-white/60 rounded text-slate-600">
            {n.fixada ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onDelete(n.id)} className="p-1 hover:bg-white/60 rounded text-slate-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {n.titulo && <h3 className="font-semibold text-slate-900 mb-1.5 leading-snug">{n.titulo}</h3>}
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{n.conteudo}</p>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/60 text-[11px] text-slate-500">
        <span>{fmtRelative(n.createdAt)}</span>
        <span>{ORIGEM_LABEL[n.origem] ?? '✏️ Manual'}</span>
      </div>
    </div>
  );
}

function QuickCapture() {
  const [tag, setTag] = useState<TagKey>('IDEIA');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(formData: FormData) {
    const conteudo = String(formData.get('conteudo') || '').trim();
    if (!conteudo) {
      setError('Escreva alguma coisa');
      return;
    }
    setError(null);
    const payload: any = {
      titulo: String(formData.get('titulo') || '').trim() || undefined,
      conteudo,
      tag,
    };
    start(async () => {
      const res = await createNotaAction(payload);
      if (res.ok) {
        const form = document.getElementById('quick-capture') as HTMLFormElement;
        form?.reset();
      } else {
        setError(res.error || 'Erro');
      }
    });
  }

  return (
    <form id="quick-capture" action={handle} className="bg-white border border-[#f1f1f3] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✍️</span>
        <input
          name="titulo"
          placeholder="Título (opcional)"
          className="flex-1 text-base font-semibold focus:outline-none placeholder:text-slate-400"
        />
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value as TagKey)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50"
        >
          {(Object.keys(TAGS) as TagKey[]).map((k) => (
            <option key={k} value={k}>
              {TAGS[k].emoji} {TAGS[k].label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="conteudo"
        rows={2}
        placeholder="O que você quer lembrar?"
        className="w-full text-sm text-slate-700 resize-none focus:outline-none placeholder:text-slate-400"
      />
      {error && <div className="text-sm text-rose-600 mb-2">{error}</div>}
      <div className="flex items-center justify-end pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={pending}
          className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
        >
          {pending ? 'Salvando...' : 'Salvar nota'}
        </button>
      </div>
    </form>
  );
}
