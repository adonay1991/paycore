import type { Metadata } from 'next';
import '@paycore/ui/globals.css';

export const metadata: Metadata = {
  title: 'paycore',
  description: 'Enterprise SaaS built with bunkit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
