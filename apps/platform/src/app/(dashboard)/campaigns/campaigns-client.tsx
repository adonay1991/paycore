/**
 * Campaigns Client Component
 *
 * Interactive component for managing collection campaigns.
 */

'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVert,
  Trash,
  EditPencil,
  Group,
  Phone,
  Mail,
  MessageText,
} from 'iconoir-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Textarea,
} from '@paycore/ui/components';
import { cn } from '@paycore/ui/lib/utils';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  AnimatedCard,
  PageTransition,
} from '@/components/ui/animated';
import {
  startCampaign,
  pauseCampaign,
  deleteCampaign,
  type Campaign,
  type CreateCampaignInput,
} from '@/actions/campaigns';
import type { VoiceAgent } from '@/actions/voice-agents';

interface CampaignsClientProps {
  campaigns: Campaign[];
  agents: VoiceAgent[];
  stats: {
    total: number;
    running: number;
    paused: number;
    completed: number;
    draft: number;
  };
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  running: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  voice: Phone,
  email: Mail,
  sms: MessageText,
  mixed: Megaphone,
};

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function CampaignsClient({ campaigns, agents, stats }: CampaignsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (campaign.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStartCampaign = async (campaignId: string) => {
    startTransition(async () => {
      await startCampaign(campaignId);
    });
  };

  const handlePauseCampaign = async (campaignId: string) => {
    startTransition(async () => {
      await pauseCampaign(campaignId);
    });
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      startTransition(async () => {
        await deleteCampaign(campaignId);
      });
    }
  };

  const statsCards = [
    { title: 'Total Campaigns', value: stats.total, icon: Megaphone },
    { title: 'Running', value: stats.running, icon: Play },
    { title: 'Paused', value: stats.paused, icon: Pause },
    { title: 'Completed', value: stats.completed, icon: CheckCircle },
  ];

  return (
    <PageTransition>
      {/* Stats Grid */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <StaggerItem key={stat.title}>
            <AnimatedCard>
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="text-3xl font-bold"
                    >
                      {stat.value}
                    </motion.span>
                  </div>
                </CardContent>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              </Card>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Campaign List */}
      <FadeInUp delay={0.2}>
        <Card className="mt-6">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg font-semibold">All Campaigns</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                  </DialogHeader>
                  <NewCampaignForm
                    agents={agents}
                    onClose={() => setIsNewCampaignOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No campaigns found</p>
                <Button variant="outline" onClick={() => setIsNewCampaignOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredCampaigns.map((campaign, index) => {
                    const TypeIcon = typeIcons[campaign.type] || Megaphone;
                    const campaignStats = campaign.stats as {
                      totalContacts: number;
                      contacted: number;
                      successful: number;
                      failed: number;
                      pending: number;
                    } | null;

                    return (
                      <motion.div
                        key={campaign.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="h-full hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <TypeIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">{campaign.name}</h3>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {campaign.type} Campaign
                                  </p>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreVert className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <EditPencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  {campaign.status === 'running' ? (
                                    <DropdownMenuItem
                                      onClick={() => handlePauseCampaign(campaign.id)}
                                    >
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pause
                                    </DropdownMenuItem>
                                  ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                                    <DropdownMenuItem
                                      onClick={() => handleStartCampaign(campaign.id)}
                                    >
                                      <Play className="h-4 w-4 mr-2" />
                                      Start
                                    </DropdownMenuItem>
                                  ) : null}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {campaign.description && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {campaign.description}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mb-4">
                              <Badge
                                variant="secondary"
                                className={cn('capitalize', statusColors[campaign.status])}
                              >
                                {campaign.status}
                              </Badge>
                            </div>

                            {/* Progress */}
                            {campaignStats && campaignStats.totalContacts > 0 && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">
                                    {campaignStats.contacted} / {campaignStats.totalContacts}
                                  </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${(campaignStats.contacted / campaignStats.totalContacts) * 100}%`,
                                    }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="h-full bg-primary rounded-full"
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span className="text-green-600">
                                    {campaignStats.successful} successful
                                  </span>
                                  <span className="text-yellow-600">
                                    {campaignStats.pending} pending
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Group className="h-4 w-4" />
                                <span>{campaignStats?.totalContacts || 0} contacts</span>
                              </div>
                              <span>{formatDate(campaign.created_at)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>
    </PageTransition>
  );
}

// New Campaign Form
interface NewCampaignFormProps {
  agents: VoiceAgent[];
  onClose: () => void;
}

function NewCampaignForm({ agents, onClose }: NewCampaignFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'voice' | 'email' | 'sms' | 'mixed'>('voice');
  const [agentId, setAgentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement campaign creation
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name</Label>
        <Input
          id="name"
          placeholder="Q1 Collection Campaign"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the campaign objectives..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Campaign Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="voice">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Voice Calls
              </div>
            </SelectItem>
            <SelectItem value="email">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
            </SelectItem>
            <SelectItem value="sms">
              <div className="flex items-center gap-2">
                <MessageText className="h-4 w-4" />
                SMS
              </div>
            </SelectItem>
            <SelectItem value="mixed">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Mixed
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'voice' && (
        <div className="space-y-2">
          <Label>Voice Agent</Label>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a voice agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !name}>
          {isLoading ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
}
