import { ViewGrid, User, Dollar, GraphUp } from 'iconoir-react';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <header className="mb-8 flex items-center gap-3">
          <ViewGrid className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your paycore platform
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Users</h2>
            </div>
            <p className="text-3xl font-bold">1,234</p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Dollar className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold">Revenue</h2>
            </div>
            <p className="text-3xl font-bold">$12,345</p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <GraphUp className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Active</h2>
            </div>
            <p className="text-3xl font-bold">567</p>
          </div>
        </div>
      </div>
    </main>
  );
}
