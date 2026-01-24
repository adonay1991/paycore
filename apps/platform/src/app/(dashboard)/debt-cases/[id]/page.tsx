'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Send, Plus } from 'iconoir-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@paycore/ui/components';
import { useAuth } from '@/lib/auth/context';
import {
  getDebtCase,
  getDebtCaseActivities,
  addDebtCaseActivity,
  updateDebtCase,
} from '@/lib/api/client';
import type { DebtCase, DebtCaseActivity } from '@paycore/types';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function getStatusBadge(status: DebtCase['status']) {
  const variants: Record<DebtCase['status'], 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
    new: 'info',
    contacted: 'default',
    in_progress: 'warning',
    payment_plan: 'default',
    resolved: 'success',
    escalated: 'destructive',
    legal: 'destructive',
    closed: 'secondary',
    written_off: 'secondary',
  };

  const labels: Record<DebtCase['status'], string> = {
    new: 'New',
    contacted: 'Contacted',
    in_progress: 'In Progress',
    payment_plan: 'Payment Plan',
    resolved: 'Resolved',
    escalated: 'Escalated',
    legal: 'Legal',
    closed: 'Closed',
    written_off: 'Written Off',
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

function getPriorityBadge(priority: DebtCase['priority']) {
  const variants: Record<DebtCase['priority'], 'default' | 'secondary' | 'warning' | 'destructive'> = {
    low: 'secondary',
    medium: 'default',
    high: 'warning',
    critical: 'destructive',
  };

  return (
    <Badge variant={variants[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

function getActivityIcon(action: string) {
  const icons: Record<string, string> = {
    note: '📝',
    call: '📞',
    email: '📧',
    letter: '✉️',
    payment: '💰',
    status_change: '🔄',
    assignment: '👤',
    escalation: '⚠️',
    created: '🆕',
    updated: '✏️',
    deleted: '🗑️',
    viewed: '👁️',
    sent: '📤',
    paid: '💰',
    assigned: '👤',
    comment_added: '💬',
    exported: '📥',
  };
  return icons[action] || '📌';
}

export default function DebtCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { session, user } = useAuth();
  const [debtCase, setDebtCase] = useState<DebtCase | null>(null);
  const [activities, setActivities] = useState<DebtCaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivity, setNewActivity] = useState({
    type: 'note',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!session?.access_token) return;

      const [caseResult, activitiesResult] = await Promise.all([
        getDebtCase(id, session.access_token),
        getDebtCaseActivities(id, {}, session.access_token),
      ]);

      if (caseResult.success && caseResult.data) {
        setDebtCase(caseResult.data);
      }
      if (activitiesResult.success && activitiesResult.data?.data) {
        setActivities(activitiesResult.data.data);
      }
      setLoading(false);
    }

    fetchData();
  }, [id, session?.access_token]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token || !newActivity.notes.trim()) return;

    setSubmitting(true);
    const result = await addDebtCaseActivity(
      id,
      { type: newActivity.type, notes: newActivity.notes },
      session.access_token
    );

    if (result.success && result.data) {
      setActivities([result.data, ...activities]);
      setNewActivity({ type: 'note', notes: '' });
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (newStatus: DebtCase['status']) => {
    if (!session?.access_token || !debtCase) return;

    const result = await updateDebtCase(
      id,
      { status: newStatus },
      session.access_token
    );

    if (result.success && result.data) {
      setDebtCase(result.data);
      // Refresh activities to show status change
      const activitiesResult = await getDebtCaseActivities(id, {}, session.access_token);
      if (activitiesResult.success && activitiesResult.data?.data) {
        setActivities(activitiesResult.data.data);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!debtCase) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Debt case not found</p>
        <Link href="/debt-cases">
          <Button variant="outline" className="mt-4">
            Back to Debt Cases
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/debt-cases">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Case #{debtCase.id.slice(0, 8)}</h2>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(debtCase.status)}
              {getPriorityBadge(debtCase.priority)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={debtCase.status}
            onValueChange={(value) => handleStatusChange(value as DebtCase['status'])}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="payment_plan">Payment Plan</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="written_off">Written Off</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice</p>
                  <Link
                    href={`/invoices/${debtCase.invoiceId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    View Invoice
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <span className="font-medium">{debtCase.companyId.slice(0, 8)}...</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Debt</p>
                  <p className="text-xl font-bold text-destructive">
                    {formatCurrency(Number(debtCase.totalDebt))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opened</p>
                  <p className="font-medium">{formatDate(debtCase.createdAt)}</p>
                </div>
              </div>

              {debtCase.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{debtCase.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddActivity} className="mb-6 space-y-3">
                <div className="flex gap-3">
                  <Select
                    value={newActivity.type}
                    onValueChange={(value) =>
                      setNewActivity({ ...newActivity, type: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Add activity notes..."
                    value={newActivity.notes}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, notes: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Button type="submit" disabled={submitting || !newActivity.notes.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No activities yet.
                  </p>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <span className="text-xl">{getActivityIcon(activity.action)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">
                            {activity.action.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(activity.createdAt)}
                          </p>
                        </div>
                        {activity.notes && (
                          <p className="text-sm mt-1">{activity.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {debtCase.assignedToId ? (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{debtCase.assignedToId}</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">Not assigned</p>
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Send className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
              <Link href={`/payments/new?invoiceId=${debtCase.invoiceId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  💰 Record Payment
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground">Case Opened</p>
                <p className="font-medium">{formatDate(debtCase.createdAt)}</p>
              </div>
              {debtCase.lastContactAt && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Last Contact</p>
                  <p className="font-medium">{formatDate(debtCase.lastContactAt)}</p>
                </div>
              )}
              {debtCase.nextActionAt && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Next Action</p>
                  <p className="font-medium">{formatDate(debtCase.nextActionAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
