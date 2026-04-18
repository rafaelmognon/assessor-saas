'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, Trash2, Filter } from 'lucide-react';
import { Modal } from '@/components/modal';
import { fmtMoney, fmtDate } from '@/lib/format';
import { createTransacaoAction, deleteTransacaoAction } from '@/lib/crud-actions';

interface Transacao {
  id: string;
  descricao: string;
  valor: string;
  tipo: 'ENTRADA' | 'SAIDA';
  formaPagamento: string;
  origem: string;
  data: string;
  parcelaAtual: number | null;
  parcelasTotal: number | null;
  categoria: { nome: string; icone: string; cor: string } | null;
  cartao: { apelido: string; ultimos4: string; cor: string } | null;
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  tipo: 'SAIDA' | 'ENTRADA';
}

interface Cartao {
  id: string;
  apelido: string;
  ultimos4: string;
}

const FORMAS = [
  { v: 'PIX',           label: '⚡ PIX' },
  { v: 'CREDITO',       label: '💳 Crédito' },
  { v: 'DEBITO',        label: '💳 Débito' },
  { v: 'DINHEIRO',      label: '💵 Dinheiro' },
  { v: 'BOLETO',        label: '📄 Boleto' },
  { v: 'TRANSFERENCIA', label: '🏦 Transferência' },
];

const ORIGEM_LABEL: Record<string, string> = {
  WHATSAPP_TEXTO: '💬 WhatsApp',
  WHATSAPP_AUDIO: '🎤 WhatsApp',
  MANUAL: '✏️ Manual',
  RECORRENTE: '🔁 Recorrente',
  IMPORTACAO: '📥 Importação',
};

