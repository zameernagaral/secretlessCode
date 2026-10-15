import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Secretless Code',
    default: 'Secretless Code | Public Repository Credential Scanner',
  },
  description: 'Instant automated detection of exposed API keys, cloud tokens, database URIs, and private secrets in public GitHub repositories.',
  keywords: ['security', 'credential scanner', 'secrets detection', 'github scanner', 'devsecops'],
  authors: [{ name: 'Secretless Team' }],
  openGraph: {
    title: 'Secretless Code | Public Repository Credential Scanner',
    description: 'Instant automated detection of exposed API keys, cloud tokens, database URIs, and private secrets in public GitHub repositories.',
    url: 'https://secretlesscode.com',
    siteName: 'Secretless Code',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Secretless Code | Public Repository Credential Scanner',
    description: 'Instant automated detection of exposed API keys, cloud tokens, database URIs, and private secrets in public GitHub repositories.',
  },
  icons: {
    icon: '/icon.svg',
  },
};

import { ClerkProvider } from '@clerk/nextjs';
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Schibsted_Grotesk, JetBrains_Mono } from 'next/font/google';

const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-schibsted-grotesk',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", schibstedGrotesk.variable, jetbrainsMono.variable)}>
      <body className="bg-background text-text antialiased selection:bg-accent/30 selection:text-accent overflow-x-hidden">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}

