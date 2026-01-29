/**
 * Voice Calls Client Component
 *
 * Interactive client component with Framer Motion animations.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOutcome,
  Plus,
  Search,
  Filter,
  Play,
  Clock,
  CheckCircle,
  WarningCircle,
  MoreVert,
  Microphone,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@paycore/ui/components';
import { cn } from '@paycore/ui/lib/utils';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  AnimatedCard,
  PageTransition,
} from '@/components/ui/animated';
import { CallDetailSheet } from './call-detail-sheet';
import type { VoiceCall, VoiceAgent } from '@/actions/voice-agents';
import {
  initiateCall,
  initiateTestCall,
  getCustomersForCalls,
  getDebtCasesForCustomer,
  listElevenLabsAgents,
  linkElevenLabsAgent,
} from '@/actions';
import type { DebtCaseForCall } from '@/actions';
import { useRouter } from 'next/navigation';
import { Label } from '@paycore/ui/components';

interface StatCard {
  title: string;
  value: number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

interface VoiceCallsClientProps {
  stats: StatCard[];
  calls: VoiceCall[];
  agents: VoiceAgent[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  no_answer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  voicemail: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  busy: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const outcomeLabels: Record<string, string> = {
  promise_to_pay: 'Promise to Pay',
  payment_plan_agreed: 'Payment Plan',
  dispute: 'Dispute',
  callback_requested: 'Callback',
  wrong_number: 'Wrong Number',
  not_interested: 'Not Interested',
  escalate: 'Escalate',
  no_outcome: 'No Outcome',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VoiceCallsClient({ stats, calls, agents }: VoiceCallsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewCallOpen, setIsNewCallOpen] = useState(false);
  const [isNewAgentOpen, setIsNewAgentOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [isCallDetailOpen, setIsCallDetailOpen] = useState(false);

  // Filter calls based on search and status
  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.phone_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageTransition>
      {/* Stats Grid */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
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
                  <div className="mt-4 flex items-baseline gap-2">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="text-3xl font-bold"
                    >
                      {stat.value}
                    </motion.span>
                    {stat.change && (
                      <span
                        className={cn(
                          'text-sm font-medium',
                          stat.changeType === 'positive' && 'text-green-600',
                          stat.changeType === 'negative' && 'text-red-600',
                          stat.changeType === 'neutral' && 'text-muted-foreground'
                        )}
                      >
                        {stat.change}
                      </span>
                    )}
                  </div>
                </CardContent>
                {/* Decorative gradient */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              </Card>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Voice Agents Quick View */}
      <FadeInUp delay={0.2}>
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Voice Agents</CardTitle>
            <Dialog open={isNewAgentOpen} onOpenChange={setIsNewAgentOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Link ElevenLabs Agent
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Link ElevenLabs Agent</DialogTitle>
                </DialogHeader>
                <LinkAgentForm
                  localAgents={agents}
                  onClose={() => setIsNewAgentOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="text-center py-8">
                <Microphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No voice agents configured</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsNewAgentOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Link Your First Agent
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Microphone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.language.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {agent.elevenlabs_agent_id ? (
                          <Badge variant="default" className="bg-green-600">
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-600 text-white">
                            Not Linked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>

      {/* Call History */}
      <FadeInUp delay={0.3}>
        <Card className="mt-6">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg font-semibold">Call History</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search calls..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isNewCallOpen} onOpenChange={setIsNewCallOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Phone className="h-4 w-4 mr-2" />
                    New Call
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Initiate New Call</DialogTitle>
                  </DialogHeader>
                  <NewCallForm agents={agents} onClose={() => setIsNewCallOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCalls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No calls found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredCalls.map((call, index) => (
                        <motion.tr
                          key={call.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedCall(call);
                            setIsCallDetailOpen(true);
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <Phone className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{call.phone_number}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'capitalize',
                                statusColors[call.status]
                              )}
                            >
                              {call.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {call.outcome ? (
                              <span className="text-sm">
                                {outcomeLabels[call.outcome] || call.outcome}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDuration(call.duration)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>{formatDate(call.created_at)}</span>
                              {/* Indicators for recording/transcription */}
                              <div className="flex gap-1">
                                {call.recording_url && (
                                  <span title="Recording available" className="text-green-600">
                                    <Play className="h-3 w-3" />
                                  </span>
                                )}
                                {call.transcription && (
                                  <span title="Transcription available" className="text-blue-600">
                                    <MessageText className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVert className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {call.recording_url && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCall(call);
                                    setIsCallDetailOpen(true);
                                  }}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Play Recording
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCall(call);
                                  setIsCallDetailOpen(true);
                                }}>
                                  View Details
                                </DropdownMenuItem>
                                {call.transcription && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCall(call);
                                    setIsCallDetailOpen(true);
                                  }}>
                                    <MessageText className="h-4 w-4 mr-2" />
                                    View Transcription
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>

      {/* Call Detail Sheet */}
      <CallDetailSheet
        call={selectedCall}
        open={isCallDetailOpen}
        onOpenChange={setIsCallDetailOpen}
      />
    </PageTransition>
  );
}

// New Call Form Component
interface NewCallFormProps {
  agents: VoiceAgent[];
  onClose: () => void;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
}

function NewCallForm({ agents, onClose }: NewCallFormProps) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agentId, setAgentId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [debtCaseId, setDebtCaseId] = useState('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [debtCases, setDebtCases] = useState<DebtCaseForCall[]>([]);
  const [loadingDebtCases, setLoadingDebtCases] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestCall, setIsTestCall] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test call dynamic variables
  const [testContactName, setTestContactName] = useState('');
  const [testCompanyName, setTestCompanyName] = useState('');
  const [testInvoiceNumber, setTestInvoiceNumber] = useState('');
  const [testInvoiceAmount, setTestInvoiceAmount] = useState('');

  // Load customers on mount
  useEffect(() => {
    getCustomersForCalls().then((result) => {
      if (result.success && result.data) {
        setCustomers(result.data);
      }
    });
  }, []);

  // Load debt cases when customer changes
  useEffect(() => {
    if (customerId) {
      setLoadingDebtCases(true);
      setDebtCaseId('');
      getDebtCasesForCustomer(customerId).then((result) => {
        if (result.success && result.data) {
          setDebtCases(result.data);
          // Auto-select first debt case if available
          if (result.data.length > 0) {
            setDebtCaseId(result.data[0].id);
          }
        }
        setLoadingDebtCases(false);
      });
    } else {
      setDebtCases([]);
      setDebtCaseId('');
    }
  }, [customerId]);

  // Auto-fill phone when customer is selected
  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    const customer = customers.find((c) => c.id === value);
    if (customer?.phone) {
      setPhoneNumber(customer.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isTestCall) {
        // Direct call to ElevenLabs (for testing)
        const agent = agents.find((a) => a.id === agentId);
        if (!agent?.elevenlabs_agent_id) {
          throw new Error('Agent not configured in ElevenLabs');
        }

        // Build dynamic variables for test call
        const dynamicVariables: Record<string, string> = {};
        if (testContactName) dynamicVariables.contact_name = testContactName;
        if (testCompanyName) dynamicVariables.company_name = testCompanyName;
        if (testInvoiceNumber) dynamicVariables.invoice_number = testInvoiceNumber;
        if (testInvoiceAmount) dynamicVariables.invoice_amount = testInvoiceAmount;

        const result = await initiateTestCall({
          agentId: agent.elevenlabs_agent_id,
          phoneNumber,
          dynamicVariables: Object.keys(dynamicVariables).length > 0 ? dynamicVariables : undefined,
        });

        if (!result.success) {
          throw new Error(result.error ?? 'Failed to initiate call');
        }
      } else {
        // Full call with DB tracking
        if (!customerId) {
          throw new Error('Select a customer');
        }

        const result = await initiateCall({
          voiceAgentId: agentId,
          customerId,
          debtCaseId: debtCaseId || undefined,
          phoneNumber,
        });

        if (!result.success) {
          throw new Error(result.error ?? 'Failed to initiate call');
        }
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number | string, currency: string) => {
    const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
    return `${num.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${currency}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="testCall"
          checked={isTestCall}
          onChange={(e) => setIsTestCall(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="testCall" className="text-sm text-muted-foreground">
          Test call (no tracking)
        </label>
      </div>

      {isTestCall && (
        <div className="space-y-3 p-3 rounded-lg border border-dashed bg-muted/30">
          <p className="text-sm font-medium text-muted-foreground">
            Dynamic Variables (for agent template)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">contact_name</label>
              <Input
                placeholder="Juan Pérez"
                value={testContactName}
                onChange={(e) => setTestContactName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">company_name</label>
              <Input
                placeholder="Mi Empresa S.L."
                value={testCompanyName}
                onChange={(e) => setTestCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">invoice_number</label>
              <Input
                placeholder="F-2024-001234"
                value={testInvoiceNumber}
                onChange={(e) => setTestInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">invoice_amount</label>
              <Input
                placeholder="1.500,00"
                value={testInvoiceAmount}
                onChange={(e) => setTestInvoiceAmount(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {!isTestCall && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer</label>
            <Select value={customerId} onValueChange={handleCustomerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {customerId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Debt Case / Invoice
                <span className="text-muted-foreground font-normal ml-1">(for dynamic variables)</span>
              </label>
              {loadingDebtCases ? (
                <div className="p-3 border rounded-lg text-sm text-muted-foreground">
                  Loading debt cases...
                </div>
              ) : debtCases.length === 0 ? (
                <div className="p-3 border rounded-lg text-sm text-muted-foreground">
                  No active debt cases for this customer
                </div>
              ) : (
                <Select value={debtCaseId} onValueChange={setDebtCaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select debt case" />
                  </SelectTrigger>
                  <SelectContent>
                    {debtCases.map((dc) => (
                      <SelectItem key={dc.id} value={dc.id}>
                        {dc.invoice_number ?? 'N/A'} - {formatCurrency(dc.total_debt, dc.currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {debtCaseId && debtCases.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                    Variables will be sent to agent:
                  </p>
                  <ul className="text-blue-700 dark:text-blue-400 text-xs space-y-0.5">
                    <li>• invoice_number, invoice_amount, invoice_due_date</li>
                    <li>• company_name, company_phone, company_email</li>
                    <li>• contact_name, debtor_name</li>
                    <li>• half_amount (for payment plans)</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Phone Number</label>
        <Input
          type="tel"
          placeholder="+34 600 000 000"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Voice Agent</label>
        <Select value={agentId} onValueChange={setAgentId}>
          <SelectTrigger>
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name} {!agent.elevenlabs_agent_id && '(not configured)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !phoneNumber || !agentId || (!isTestCall && !customerId)}
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                className="mr-2"
              >
                <Phone className="h-4 w-4" />
              </motion.div>
              Calling...
            </>
          ) : (
            <>
              <Phone className="h-4 w-4 mr-2" />
              {isTestCall ? 'Test Call' : 'Start Call'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// =============================================================================
// LINK AGENT FORM - Select existing ElevenLabs agent
// =============================================================================

interface LinkAgentFormProps {
  localAgents: VoiceAgent[];
  onClose: () => void;
}

interface ElevenLabsAgentOption {
  agent_id: string;
  name: string;
}

function LinkAgentForm({ localAgents, onClose }: LinkAgentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elevenLabsAgents, setElevenLabsAgents] = useState<ElevenLabsAgentOption[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Form state
  const [selectedElevenLabsAgent, setSelectedElevenLabsAgent] = useState('');
  const [selectedLocalAgent, setSelectedLocalAgent] = useState('');

  // Load ElevenLabs agents on mount
  useEffect(() => {
    listElevenLabsAgents().then((result) => {
      if (result.success && result.data) {
        setElevenLabsAgents(result.data);
        if (result.data.length > 0) {
          setSelectedElevenLabsAgent(result.data[0].agent_id);
        }
      }
      setLoadingAgents(false);
    });
  }, []);

  // Auto-select first local agent
  useEffect(() => {
    if (localAgents.length > 0 && !selectedLocalAgent) {
      setSelectedLocalAgent(localAgents[0].id);
    }
  }, [localAgents, selectedLocalAgent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await linkElevenLabsAgent(selectedLocalAgent, selectedElevenLabsAgent);

      if (!result.success) {
        throw new Error(result.error ?? 'Failed to link agent');
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAgent = elevenLabsAgents.find((a) => a.agent_id === selectedElevenLabsAgent);
  const selectedLocal = localAgents.find((a) => a.id === selectedLocalAgent);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>ElevenLabs Agent</Label>
        {loadingAgents ? (
          <div className="p-4 border rounded-lg text-center text-muted-foreground">
            Loading agents from ElevenLabs...
          </div>
        ) : elevenLabsAgents.length === 0 ? (
          <div className="p-4 border rounded-lg text-center text-muted-foreground">
            No agents found in your ElevenLabs account
          </div>
        ) : (
          <Select value={selectedElevenLabsAgent} onValueChange={setSelectedElevenLabsAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Select ElevenLabs agent" />
            </SelectTrigger>
            <SelectContent>
              {elevenLabsAgents.map((agent) => (
                <SelectItem key={agent.agent_id} value={agent.agent_id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedAgent && (
        <div className="p-3 rounded-lg bg-muted text-sm">
          <p><strong>Agent ID:</strong> {selectedAgent.agent_id}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Local Agent to Link</Label>
        {localAgents.length === 0 ? (
          <div className="p-4 border rounded-lg text-center text-muted-foreground">
            No local agents found. Check RLS policies or create an agent first.
          </div>
        ) : (
          <Select value={selectedLocalAgent} onValueChange={setSelectedLocalAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Select local agent" />
            </SelectTrigger>
            <SelectContent>
              {localAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name} {agent.elevenlabs_agent_id ? '(linked)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedLocal?.elevenlabs_agent_id && (
        <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-sm text-yellow-800 dark:text-yellow-400">
          This agent is already linked. Clicking "Link Agent" will update the link.
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !selectedElevenLabsAgent || !selectedLocalAgent || loadingAgents}
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                className="mr-2"
              >
                <Microphone className="h-4 w-4" />
              </motion.div>
              Linking...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Link Agent
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
