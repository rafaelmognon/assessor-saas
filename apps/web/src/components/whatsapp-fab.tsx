import Link from 'next/link';

export function WhatsAppFAB() {
  return (
    <Link
      href="/configuracoes#whatsapp"
      className="fixed bottom-6 right-6 w-12 h-12 bg-[#25D366] hover:bg-[#1ebe5b] text-white rounded-full shadow-lg flex items-center justify-center transition"
      aria-label="WhatsApp"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.52 3.48A11.86 11.86 0 0012.04 0C5.47 0 .13 5.33.13 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.88 11.88 0 005.73 1.46h.01c6.57 0 11.9-5.33 11.91-11.9a11.84 11.84 0 00-3.43-8.43zM12.04 21.8h-.01a9.9 9.9 0 01-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 01-1.52-5.28c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.85 9.85 0 012.9 7c0 5.46-4.44 9.9-9.89 9.9z" />
      </svg>
    </Link>
  );
}
