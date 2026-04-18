'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupAction } from '@/lib/auth-actions';

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const res = await signupAction(formData);
    if (res.ok) router.replace('/');
    else {
      setError(res.error ?? 'Erro');
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm text-slate-700 mb-1">Nome</label>
        <input
          name="nome"
          required
          minLength={2}
          placeholder="Seu nome"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-700 mb-1">E-mail</label>
        <input
          name="email"
          type="email"
          required
          placeholder="voce@email.com"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-700 mb-1">Senha</label>
        <input
          name="senha"
          type="password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres, letras e números"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Criando...' : 'Criar conta grátis'}
      </button>
    </form>
  );
}
