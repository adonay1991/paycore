'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'iconoir-react';
import { Button, Input } from '@paycore/ui/components';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/invoices': 'Invoices',
  '/customers': 'Customers',
  '/payments': 'Payments',
  '/debt-cases': 'Debt Cases',
  '/settings': 'Settings',
};

export function Header() {
  const pathname = usePathname();

  // Get page title, handling nested routes
  const getPageTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname];

    // Check for nested routes
    for (const [path, title] of Object.entries(pageTitles)) {
      if (path !== '/' && pathname.startsWith(path)) {
        return title;
      }
    }

    return 'PayCore';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="lg:hidden w-8" /> {/* Spacer for mobile menu button */}

      <h1 className="text-lg font-semibold lg:text-xl">
        {getPageTitle()}
      </h1>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-9"
          />
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
