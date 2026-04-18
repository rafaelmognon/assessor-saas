async function checkApi() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'}/api/health`,
      { cache: 'no-store' },
    );
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: await res.json() };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export default async function Home() {
  const api = await checkApi();

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Assessor SaaS</h1>
            <p className="text-xs text-slate-500">v0.1.0 — Sprint 1.1</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-700">Web (Next.js)</span>
            <span className="text-xs font-semibold text-emerald-600">● online</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-700">API (NestJS)</span>
            <span className={`text-xs font-semibold ${api.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
              {api.ok ? '● online' : '● offline'}
            </span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-indigo-50 rounded-lg text-xs text-indigo-700 leading-relaxed">
          <strong>Sprint 1.1 OK.</strong> Monorepo rodando com API e Web em paralelo. Próximo passo: Sprint 1.2 — schema Prisma e multi-tenant.
        </div>
      </div>
    </main>
  );
}
