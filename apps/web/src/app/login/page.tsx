import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Seu assistente pessoal no WhatsApp
          </h1>
          <p className="text-slate-600">Organize finanças e compromissos por texto ou áudio.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h2 className="font-semibold text-slate-900 mb-6 text-center">Entrar na sua conta</h2>
          <LoginForm />
          <p className="text-center text-sm text-slate-500 mt-4">
            Não tem conta?{' '}
            <a href="/signup" className="text-indigo-600 font-medium hover:underline">
              Criar grátis
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Seus dados são criptografados ponta a ponta 🔒
        </p>
      </div>
    </main>
  );
}
