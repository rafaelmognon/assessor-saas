'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, Trash2, Calendar as CalIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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
  { v: 'indigo', cls: 'bg-indigo-500', light: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { v: 'purple', cls: 'bg-purple-500', light: 'bg-purple-100 text-purple-800 border-purple-300' },
  { v: 'pink', cls: 'bg-pink-500', light: 'bg-pink-100 text-pink-800 border-pink-300' },
  { v: 'rose', cls: 'bg-rose-500', light: 'bg-rose-100 text-rose-800 border-rose-300' },
  { v: 'orange', cls: 'bg-orange-500', light: 'bg-orange-100 text-orange-800 border-orange-300' },
  { v: 'amber', cls: 'bg-amber-500', light: 'bg-amber-100 text-amber-800 border-amber-300' },
  { v: 'emerald', cls: 'bg-emerald-500', light: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { v: 'teal', cls: 'bg-teal-500', light: 'bg-teal-100 text-teal-800 border-teal-300' },
  { v: 'blue', cls: 'bg-blue-500', light: 'bg-blue-100 text-blue-800 border-blue-300' },
];

const CORES_MAP = Object.fromEntries(CORES.map((c) => [c.v, c]));

type View = 'mes' | 'semana' | 'lista';

export function CompromissosClient({ compromissos }: { compromissos: Compromisso[] }) {
  const [view, setView] = useState<View>('mes');
  const [refDate, setRefDate] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [novoCompromissoData, setNovoCompromissoData] = useState<Date | null>(null);
  const [pending, start] = useTransition();

  function onDelete(id: string) {
    if (!confirm('Excluir este compromisso?')) return;
    start(async () => {
      await deleteCompromissoAction(id);
    });
  }

  function abrirNovo(data?: Date) {
    setNovoCompromissoData(data ?? null);
    setOpen(true);
  }

  function navegar(delta: number) {
    const d = new Date(refDate);
    if (view === 'mes') d.setMonth(d.getMonth() + delta);
    else if (view === 'semana') d.setDate(d.getDate() + 7 * delta);
    setRefDate(d);
  }

  const tituloPeriodo = useMemo(() => {
    if (view === 'mes') {
      return refDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    if (view === 'semana') {
      const inicio = inicioSemana(refDate);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6);
      return `${inicio.getDate()} ${inicio.toLocaleDateString('pt-BR', { month: 'short' })} - ${fim.getDate()} ${fim.toLocaleDateString('pt-BR', { month: 'short' })}`;
    }
    return 'Próximos compromissos';
  }, [view, refDate]);

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500 mt-1">
            {compromissos.length} compromissos no total
          </p>
        </div>
        <button
          onClick={() => abrirNovo()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo compromisso
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {view !== 'lista' && (
            <>
              <button
                onClick={() => navegar(-1)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold text-slate-900 capitalize min-w-[180px]">
                {tituloPeriodo}
              </h2>
              <button
                onClick={() => navegar(1)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setRefDate(new Date())}
                className="text-xs px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50"
              >
                Hoje
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
          {(['mes', 'semana', 'lista'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={
                view === v
                  ? 'px-4 py-1.5 text-xs bg-white rounded-md shadow-sm font-semibold capitalize'
                  : 'px-4 py-1.5 text-xs text-slate-600 capitalize'
              }
            >
              {v === 'mes' ? 'Mês' : v === 'semana' ? 'Semana' : 'Lista'}
            </button>
          ))}
        </div>
      </div>

      {view === 'mes' && (
        <CalendarioMes
          refDate={refDate}
          compromissos={compromissos}
          onClickDia={(d) => abrirNovo(d)}
          onDelete={onDelete}
        />
      )}

      {view === 'semana' && (
        <CalendarioSemana
          refDate={refDate}
          compromissos={compromissos}
          onClickDia={(d) => abrirNovo(d)}
          onDelete={onDelete}
        />
      )}

      {view === 'lista' && <ListaAgrupada compromissos={compromissos} onDelete={onDelete} pending={pending} />}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo compromisso">
        <CompromissoForm dataInicial={novoCompromissoData} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// VISÃO MÊS — grid clássico 7×6
// ─────────────────────────────────────────────────────────
function CalendarioMes({
  refDate,
  compromissos,
  onClickDia,
  onDelete,
}: {
  refDate: Date;
  compromissos: Compromisso[];
  onClickDia: (d: Date) => void;
  onDelete: (id: string) => void;
}) {
  const dias = montarMatrizMes(refDate);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const porDia = useMemo(() => {
    const m = new Map<string, Compromisso[]>();
    compromissos.forEach((c) => {
      const key = isoDay(new Date(c.inicio));
      const arr = m.get(key) ?? [];
      arr.push(c);
      m.set(key, arr);
    });
    // ordena por hora dentro de cada dia
    m.forEach((arr) => arr.sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()));
    return m;
  }, [compromissos]);

  return (
    <div className="bg-white border border-[#f1f1f3] rounded-2xl overflow-hidden">
      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <div key={d} className="text-[11px] font-semibold text-slate-500 uppercase text-center py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grid 6 semanas */}
      <div className="grid grid-cols-7" style={{ gridAutoRows: 'minmax(110px, 1fr)' }}>
        {dias.map((d, idx) => {
          const isHoje = d.data.getTime() === hoje.getTime();
          const isMes = d.data.getMonth() === refDate.getMonth();
          const items = porDia.get(isoDay(d.data)) ?? [];
          return (
            <div
              key={idx}
              className={`relative border-r border-b border-slate-100 p-1.5 group cursor-pointer hover:bg-slate-50 transition ${
                !isMes ? 'bg-slate-50/40' : ''
              }`}
              onClick={() => onClickDia(d.data)}
            >
              <div className="flex items-center justify-between mb-1">
                <div
                  className={
                    isHoje
                      ? 'w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center'
                      : `text-xs font-medium ${isMes ? 'text-slate-700' : 'text-slate-400'}`
                  }
                >
                  {d.data.getDate()}
                </div>
                {items.length > 3 && (
                  <span className="text-[10px] text-slate-500">+{items.length - 3}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((c) => {
                  const cor = CORES_MAP[c.cor] ?? CORES_MAP.indigo;
                  return (
                    <div
                      key={c.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Excluir "${c.titulo}"?`)) onDelete(c.id);
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${cor.light} truncate cursor-pointer hover:opacity-80`}
                      title={`${fmtTime(c.inicio)} ${c.titulo}${c.local ? ' · ' + c.local : ''}`}
                    >
                      <span className="font-medium">{fmtTime(c.inicio)}</span> {c.titulo}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VISÃO SEMANA — colunas com horas
// ─────────────────────────────────────────────────────────
function CalendarioSemana({
  refDate,
  compromissos,
  onClickDia,
  onDelete,
}: {
  refDate: Date;
  compromissos: Compromisso[];
  onClickDia: (d: Date) => void;
  onDelete: (id: string) => void;
}) {
  const inicio = inicioSemana(refDate);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    return d;
  });
  const horas = Array.from({ length: 13 }, (_, i) => i + 7); // 7h às 19h
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const porDia = useMemo(() => {
    const m = new Map<string, Compromisso[]>();
    compromissos.forEach((c) => {
      const key = isoDay(new Date(c.inicio));
      const arr = m.get(key) ?? [];
      arr.push(c);
      m.set(key, arr);
    });
    return m;
  }, [compromissos]);

  return (
    <div className="bg-white border border-[#f1f1f3] rounded-2xl overflow-hidden">
      {/* Cabeçalho dos dias */}
      <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
        <div />
        {dias.map((d) => {
          const isHoje = d.getTime() === hoje.getTime();
          return (
            <div key={d.toISOString()} className="text-center py-3 border-l border-slate-100">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
              </div>
              <div
                className={
                  isHoje
                    ? 'w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center mx-auto mt-0.5'
                    : 'text-base font-semibold text-slate-900 mt-0.5'
                }
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de horas */}
      <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
        {horas.map((h) => (
          <div
            key={h}
            className="grid border-b border-slate-50"
            style={{ gridTemplateColumns: '60px repeat(7, 1fr)', minHeight: '60px' }}
          >
            <div className="text-[10px] text-slate-400 text-right pr-2 pt-1">
              {String(h).padStart(2, '0')}:00
            </div>
            {dias.map((d) => {
              const items = (porDia.get(isoDay(d)) ?? []).filter((c) => {
                const hr = new Date(c.inicio).getHours();
                return hr === h;
              });
              const dHora = new Date(d);
              dHora.setHours(h, 0, 0, 0);
              return (
                <div
                  key={`${d.toISOString()}-${h}`}
                  onClick={() => onClickDia(dHora)}
                  className="border-l border-slate-100 relative cursor-pointer hover:bg-slate-50 p-1 space-y-0.5"
                >
                  {items.map((c) => {
                    const cor = CORES_MAP[c.cor] ?? CORES_MAP.indigo;
                    return (
                      <div
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Excluir "${c.titulo}"?`)) onDelete(c.id);
                        }}
                        className={`text-[10px] px-1.5 py-1 rounded border ${cor.light} cursor-pointer hover:opacity-80`}
                      >
                        <div className="font-semibold">{fmtTime(c.inicio)}</div>
                        <div className="truncate">{c.titulo}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VISÃO LISTA (a anterior)
// ─────────────────────────────────────────────────────────
function ListaAgrupada({
  compromissos,
  onDelete,
  pending,
}: {
  compromissos: Compromisso[];
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const grupos = useMemo(() => {
    const por: Record<string, Compromisso[]> = {};
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    compromissos
      .filter((c) => new Date(c.inicio) >= hoje)
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
      .forEach((c) => {
        const k = isoDay(new Date(c.inicio));
        (por[k] ??= []).push(c);
      });
    return por;
  }, [compromissos]);

  if (Object.keys(grupos).length === 0) {
    return (
      <div className="bg-white border border-[#f1f1f3] rounded-2xl p-12 text-center text-slate-400">
        <CalIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nenhum compromisso futuro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grupos).map(([dia, items]) => (
        <div key={dia}>
          <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
            {labelDia(dia)}
          </h3>
          <div className="space-y-2">
            {items.map((c) => {
              const cor = CORES_MAP[c.cor] ?? CORES_MAP.indigo;
              return (
                <div
                  key={c.id}
                  className="bg-white border border-[#f1f1f3] rounded-2xl p-4 flex items-center gap-4 group"
                >
                  <div className={`w-1 self-stretch rounded-full ${cor.cls}`} />
                  <div className="text-sm font-semibold text-slate-700 w-24">
                    {c.diaInteiro
                      ? 'Dia todo'
                      : `${fmtTime(c.inicio)}${c.fim ? ` — ${fmtTime(c.fim)}` : ''}`}
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
  );
}

// ─────────────────────────────────────────────────────────
// FORM
// ─────────────────────────────────────────────────────────
function CompromissoForm({
  dataInicial,
  onSuccess,
}: {
  dataInicial: Date | null;
  onSuccess: () => void;
}) {
  const [cor, setCor] = useState('indigo');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const dataDefault = (dataInicial ?? new Date()).toISOString().slice(0, 10);
  const horaDefault = dataInicial
    ? `${String(dataInicial.getHours()).padStart(2, '0')}:00`
    : '09:00';

  function handle(formData: FormData) {
    setError(null);
    const dataStr = String(formData.get('data') || '');
    const horaInicio = String(formData.get('horaInicio') || '');
    const horaFim = String(formData.get('horaFim') || '');
    const inicio = new Date(`${dataStr}T${horaInicio || '09:00'}:00`).toISOString();
    const fim = horaFim ? new Date(`${dataStr}T${horaFim}:00`).toISOString() : undefined;

    const payload: any = {
      titulo: String(formData.get('titulo') || '').trim(),
      local: String(formData.get('local') || '').trim() || undefined,
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
            defaultValue={dataDefault}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Início *</label>
          <input
            name="horaInicio"
            type="time"
            required
            defaultValue={horaDefault}
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

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function inicioSemana(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - r.getDay()); // domingo
  return r;
}

function montarMatrizMes(refDate: Date): Array<{ data: Date }> {
  const inicioMes = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
  const inicio = inicioSemana(inicioMes);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    return { data: d };
  });
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
