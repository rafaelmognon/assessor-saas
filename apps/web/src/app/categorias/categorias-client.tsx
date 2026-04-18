'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/modal';
import { fmtMoney } from '@/lib/format';
import {
  createCategoriaAction,
  updateCategoriaAction,
  deleteCategoriaAction,
} from '@/lib/crud-actions';

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  tipo: 'SAIDA' | 'ENTRADA';
  metaMensal: string | null;
}

const ICONES = ['🛒','🍔','🍕','☕','🚗','⛽','✈️','🏠','💡','💧','🎬','🎮','🎵','📚','💊','🏥','💪','👕','👟','💇','🎁','🐶','🌱','✂️','🔧','📱','💻','🎓','👶','💼','💰','📈','💸','🧾','🎉','🍻','🏖️','🎂','❤️','🛠️'];

const CORES = [
  { v: 'indigo', cls: 'bg-indigo-500' },
  { v: 'purple', cls: 'bg-purple-500' },
  { v: 'pink', cls: 'bg-pink-500' },
  { v: 'rose', cls: 'bg-rose-500' },
  { v: 'orange', cls: 'bg-orange-500' },
  { v: 'amber', cls: 'bg-amber-500' },
  { v: 'emerald', cls: 'bg-emerald-500' },
  { v: 'teal', cls: 'bg-teal-500' },
  { v: 'cyan', cls: 'bg-cyan-500' },
  { v: 'blue', cls: 'bg-blue-500' },
  { v: 'slate', cls: 'bg-slate-500' },
];

const COR_BG: Record<string, string> = {
  indigo: 'bg-indigo-50', purple: 'bg-purple-50', pink: 'bg-pink-50',
  rose: 'bg-rose-50', orange: 'bg-orange-50', amber: 'bg-amber-50',
  emerald: 'bg-emerald-50', teal: 'bg-teal-50', cyan: 'bg-cyan-50',
  blue: 'bg-blue-50', slate: 'bg-slate-100',
};

export function CategoriasClient({ categorias }: { categorias: Categoria[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [filtro, setFiltro] = useState<'TODAS' | 'SAIDA' | 'ENTRADA'>('TODAS');
  const [pending, start] = useTransition();

  const filtradas = categorias.filter((c) => filtro === 'TODAS' || c.tipo === filtro);

  function onEdit(c: Categoria) {
    setEditing(c);
    setOpen(true);
  }
  function onNova() {
    setEditing(null);
    setOpen(true);
  }
  function onClose() {
    setOpen(false);
    setEditing(null);
  }
  function onDelete(id: string) {
    if (!confirm('Excluir esta categoria?')) return;
    start(async () => {
      await deleteCategoriaAction(id);
    });
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Minhas Categorias</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre categorias para classificar suas transações automaticamente.
          </p>
        </div>
        <button
          onClick={onNova}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nova categoria
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
          {(['TODAS', 'SAIDA', 'ENTRADA'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={
                filtro === f
                  ? 'px-4 py-1.5 text-xs bg-white rounded-md shadow-sm font-semibold'
                  : 'px-4 py-1.5 text-xs text-slate-600'
              }
            >
              {f === 'TODAS' ? 'Todas' : f === 'SAIDA' ? 'Saídas' : 'Entradas'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtradas.length === 0 ? (
        <div className="bg-white border border-[#f1f1f3] rounded-2xl p-12 text-center text-slate-400">
          <div className="text-5xl mb-3">🏷️</div>
          <p className="text-sm">Nenhuma categoria. Crie a primeira com "Nova categoria".</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtradas.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-[#f1f1f3] rounded-2xl p-5 group cursor-pointer hover:shadow-md transition relative"
              onClick={() => onEdit(c)}
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex gap-1 bg-white/80 rounded-lg p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(c);
                  }}
                  className="text-slate-400 hover:text-indigo-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl ${COR_BG[c.cor] ?? 'bg-slate-100'} flex items-center justify-center text-2xl`}>
                  {c.icone}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{c.nome}</div>
                  <div className={`text-[11px] font-medium uppercase tracking-wider ${c.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {c.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                  </div>
                </div>
              </div>

              {c.metaMensal ? (
                <div className="text-xs text-slate-500">
                  Meta: <span className="text-slate-900 font-semibold">{fmtMoney(c.metaMensal)}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400">Sem meta</div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={onClose} title={editing ? 'Editar categoria' : 'Nova categoria'}>
        <CategoriaForm categoria={editing} onSuccess={onClose} />
      </Modal>
    </>
  );
}

function CategoriaForm({
  categoria,
  onSuccess,
}: {
  categoria: Categoria | null;
  onSuccess: () => void;
}) {
  const [tipo, setTipo] = useState<'SAIDA' | 'ENTRADA'>(categoria?.tipo ?? 'SAIDA');
  const [icone, setIcone] = useState(categoria?.icone ?? '🛒');
  const [cor, setCor] = useState(categoria?.cor ?? 'indigo');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(formData: FormData) {
    setError(null);
    const payload: any = {
      nome: String(formData.get('nome') || '').trim(),
      tipo,
      icone,
      cor,
      metaMensal: formData.get('metaMensal') ? Number(formData.get('metaMensal')) : undefined,
    };

    start(async () => {
      const res = categoria
        ? await updateCategoriaAction(categoria.id, payload)
        : await createCategoriaAction(payload);
      if (res.ok) onSuccess();
      else setError(res.error || 'Erro');
    });
  }

  return (
    <form action={handle} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Nome *</label>
        <input
          name="nome"
          required
          defaultValue={categoria?.nome}
          placeholder="Ex: Pets, Educação, Viagem..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Tipo *</label>
        <div className="grid grid-cols-2 gap-2">
          {(['SAIDA', 'ENTRADA'] as const).map((t) => (
            <label
              key={t}
              className={
                tipo === t
                  ? `flex items-center justify-center gap-2 border-2 rounded-lg py-2.5 cursor-pointer ${t === 'SAIDA' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'}`
                  : 'flex items-center justify-center gap-2 border-2 border-slate-200 rounded-lg py-2.5 cursor-pointer'
              }
            >
              <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)} className="hidden" />
              <span>{t === 'SAIDA' ? '💸' : '💰'}</span>
              <span className="text-sm font-medium">{t === 'SAIDA' ? 'Saída' : 'Entrada'}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Ícone</label>
        <div className="grid grid-cols-10 gap-1 p-2 border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
          {ICONES.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcone(i)}
              className={
                icone === i
                  ? 'w-8 h-8 rounded bg-indigo-100 ring-2 ring-indigo-500 flex items-center justify-center text-lg'
                  : 'w-8 h-8 rounded hover:bg-indigo-50 flex items-center justify-center text-lg'
              }
            >
              {i}
            </button>
          ))}
        </div>
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

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Meta mensal (opcional)</label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
          <input
            name="metaMensal"
            type="number"
            step="0.01"
            min="0"
            defaultValue={categoria?.metaMensal ?? ''}
            placeholder="0,00"
            className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Alerta no WhatsApp ao atingir 80%.</p>
      </div>

      {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
