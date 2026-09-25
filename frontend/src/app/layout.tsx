import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Secretless Code | Public Repository Credential Scanner',
  description: 'Instant automated detection of exposed API keys, cloud tokens, database URIs, and private secrets in public GitHub repositories.',
  icons: {
    icon: '/favicon.ico',
  },
};

import { ClerkProvider } from '@clerk/nextjs';
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", "font-body")}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-text antialiased selection:bg-accent/30 selection:text-accent">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
