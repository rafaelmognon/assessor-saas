'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/modal';
import { fmtMoney } from '@/lib/format';
import { createCartaoAction, updateCartaoAction, deleteCartaoAction } from '@/lib/crud-actions';

interface Cartao {
  id: string;
  apelido: string;
  tipo: string;
  bandeira: string;
  ultimos4: string;
  cor: string;
  limite: string | null;
  faturaAberta: string | number;
  diaFecha: number | null;
  diaVence: number | null;
}

const BANDEIRAS = [
  { v: 'VISA', label: 'Visa' },
  { v: 'MASTERCARD', label: 'Master' },
  { v: 'ELO', label: 'Elo' },
  { v: 'AMEX', label: 'Amex' },
  { v: 'HIPERCARD', label: 'Hiper' },
  { v: 'OUTRA', label: 'Outra' },
];

const CORES_CARTAO = [
  { v: 'violet-purple', cls: 'from-violet-600 to-purple-700' },
  { v: 'orange-amber', cls: 'from-orange-500 to-amber-600' },
  { v: 'blue-cyan', cls: 'from-blue-600 to-cyan-600' },
  { v: 'emerald-teal', cls: 'from-emerald-600 to-teal-700' },
  { v: 'rose-pink', cls: 'from-rose-600 to-pink-700' },
  { v: 'slate-zinc', cls: 'from-slate-700 to-zinc-900' },
];

const GRADIENTES: Record<string, string> = Object.fromEntries(
  CORES_CARTAO.map((c) => [c.v, c.cls]),
);

