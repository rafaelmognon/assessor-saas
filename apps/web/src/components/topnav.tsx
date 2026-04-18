import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { logoutAction } from '@/lib/auth-actions';

interface NavLink {
  href: string;
  label: string;
}

const links: NavLink[] = [
  { href: '/', label: 'Visão Geral' },
  { href: '/transacoes', label: 'Transações' },
  { href: '/compromissos', label: 'Agenda' },
  { href: '/notas', label: 'Notas' },
  { href: '/categorias', label: 'Categorias' },
  { href: '/whatsapp', label: 'Meu Assessor' },
];

export function TopNav({ active }: { active: string }) {
  return (
    <header className="bg-[#0a0a0a] text-white">
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L2 20h20L12 3zm0 4l6.5 11h-13L12 7z" fill="currentColor" />
            </svg>
            <span className="font-semibold text-[15px]">Assessor</span>
          </Link>
          <nav className="flex items-center gap-8 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active === l.href
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-white transition'
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/configuracoes"
            className={
              active === '/configuracoes'
                ? 'text-white font-semibold flex items-center gap-2'
                : 'text-zinc-400 hover:text-white flex items-center gap-2 transition'
            }
          >
            <User className="w-4 h-4" />
            Minha Conta
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-zinc-400 hover:text-white flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
