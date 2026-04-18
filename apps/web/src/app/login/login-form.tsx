'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '@/lib/auth-actions';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const res = await loginAction(formData);
    if (res.ok) {
      router.replace(next);
    } else {
      setError(res.error ?? 'Erro');
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit}>
      <label className="block text-sm text-slate-700 mb-1">E-mail</label>
      <input
        name="email"
        type="email"
        required
        placeholder="voce@email.com"
        className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-indigo-500"
        autoComplete="email"
      />
      <label className="block text-sm text-slate-700 mb-1">Senha</label>
      <input
        name="senha"
        type="password"
        required
        placeholder="••••••••"
        className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-indigo-500"
        autoComplete="current-password"
      />

      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-3">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
