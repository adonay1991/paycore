'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Download } from 'iconoir-react';
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
  Button,
  Skeleton,
} from '@paycore/ui/components';
import { useAuth } from '@/lib/auth/context';
import { getMyInvoices } from '@/lib/api/client';
import type { Invoice } from '@paycore/types';

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

function getStatusBadge(status: Invoice['status']) {
  const variants: Record<Invoice['status'], 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
    draft: 'secondary',
    pending: 'default',
    sent: 'info',
    paid: 'success',
    partial: 'warning',
    overdue: 'destructive',
    cancelled: 'secondary',
  };

  const labels: Record<Invoice['status'], string> = {
    draft: 'Draft',
    pending: 'Pending',
    sent: 'Sent',
    paid: 'Paid',
    partial: 'Partial',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

export default function InvoicesPage() {
  const { session } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      if (!session?.access_token) return;

      const result = await getMyInvoices({}, session.access_token);
      if (result.success && result.data?.data) {
        setInvoices(result.data.data);
      }
      setLoading(false);
    }

    fetchInvoices();
  }, [session?.access_token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground">View and manage your invoices</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.number}
                    </TableCell>
                    <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell>
                      {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(invoice.total))}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/portal/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon-sm" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
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
