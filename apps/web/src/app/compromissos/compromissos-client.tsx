'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { Modal } from '@/components/modal';
import {
  createCompromissoAction,
  deleteCompromissoAction,
} from '@/lib/crud-actions';

interface Compromisso {
  id: string;
  titulo: string;
  descricao: string | null;
  local: string | null;
  inicio: string;
  fim: string | null;
  diaInteiro: boolean;
  cor: string;
  origem: string;
}

const CORES = [
  { v: 'indigo', cls: 'bg-indigo-500' },
  { v: 'purple', cls: 'bg-purple-500' },
  { v: 'pink', cls: 'bg-pink-500' },
  { v: 'rose', cls: 'bg-rose-500' },
  { v: 'orange', cls: 'bg-orange-500' },
  { v: 'amber', cls: 'bg-amber-500' },
  { v: 'emerald', cls: 'bg-emerald-500' },
  { v: 'teal', cls: 'bg-teal-500' },
  { v: 'blue', cls: 'bg-blue-500' },
];

export function CompromissosClient({ compromissos }: { compromissos: Compromisso[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const grupos = useMemo(() => {
    const por: Record<string, Compromisso[]> = {};
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    compromissos
      .filter((c) => new Date(c.inicio) >= hoje)
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
      .forEach((c) => {
        const d = new Date(c.inicio);
        const k = d.toISOString().slice(0, 10);
        (por[k] ??= []).push(c);
      });
    return por;
  }, [compromissos]);

  function onDelete(id: string) {
    if (!confirm('Excluir este compromisso?')) return;
    start(async () => {
      await deleteCompromissoAction(id);
    });
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500 mt-1">Próximos compromissos</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo compromisso
        </button>
      </div>

      {Object.keys(grupos).length === 0 ? (
        <div className="bg-white border border-[#f1f1f3] rounded-2xl p-12 text-center text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum compromisso futuro. Use "Novo compromisso" ou peça pelo WhatsApp.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grupos).map(([dia, items]) => (
            <div key={dia}>
              <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                {labelDia(dia)}
              </h3>
              <div className="space-y-2">
                {items.map((c) => {
                  const corCls = CORES.find((x) => x.v === c.cor)?.cls ?? 'bg-indigo-500';
                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-[#f1f1f3] rounded-2xl p-4 flex items-center gap-4 group"
                    >
                      <div className={`w-1 self-stretch rounded-full ${corCls}`} />
                      <div className="text-sm font-semibold text-slate-700 w-24">
                        {c.diaInteiro ? 'Dia todo' : `${fmtTime(c.inicio)}${c.fim ? ` — ${fmtTime(c.fim)}` : ''}`}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{c.titulo}</div>
                        {c.local && <div className="text-xs text-slate-500">{c.local}</div>}
                      </div>
                      <button
                        onClick={() => onDelete(c.id)}
                        disabled={pending}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo compromisso">
        <CompromissoForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function CompromissoForm({ onSuccess }: { onSuccess: () => void }) {
  const [cor, setCor] = useState('indigo');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(formData: FormData) {
    setError(null);
    const dataStr = String(formData.get('data') || '');
    const horaInicio = String(formData.get('horaInicio') || '');
    const horaFim = String(formData.get('horaFim') || '');
    const inicio = new Date(`${dataStr}T${horaInicio || '09:00'}`).toISOString();
    const fim = horaFim ? new Date(`${dataStr}T${horaFim}`).toISOString() : undefined;

    const payload: any = {
      titulo: String(formData.get('titulo') || '').trim(),
      local: String(formData.get('local') || '').trim() || undefined,
      descricao: String(formData.get('descricao') || '').trim() || undefined,
      inicio,
      fim,
      cor,
    };

    start(async () => {
      const res = await createCompromissoAction(payload);
      if (res.ok) onSuccess();
      else setError(res.error || 'Erro');
    });
  }

  return (
    <form action={handle} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Título *</label>
        <input
          name="titulo"
          required
          placeholder="Ex: Reunião com cliente"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Data *</label>
          <input
            name="data"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Início *</label>
          <input
            name="horaInicio"
            type="time"
            required
            defaultValue="09:00"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Fim</label>
          <input
            name="horaFim"
            type="time"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Local</label>
        <input
          name="local"
          placeholder="Ex: Google Meet, Escritório..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Cor</label>
        <div className="flex gap-2 flex-wrap">
          {CORES.map((c) => (
            <button
              key={c.v}
              type="button"
              onClick={() => setCor(c.v)}
              className={
                cor === c.v
                  ? `w-8 h-8 rounded-full ${c.cls} ring-2 ring-offset-2 ring-slate-900`
                  : `w-8 h-8 rounded-full ${c.cls}`
              }
            />
          ))}
        </div>
      </div>

      {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}

function labelDia(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diff = (d.getTime() - hoje.getTime()) / 86400e3;
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
