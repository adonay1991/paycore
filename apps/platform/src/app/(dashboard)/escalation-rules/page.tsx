/**
 * Escalation Rules Dashboard Page
 *
 * Manage automated escalation rules for debt collection.
 */

import { Suspense } from 'react';
import { Flash, Play, Pause, CheckCircle } from 'iconoir-react';
import { getEscalationRules, getRulesStats } from '@/actions';
import { EscalationRulesClient } from './escalation-rules-client';

async function getEscalationData() {
  const [rulesResult, statsResult] = await Promise.all([
    getEscalationRules(),
    getRulesStats(),
  ]);

  const rules = rulesResult.success ? rulesResult.data || [] : [];
  const stats = statsResult.success && statsResult.data
    ? statsResult.data
    : {
        totalRules: 0,
        activeRules: 0,
        totalExecutions: 0,
        executionsToday: 0,
        avgSuccessRate: 0,
      };

  return { rules, stats };
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

export default async function EscalationRulesPage() {
  const { rules, stats } = await getEscalationData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Escalation Rules</h1>
          <p className="text-muted-foreground">
            Configure automated actions based on debt case conditions
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <EscalationRulesClient rules={rules} stats={stats} />
      </Suspense>
    </div>
  );
}