export function CartoesClient({ cartoes }: { cartoes: Cartao[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cartao | null>(null);
  const [pending, start] = useTransition();

  function onEdit(c: Cartao) {
    setEditing(c);
    setOpen(true);
  }
  function onClose() {
    setOpen(false);
    setEditing(null);
  }
  function onDelete(id: string) {
    if (!confirm('Excluir este cartão?')) return;
    start(async () => {
      await deleteCartaoAction(id);
    });
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Meus Cartões</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre seus cartões para identificar gastos automaticamente.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo cartão
        </button>
      </div>

      {cartoes.length === 0 ? (
        <div className="bg-white border border-[#f1f1f3] rounded-2xl p-12 text-center text-slate-400">
          <div className="text-5xl mb-3">💳</div>
          <p className="text-sm">Nenhum cartão. Cadastre o primeiro com "Novo cartão".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cartoes.map((c) => {
            const grad = GRADIENTES[c.cor] ?? GRADIENTES['violet-purple'];
            const limite = Number(c.limite ?? 0);
            const fatura = Number(c.faturaAberta);
            const pct = limite > 0 ? Math.min(100, Math.round((fatura / limite) * 100)) : 0;

            return (
              <div
                key={c.id}
                className={`relative rounded-xl p-4 bg-gradient-to-br ${grad} text-white overflow-hidden group`}
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -right-10 bottom-0 w-28 h-28 bg-white/5 rounded-full" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider opacity-70">{c.tipo}</div>
                      <div className="text-base font-semibold">{c.apelido}</div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                      <button
                        onClick={() => onEdit(c)}
                        className="p-1 bg-white/20 backdrop-blur rounded hover:bg-white/30"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(c.id)}
                        className="p-1 bg-white/20 backdrop-blur rounded hover:bg-white/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="font-mono text-sm tracking-widest opacity-90 mb-3">
                    •••• •••• •••• {c.ultimos4}
                  </div>

                  {limite > 0 && (
                    <div className="bg-white/15 backdrop-blur rounded-lg p-2.5 mb-2">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="opacity-80">Fatura atual</span>
                        <span className="font-semibold">{pct}%</span>
                      </div>
                      <div className="text-sm font-bold">
                        {fmtMoney(fatura)}{' '}
                        <span className="text-[10px] opacity-70 font-normal">de {fmtMoney(limite)}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-1 mt-1.5">
                        <div className="bg-white h-1 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  {(c.diaFecha || c.diaVence) && (
                    <div className="flex gap-2 text-[10px]">
                      {c.diaFecha && (
                        <div className="bg-white/10 rounded px-2 py-1">
                          <span className="opacity-70">Fecha</span> <b>dia {c.diaFecha}</b>
                        </div>
                      )}
                      {c.diaVence && (
                        <div className="bg-white/10 rounded px-2 py-1">
                          <span className="opacity-70">Vence</span> <b>dia {c.diaVence}</b>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={onClose} title={editing ? 'Editar cartão' : 'Novo cartão'}>
        <CartaoForm cartao={editing} onSuccess={onClose} />
      </Modal>
    </>
  );
}

function CartaoForm({ cartao, onSuccess }: { cartao: Cartao | null; onSuccess: () => void }) {
  const [bandeira, setBandeira] = useState(cartao?.bandeira ?? 'VISA');
  const [cor, setCor] = useState(cartao?.cor ?? 'violet-purple');
  const [tipo, setTipo] = useState(cartao?.tipo ?? 'CREDITO');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(formData: FormData) {
    setError(null);
    const payload: any = {
      apelido: String(formData.get('apelido') || '').trim(),
      tipo,
      bandeira,
      ultimos4: String(formData.get('ultimos4') || ''),
      cor,
      limite: formData.get('limite') ? Number(formData.get('limite')) : undefined,
      diaFecha: formData.get('diaFecha') ? Number(formData.get('diaFecha')) : undefined,
      diaVence: formData.get('diaVence') ? Number(formData.get('diaVence')) : undefined,
    };

    start(async () => {
      const res = cartao
        ? await updateCartaoAction(cartao.id, payload)
        : await createCartaoAction(payload);
      if (res.ok) onSuccess();
      else setError(res.error || 'Erro');
    });
  }

  return (
    <form action={handle} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Apelido *</label>
        <input
          name="apelido"
          required
          defaultValue={cartao?.apelido}
          placeholder="Ex: Nubank, Itaú Platinum..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Tipo *</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="CREDITO">Crédito</option>
            <option value="DEBITO">Débito</option>
            <option value="AMBOS">Crédito + Débito</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Final (4 dígitos) *</label>
          <input
            name="ultimos4"
            required
            maxLength={4}
            pattern="[0-9]{4}"
            defaultValue={cartao?.ultimos4}
            placeholder="4532"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Bandeira</label>
        <div className="grid grid-cols-3 gap-2">
          {BANDEIRAS.map((b) => (
            <button
              key={b.v}
              type="button"
              onClick={() => setBandeira(b.v)}
              className={
                bandeira === b.v
                  ? 'text-xs py-2 border-2 border-indigo-500 bg-indigo-50 text-indigo-700 rounded-lg font-semibold'
                  : 'text-xs py-2 border-2 border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50'
              }
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Cor</label>
        <div className="grid grid-cols-6 gap-2">
          {CORES_CARTAO.map((c) => (
            <button
              key={c.v}
              type="button"
              onClick={() => setCor(c.v)}
              className={
                cor === c.v
                  ? `h-10 rounded-lg bg-gradient-to-br ${c.cls} ring-2 ring-offset-2 ring-slate-900`
                  : `h-10 rounded-lg bg-gradient-to-br ${c.cls}`
              }
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Limite</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 text-xs">R$</span>
            <input
              name="limite"
              type="number"
              step="0.01"
              min="0"
              defaultValue={cartao?.limite ?? ''}
              placeholder="5000"
              className="w-full border border-slate-200 rounded-lg pl-9 pr-2 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Fecha dia</label>
          <input
            name="diaFecha"
            type="number"
            min="1"
            max="31"
            defaultValue={cartao?.diaFecha ?? ''}
            placeholder="28"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Vence dia</label>
          <input
            name="diaVence"
            type="number"
            min="1"
            max="31"
            defaultValue={cartao?.diaVence ?? ''}
            placeholder="5"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
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
