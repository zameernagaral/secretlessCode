import type { Metadata } from 'next';
import './globals.css';
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Schibsted_Grotesk, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  metadataBase: new URL('https://secretlesscode.com'),
  title: {
    template: '%s | Secretless Code',
    default: 'Secretless Code | Public Repository Credential Scanner',
  },
  description:
    'Instant automated detection of exposed API keys, cloud tokens, database URIs, and private secrets in public GitHub repositories. Ephemeral RAM-disk clone with zero code retention.',
  keywords: [
    'security',
    'credential scanner',
    'secrets detection',
    'gitleaks',
    'git-filter-repo',
    'zero retention',
    'devsecops',
  ],
  authors: [{ name: 'Secretless Team' }],
  openGraph: {
    title: 'Secretless Code | Public Repository Credential Scanner',
    description:
      'Instant automated detection of exposed API keys, cloud tokens, database URIs, and private secrets in public GitHub repositories. Zero code retention.',
    url: 'https://secretlesscode.com',
    siteName: 'Secretless Code',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Secretless Code — Precision Credential Scanner Specimen',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Secretless Code | Public Repository Credential Scanner',
    description:
      'Instant automated detection of exposed API keys, cloud tokens, database URIs, and private secrets in public GitHub repositories. Zero code retention.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
  },
  alternates: {
    canonical: '/',
  },
};

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
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const content = <TooltipProvider>{children}</TooltipProvider>;

  return (
    <html
      lang="en"
      className={cn('dark', schibstedGrotesk.variable, jetbrainsMono.variable)}
    >
      <body className="antialiased overflow-x-hidden">
        {clerkKey ? (
          <ClerkProvider publishableKey={clerkKey} dynamic>
            {content}
          </ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
