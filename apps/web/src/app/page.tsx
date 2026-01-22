import { Home, Rocket, Book } from 'iconoir-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="text-center space-y-8 p-8 max-w-3xl">
        <div className="flex justify-center">
          <Home className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to paycore
        </h1>
        <p className="text-xl text-muted-foreground">
          Enterprise-grade SaaS built with Next.js 16, React 19, Hono, and Bun
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
          >
            <Rocket className="w-5 h-5" />
            Get Started
          </a>
          <a
            href="/docs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition font-medium"
          >
            <Book className="w-5 h-5" />
            Documentation
          </a>
        </div>
      </div>
    </main>
  );
}
