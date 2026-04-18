import { fmtMoney } from '@/lib/format';

interface Cartao {
  id: string;
  apelido: string;
  ultimos4: string;
  cor: string;
  limite: string | null;
  faturaAberta: string | number;
  diaFecha: number | null;
  diaVence: number | null;
}

const GRADIENTES: Record<string, string> = {
  'violet-purple': 'from-violet-600 to-purple-700',
  'orange-amber': 'from-orange-500 to-amber-600',
  'blue-cyan': 'from-blue-600 to-cyan-600',
  'emerald-teal': 'from-emerald-600 to-teal-700',
  'rose-pink': 'from-rose-600 to-pink-700',
  'slate-zinc': 'from-slate-700 to-zinc-900',
};

export function CartoesList({ cartoes }: { cartoes: Cartao[] }) {
  if (cartoes.length === 0) {
    return (
      <div className="bg-white border border-[#f1f1f3] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900">Faturas abertas</h3>
          <a href="/cartoes" className="text-xs text-indigo-600 font-medium hover:underline">
            Adicionar cartão →
          </a>
        </div>
        <p className="text-sm text-slate-400 py-4">
          Nenhum cartão cadastrado. Adicione seus cartões em <a className="text-indigo-600" href="/cartoes">Configurações</a>.
        </p>
      </div>
    );
  }

  const totalFaturas = cartoes.reduce((acc, c) => acc + Number(c.faturaAberta), 0);

  return (
    <div className="bg-white border border-[#f1f1f3] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Faturas abertas</h3>
          <p className="text-xs text-slate-500">
            {cartoes.length} {cartoes.length === 1 ? 'cartão' : 'cartões'} · total {fmtMoney(totalFaturas)}
          </p>
        </div>
        <a href="/cartoes" className="text-xs text-indigo-600 font-medium hover:underline">
          Gerenciar →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cartoes.map((c) => {
          const limite = Number(c.limite ?? 0);
          const fatura = Number(c.faturaAberta);
          const pct = limite > 0 ? Math.min(100, Math.round((fatura / limite) * 100)) : 0;
          const grad = GRADIENTES[c.cor] ?? GRADIENTES['violet-purple'];
          const inicial = c.apelido.charAt(0).toUpperCase();

          return (
            <div
              key={c.id}
              className={`relative rounded-xl p-3.5 bg-gradient-to-br ${grad} text-white overflow-hidden`}
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-white/20 backdrop-blur flex items-center justify-center text-xs font-bold">
                      {inicial}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{c.apelido}</div>
                      <div className="text-[10px] opacity-80">•••• {c.ultimos4}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold leading-none">{fmtMoney(fatura)}</div>
                    {c.diaFecha && (
                      <div className="text-[10px] opacity-80 mt-0.5">Fecha dia {c.diaFecha}</div>
                    )}
                  </div>
                </div>
                {limite > 0 && (
                  <>
                    <div className="w-full bg-white/20 rounded-full h-1">
                      <div className="bg-white h-1 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] opacity-70 mt-1">
                      {pct}% de {fmtMoney(limite)}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
