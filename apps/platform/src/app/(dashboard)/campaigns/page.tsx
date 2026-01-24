/**
 * Campaigns Dashboard Page
 *
 * Manage collection campaigns and monitor performance.
 */

import { Suspense } from 'react';
import {
  Megaphone,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Plus,
} from 'iconoir-react';
import { getCampaigns, getVoiceAgents } from '@/actions';
import { CampaignsClient } from './campaigns-client';

async function getCampaignData() {
  const [campaignsResult, agentsResult] = await Promise.all([
    getCampaigns(),
    getVoiceAgents(),
  ]);

  const campaigns = campaignsResult.success ? campaignsResult.data || [] : [];
  const agents = agentsResult.success ? agentsResult.data || [] : [];

  // Calculate stats
  const stats = {
    total: campaigns.length,
    running: campaigns.filter((c) => c.status === 'running').length,
    paused: campaigns.filter((c) => c.status === 'paused').length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
  };

  return { campaigns, agents, stats };
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

export default async function CampaignsPage() {
  const { campaigns, agents, stats } = await getCampaignData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage automated collection campaigns
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
        <CampaignsClient campaigns={campaigns} agents={agents} stats={stats} />
      </Suspense>
    </div>
  );
}
