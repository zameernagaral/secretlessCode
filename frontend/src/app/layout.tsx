import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Secretless Code | Public Repository Credential Scanner',
  description: 'Instant automated detection of exposed API keys, cloud tokens, database URIs, and private secrets in public GitHub repositories.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="cyber-grid antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute -top-[30%] left-[20%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[130px]" />
          <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
