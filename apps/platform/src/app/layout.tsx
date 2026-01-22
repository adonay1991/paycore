import type { Metadata } from 'next';
import '@paycore/ui/globals.css';

export const metadata: Metadata = {
  title: 'paycore - Admin',
  description: 'Admin dashboard for paycore',
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
