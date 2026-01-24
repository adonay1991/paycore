'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
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
} from '@paycore/ui/components';
import { useAuth } from '@/lib/auth/context';
import { getMyPayments } from '@/lib/api/client';
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

  useEffect(() => {
    async function fetchPayments() {
      if (!session?.access_token) return;

      const result = await getMyPayments({}, session.access_token);
      if (result.success && result.data?.data) {
        setPayments(result.data.data);
      }
      setLoading(false);
    }

    fetchPayments();
  }, [session?.access_token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">View your payment transactions</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/portal/invoices/${payment.invoiceId}`}
                        className="text-primary hover:underline"
                      >
                        View Invoice
                      </Link>
                    </TableCell>
                    <TableCell>{getMethodLabel(payment.method)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
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
