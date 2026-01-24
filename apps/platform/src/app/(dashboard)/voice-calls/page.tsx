/**
 * Voice Calls Dashboard Page
 *
 * Overview of voice calls, agents, and call history.
 */

import { Suspense } from 'react';
import { Phone, PhoneOutcome, PhonePaused, CheckCircle, Clock } from 'iconoir-react';
import { getCallHistory, getVoiceAgents } from '@/actions';
import { VoiceCallsClient } from './voice-calls-client';

// Stats card data
interface StatCard {
  title: string;
  value: number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

async function getCallStats() {
  const result = await getCallHistory();
  const calls = result.success ? result.data || [] : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCalls = calls.filter(
    (call) => new Date(call.created_at) >= today
  );

  const stats: StatCard[] = [
    {
      title: 'Total Calls Today',
      value: todayCalls.length,
      icon: Phone,
    },
    {
      title: 'Active Calls',
      value: calls.filter((c) => c.status === 'in_progress').length,
      icon: PhoneOutcome,
    },
    {
      title: 'Completed',
      value: todayCalls.filter((c) => c.status === 'completed').length,
      change: '+12%',
      changeType: 'positive',
      icon: CheckCircle,
    },
    {
      title: 'Pending',
      value: calls.filter((c) => c.status === 'pending').length,
      icon: Clock,
    },
  ];

  return { stats, calls };
}

async function getAgents() {
  const result = await getVoiceAgents();
  return result.success ? result.data || [] : [];
}

function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-10 w-10 bg-muted rounded-lg" />
      </div>
      <div className="mt-4">
        <div className="h-8 w-16 bg-muted rounded" />
      </div>
    </div>
  );
}

function CallsTableSkeleton() {
  return (
    <div className="bg-card rounded-xl border">
      <div className="p-6 border-b">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
            <div className="h-6 w-16 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function VoiceCallsPage() {
  const [{ stats, calls }, agents] = await Promise.all([
    getCallStats(),
    getAgents(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voice Calls</h1>
          <p className="text-muted-foreground">
            Manage voice calls and monitor agent performance
          </p>
        </div>
      </div>

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <VoiceCallsClient stats={stats} calls={calls} agents={agents} />
      </Suspense>
    </div>
  );
}
