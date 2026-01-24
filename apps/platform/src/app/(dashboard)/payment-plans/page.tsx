/**
 * Payment Plans Dashboard Page
 *
 * Manage payment plans and installments.
 */

import { Suspense } from 'react';
import { Calendar, CheckCircle, Clock, WarningTriangle } from 'iconoir-react';
import { getPaymentPlans, getOverdueInstallments } from '@/actions';
import { PaymentPlansClient } from './payment-plans-client';

async function getPaymentPlanData() {
  const [plansResult, overdueResult] = await Promise.all([
    getPaymentPlans(),
    getOverdueInstallments(),
  ]);

  const plans = plansResult.success ? plansResult.data || [] : [];
  const overdueInstallments = overdueResult.success ? overdueResult.data || [] : [];

  // Calculate stats
  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.status === 'active').length,
    completed: plans.filter((p) => p.status === 'completed').length,
    defaulted: plans.filter((p) => p.status === 'defaulted').length,
    overdue: overdueInstallments.length,
    totalValue: plans.reduce((sum, p) => sum + Number(p.total_amount), 0),
    collected: plans.reduce((sum, p) => sum + Number(p.paid_amount), 0),
  };

  return { plans, overdueInstallments, stats };
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

export default async function PaymentPlansPage() {
  const { plans, overdueInstallments, stats } = await getPaymentPlanData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Plans</h1>
          <p className="text-muted-foreground">
            Track and manage customer payment arrangements
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
        <PaymentPlansClient
          plans={plans}
          overdueInstallments={overdueInstallments}
          stats={stats}
        />
      </Suspense>
    </div>
  );
}
