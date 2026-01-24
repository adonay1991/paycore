'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Undo } from 'iconoir-react';
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
import { getPayments, refundPayment } from '@/lib/api/client';
import type { Payment } from '@paycore/types';

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

function getStatusBadge(status: Payment['status']) {
  const variants: Record<Payment['status'], 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    pending: 'warning',
    processing: 'secondary',
    completed: 'success',
    failed: 'destructive',
    refunded: 'secondary',
    cancelled: 'secondary',
  };

  const labels: Record<Payment['status'], string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

function getMethodLabel(method: Payment['method']) {
  const labels: Record<Payment['method'], string> = {
    bank_transfer: 'Bank Transfer',
    card: 'Card',
    direct_debit: 'Direct Debit',
    cash: 'Cash',
    other: 'Other',
  };
  return labels[method];
}

export default function PaymentsPage() {
  const { session } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refunding, setRefunding] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      if (!session?.access_token) return;

      const result = await getPayments(
        { status: statusFilter !== 'all' ? statusFilter : undefined },
        session.access_token
      );
      if (result.success && result.data?.data) {
        setPayments(result.data.data);
      }
      setLoading(false);
    }

    fetchPayments();
  }, [session?.access_token, statusFilter]);

  const handleRefund = async (id: string) => {
    if (!session?.access_token) return;
    if (!confirm('Are you sure you want to refund this payment?')) return;

    setRefunding(id);
    const result = await refundPayment(id, session.access_token);
    if (result.success && result.data) {
      setPayments(payments.map((p) => (p.id === id ? result.data! : p)));
    }
    setRefunding(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payments</h2>
          <p className="text-muted-foreground">Track and manage payment transactions</p>
        </div>
        <Link href="/payments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/invoices/${payment.invoiceId}`}
                        className="text-primary hover:underline"
                      >
                        {payment.invoiceId.slice(0, 8)}...
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell>{getMethodLabel(payment.method)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/payments/${payment.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {payment.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRefund(payment.id)}
                            disabled={refunding === payment.id}
                            title="Refund"
                          >
                            <Undo className="h-4 w-4" />
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
