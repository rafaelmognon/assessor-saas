import { SignupForm } from './signup-form';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <span className="text-2xl font-bold text-slate-900">Assessor</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Criar sua conta grátis</h1>
          <p className="text-slate-600 text-sm">14 dias grátis · sem cartão de crédito</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <SignupForm />
          <p className="text-center text-sm text-slate-500 mt-4">
            Já tem conta?{' '}
            <a href="/login" className="text-indigo-600 font-medium hover:underline">
              Entrar
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
