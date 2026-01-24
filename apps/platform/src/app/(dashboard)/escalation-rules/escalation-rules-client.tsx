/**
 * Escalation Rules Client Component
 *
 * Interactive component for managing escalation rules.
 */

'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flash,
  Plus,
  Search,
  MoreVert,
  Trash,
  EditPencil,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageText,
  ArrowUp,
  User,
  Megaphone,
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
  toggleRuleStatus,
  deleteEscalationRule,
  type EscalationRuleWithStats,
} from '@/actions/escalation-rules';

interface EscalationRulesClientProps {
  rules: EscalationRuleWithStats[];
  stats: {
    totalRules: number;
    activeRules: number;
    totalExecutions: number;
    executionsToday: number;
    avgSuccessRate: number;
  };
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  send_email: Mail,
  send_sms: MessageText,
  voice_call: Phone,
  assign_agent: User,
  escalate_priority: ArrowUp,
  add_to_campaign: Megaphone,
  create_debt_case: Flash,
};

const actionLabels: Record<string, string> = {
  send_email: 'Send Email',
  send_sms: 'Send SMS',
  voice_call: 'Voice Call',
  assign_agent: 'Assign Agent',
  escalate_priority: 'Escalate Priority',
  add_to_campaign: 'Add to Campaign',
  create_debt_case: 'Create Debt Case',
};

export function EscalationRulesClient({ rules, stats }: EscalationRulesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewRuleOpen, setIsNewRuleOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Filter rules
  const filteredRules = rules.filter((rule) =>
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rule.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleToggleStatus = async (ruleId: string) => {
    startTransition(async () => {
      await toggleRuleStatus(ruleId);
    });
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      startTransition(async () => {
        await deleteEscalationRule(ruleId);
      });
    }
  };

  const statsCards = [
    { title: 'Total Rules', value: stats.totalRules, icon: Flash },
    { title: 'Active Rules', value: stats.activeRules, icon: Play },
    { title: 'Executions Today', value: stats.executionsToday, icon: Clock },
    {
      title: 'Success Rate',
      value: `${stats.avgSuccessRate}%`,
      icon: CheckCircle,
      isFormatted: true,
    },
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

      {/* Rules List */}
      <FadeInUp delay={0.2}>
        <Card className="mt-6">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg font-semibold">Escalation Rules</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-64"
                />
              </div>
              <Dialog open={isNewRuleOpen} onOpenChange={setIsNewRuleOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Escalation Rule</DialogTitle>
                  </DialogHeader>
                  <NewRuleForm onClose={() => setIsNewRuleOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRules.length === 0 ? (
              <div className="text-center py-12">
                <Flash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No escalation rules configured</p>
                <Button variant="outline" onClick={() => setIsNewRuleOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Rule
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredRules.map((rule, index) => {
                    const conditions = rule.conditions as {
                      daysOverdue?: { min?: number; max?: number };
                      debtAmount?: { min?: number; max?: number };
                      currentStatus?: string[];
                      previousAttempts?: { min?: number; max?: number };
                    };
                    const actions = rule.actions as Array<{
                      type: string;
                      params: Record<string, unknown>;
                    }>;

                    return (
                      <motion.div
                        key={rule.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={cn(
                            'transition-colors',
                            !rule.is_active && 'opacity-60'
                          )}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{rule.name}</h3>
                                  <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                                    {rule.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                  {rule.priority > 0 && (
                                    <Badge variant="outline">Priority: {rule.priority}</Badge>
                                  )}
                                </div>
                                {rule.description && (
                                  <p className="text-sm text-muted-foreground mb-4">
                                    {rule.description}
                                  </p>
                                )}

                                {/* Conditions */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {conditions.daysOverdue && (
                                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                                      Days overdue:{' '}
                                      {conditions.daysOverdue.min ?? 0}-
                                      {conditions.daysOverdue.max ?? '∞'}
                                    </Badge>
                                  )}
                                  {conditions.debtAmount && (
                                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                                      Amount:{' '}
                                      €{conditions.debtAmount.min ?? 0}-
                                      €{conditions.debtAmount.max ?? '∞'}
                                    </Badge>
                                  )}
                                  {conditions.currentStatus && conditions.currentStatus.length > 0 && (
                                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20">
                                      Status: {conditions.currentStatus.join(', ')}
                                    </Badge>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2">
                                  {actions.map((action, actionIndex) => {
                                    const ActionIcon = actionIcons[action.type] || Flash;
                                    return (
                                      <div
                                        key={actionIndex}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 text-sm"
                                      >
                                        <ActionIcon className="h-4 w-4 text-primary" />
                                        <span>{actionLabels[action.type] || action.type}</span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                                  <span>
                                    Executions: <strong>{rule.executionCount}</strong>
                                  </span>
                                  <span>
                                    Success rate: <strong>{rule.successRate}%</strong>
                                  </span>
                                  {rule.lastExecutedAt && (
                                    <span>
                                      Last run:{' '}
                                      {new Date(rule.lastExecutedAt).toLocaleDateString()}
                                    </span>
                                  )}
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
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(rule.id)}
                                  >
                                    {rule.is_active ? (
                                      <>
                                        <Pause className="h-4 w-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteRule(rule.id)}
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

// New Rule Form
interface NewRuleFormProps {
  onClose: () => void;
}

function NewRuleForm({ onClose }: NewRuleFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [daysOverdueMin, setDaysOverdueMin] = useState('');
  const [daysOverdueMax, setDaysOverdueMax] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const availableActions = [
    { value: 'send_email', label: 'Send Email', icon: Mail },
    { value: 'send_sms', label: 'Send SMS', icon: MessageText },
    { value: 'voice_call', label: 'Voice Call', icon: Phone },
    { value: 'assign_agent', label: 'Assign Agent', icon: User },
    { value: 'escalate_priority', label: 'Escalate Priority', icon: ArrowUp },
    { value: 'add_to_campaign', label: 'Add to Campaign', icon: Megaphone },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement rule creation
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const toggleAction = (actionValue: string) => {
    setSelectedActions((prev) =>
      prev.includes(actionValue)
        ? prev.filter((a) => a !== actionValue)
        : [...prev, actionValue]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          placeholder="30 Days Overdue Reminder"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what this rule does..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Conditions */}
      <div className="space-y-3">
        <Label>Conditions</Label>
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">Days Overdue (Min)</Label>
              <Input
                type="number"
                placeholder="e.g., 30"
                value={daysOverdueMin}
                onChange={(e) => setDaysOverdueMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Days Overdue (Max)</Label>
              <Input
                type="number"
                placeholder="e.g., 60"
                value={daysOverdueMax}
                onChange={(e) => setDaysOverdueMax(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Label>Actions</Label>
        <div className="grid gap-2 md:grid-cols-2">
          {availableActions.map((action) => {
            const isSelected = selectedActions.includes(action.value);
            return (
              <motion.button
                key={action.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleAction(action.value)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center',
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <action.icon
                    className={cn(
                      'h-4 w-4',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !name || selectedActions.length === 0}
        >
          {isLoading ? 'Creating...' : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
}
