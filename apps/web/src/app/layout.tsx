import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Assessor — Seu assistente pessoal no WhatsApp',
  description: 'Organize finanças, compromissos e insights por texto ou áudio.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
