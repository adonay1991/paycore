'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, UserPlus } from 'iconoir-react';
import {
  Button,
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Skeleton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@paycore/ui/components';
import { useAuth } from '@/lib/auth/context';
import { getDebtCases } from '@/lib/api/client';
import type { DebtCase } from '@paycore/types';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

export default function DebtCasesPage() {
  const { session } = useAuth();
  const [debtCases, setDebtCases] = useState<DebtCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchDebtCases() {
      if (!session?.access_token) return;

      const result = await getDebtCases(
        {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        },
        session.access_token
      );
      if (result.success && result.data?.data) {
        setDebtCases(result.data.data);
      }
      setLoading(false);
    }

    fetchDebtCases();
  }, [session?.access_token, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Debt Cases</h2>
          <p className="text-muted-foreground">Manage debt recovery cases</p>
        </div>
        <Link href="/debt-cases/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
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
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case #</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Debt Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : debtCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No debt cases found.
                  </TableCell>
                </TableRow>
              ) : (
                debtCases.map((debtCase) => (
                  <TableRow key={debtCase.id}>
                    <TableCell className="font-medium">
                      #{debtCase.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{debtCase.invoiceId.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(debtCase.totalDebt))}
                    </TableCell>
                    <TableCell>{getStatusBadge(debtCase.status)}</TableCell>
                    <TableCell>{getPriorityBadge(debtCase.priority)}</TableCell>
                    <TableCell>
                      {debtCase.assignedToId ? (
                        <span>{debtCase.assignedToId.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/debt-cases/${debtCase.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {!debtCase.assignedToId && (
                          <Button variant="ghost" size="icon-sm" title="Assign">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
