import Link from 'next/link';
import { EmptyPage, DollarCircle, User } from 'iconoir-react';
import { Button } from '@paycore/ui/components';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-primary">PayCore</div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Customer Portal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            View your invoices, track payments, and manage your account all in one place.
          </p>
          <div className="pt-4">
            <Link href="/login">
              <Button size="lg" className="px-8">
                Access Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <EmptyPage className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">View Invoices</h3>
              <p className="text-muted-foreground">
                Access all your invoices in one place. Download PDFs and track payment status.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <DollarCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Make Payments</h3>
              <p className="text-muted-foreground">
                Pay your invoices securely online with multiple payment options.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Account Overview</h3>
              <p className="text-muted-foreground">
                See your payment history and account balance at a glance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PayCore. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