export function TransacoesClient({
  transacoes,
  categorias,
  cartoes,
}: {
  transacoes: Transacao[];
  categorias: Categoria[];
  cartoes: Cartao[];
}) {
  const [open, setOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'TODAS' | 'ENTRADA' | 'SAIDA'>('TODAS');
  const [filtroCat, setFiltroCat] = useState('');
  const [filtroPgto, setFiltroPgto] = useState('');
  const [pending, start] = useTransition();

  const filtradas = useMemo(() => {
    return transacoes.filter((t) => {
      if (filtroTipo !== 'TODAS' && t.tipo !== filtroTipo) return false;
      if (filtroCat && t.categoria?.nome !== filtroCat) return false;
      if (filtroPgto && t.formaPagamento !== filtroPgto) return false;
      return true;
    });
  }, [transacoes, filtroTipo, filtroCat, filtroPgto]);

  const totals = useMemo(() => {
    let entradas = 0,
      saidas = 0;
    transacoes.forEach((t) => {
      if (t.tipo === 'ENTRADA') entradas += Number(t.valor);
      else saidas += Number(t.valor);
    });
    return { entradas, saidas, saldo: entradas - saidas };
  }, [transacoes]);

  function onDelete(id: string) {
    if (!confirm('Excluir esta transação?')) return;
    start(async () => {
      await deleteTransacaoAction(id);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Transações</h1>
          <p className="text-sm text-slate-500 mt-1">{transacoes.length} transações no total</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nova transação
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-[#f1f1f3] rounded-2xl p-5">
          <div className="text-sm text-slate-500 mb-1">Entradas</div>
          <div className="text-xl font-bold text-emerald-600">+ {fmtMoney(totals.entradas)}</div>
        </div>
        <div className="bg-white border border-[#f1f1f3] rounded-2xl p-5">
          <div className="text-sm text-slate-500 mb-1">Saídas</div>
          <div className="text-xl font-bold text-rose-600">- {fmtMoney(totals.saidas)}</div>
        </div>
        <div className="bg-white border border-[#f1f1f3] rounded-2xl p-5">
          <div className="text-sm text-slate-500 mb-1">Saldo</div>
          <div className="text-xl font-bold text-slate-900">{fmtMoney(totals.saldo)}</div>
        </div>
      </div>

      {/* Filtros + Tabela */}
      <div className="bg-white border border-[#f1f1f3] rounded-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
            {(['TODAS', 'ENTRADA', 'SAIDA'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={
                  filtroTipo === t
                    ? 'px-3 py-1.5 text-xs font-semibold bg-white rounded-md shadow-sm'
                    : 'px-3 py-1.5 text-xs text-slate-600'
                }
              >
                {t === 'TODAS' ? 'Todas' : t === 'ENTRADA' ? 'Entradas' : 'Saídas'}
              </button>
            ))}
          </div>
          <select
            value={filtroCat}
            onChange={(e) => setFiltroCat(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">Todas categorias</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.icone} {c.nome}
              </option>
            ))}
          </select>
          <select
            value={filtroPgto}
            onChange={(e) => setFiltroPgto(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">Toda forma de pgto</option>
            {FORMAS.map((f) => (
              <option key={f.v} value={f.v}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left py-3 px-4">Descrição</th>
                <th className="text-left py-3 px-4">Categoria</th>
                <th className="text-left py-3 px-4">Pagamento</th>
                <th className="text-left py-3 px-4">Data</th>
                <th className="text-left py-3 px-4">Origem</th>
                <th className="text-right py-3 px-4">Valor</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhuma transação. Use "Nova transação" ou mande pelo WhatsApp.
                  </td>
                </tr>
              )}
              {filtradas.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 group">
                  <td className="py-3 px-4 font-medium text-slate-900">{t.descricao}</td>
                  <td className="py-3 px-4">
                    {t.categoria ? (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                        {t.categoria.icone} {t.categoria.nome}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-700">
                      {pgtoLabel(t.formaPagamento)}
                      {t.cartao && ` · ${t.cartao.apelido} ${t.cartao.ultimos4}`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{fmtDate(t.data)}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {ORIGEM_LABEL[t.origem] ?? t.origem}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className={`font-semibold ${t.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.tipo === 'ENTRADA' ? '+' : '-'} {fmtMoney(t.valor)}
                    </div>
                    {t.parcelaAtual && t.parcelasTotal && (
                      <div className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 inline-block mt-0.5 font-medium">
                        🔢 {t.parcelaAtual}/{t.parcelasTotal}x
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onDelete(t.id)}
                      disabled={pending}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova transação">
        <NovaTransacaoForm
          categorias={categorias}
          cartoes={cartoes}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

function NovaTransacaoForm({
  categorias,
  cartoes,
  onSuccess,
}: {
  categorias: Categoria[];
  cartoes: Cartao[];
  onSuccess: () => void;
}) {
  const [tipo, setTipo] = useState<'SAIDA' | 'ENTRADA'>('SAIDA');
  const [forma, setForma] = useState('PIX');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const catsFiltradas = categorias.filter((c) => c.tipo === tipo);

  function handle(formData: FormData) {
    setError(null);
    const payload: any = {
      descricao: String(formData.get('descricao') || '').trim(),
      valor: Number(formData.get('valor')),
      tipo,
      formaPagamento: forma,
      data: formData.get('data') || undefined,
      categoriaId: formData.get('categoriaId') || undefined,
      cartaoId: forma === 'CREDITO' ? formData.get('cartaoId') || undefined : undefined,
    };
    if (!payload.categoriaId) delete payload.categoriaId;
    if (!payload.cartaoId) delete payload.cartaoId;

    start(async () => {
      const res = await createTransacaoAction(payload);
      if (res.ok) onSuccess();
      else setError(res.error || 'Erro');
    });
  }

  return (
    <form action={handle} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['SAIDA', 'ENTRADA'] as const).map((t) => (
          <label
            key={t}
            className={
              tipo === t
                ? `flex items-center justify-center gap-2 border-2 rounded-lg py-2.5 cursor-pointer ${
                    t === 'SAIDA' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  }`
                : 'flex items-center justify-center gap-2 border-2 border-slate-200 rounded-lg py-2.5 cursor-pointer hover:bg-slate-50'
            }
          >
            <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)} className="hidden" />
            <span>{t === 'SAIDA' ? '💸' : '💰'}</span>
            <span className="text-sm font-medium">{t === 'SAIDA' ? 'Saída' : 'Entrada'}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Descrição *</label>
        <input
          name="descricao"
          required
          placeholder="Ex: Mercado Extra"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Valor *</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
            <input
              name="valor"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Data</label>
          <input
            name="data"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Forma de pagamento *</label>
        <select
          value={forma}
          onChange={(e) => setForma(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          {FORMAS.map((f) => (
            <option key={f.v} value={f.v}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {forma === 'CREDITO' && cartoes.length > 0 && (
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">Cartão</label>
          <select name="cartaoId" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Selecione...</option>
            {cartoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.apelido} ····{c.ultimos4}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1.5">Categoria</label>
        <select name="categoriaId" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Sem categoria</option>
          {catsFiltradas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icone} {c.nome}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

function pgtoLabel(forma: string): string {
  return FORMAS.find((f) => f.v === forma)?.label ?? forma;
}
