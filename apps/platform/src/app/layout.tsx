import type { Metadata } from 'next';
import '@paycore/ui/globals.css';
import { AuthProvider } from '@/lib/auth/context';

// Disable static generation for all pages since they require auth
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PayCore - Admin Dashboard',
  description: 'Payment and debt recovery management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
