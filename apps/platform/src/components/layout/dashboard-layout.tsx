'use client';

import { type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
          <Header />
          <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
