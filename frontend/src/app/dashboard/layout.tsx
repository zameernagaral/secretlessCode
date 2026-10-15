import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Dashboard',
  description: 'Monitor repository scan history, credential status, and remediation pipelines.',
  alternates: {
    canonical: '/dashboard',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
