'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Send, Trash, Download } from 'iconoir-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
} from '@paycore/ui/components';
import { useAuth } from '@/lib/auth/context';
import { getInvoice, sendInvoice, deleteInvoice } from '@/lib/api/client';
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
    month: 'long',
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

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { session } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      if (!session?.access_token) return;

      const result = await getInvoice(id, session.access_token);
      if (result.success && result.data) {
        setInvoice(result.data);
      }
      setLoading(false);
    }

    fetchInvoice();
  }, [id, session?.access_token]);

  const handleSend = async () => {
    if (!session?.access_token || !invoice) return;

    setSending(true);
    const result = await sendInvoice(invoice.id, session.access_token);
    if (result.success && result.data) {
      setInvoice(result.data);
    }
    setSending(false);
  };

  const handleDelete = async () => {
    if (!session?.access_token || !invoice) return;
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    const result = await deleteInvoice(invoice.id, session.access_token);
    if (result.success) {
      router.push('/invoices');
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
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Link href="/invoices">
          <Button variant="outline" className="mt-4">
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Invoice {invoice.number}</h2>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(invoice.status)}
              <span className="text-muted-foreground">
                Created {formatDate(invoice.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === 'draft' && (
            <Button onClick={handleSend} disabled={sending}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Invoice'}
            </Button>
          )}
          <Link href={`/invoices/${invoice.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{invoice.customerId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                </p>
              </div>
            </div>

            {invoice.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1">{invoice.notes}</p>
              </div>
            )}

            {/* Line Items would go here */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(invoice.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(Number(invoice.taxAmount))}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(Number(invoice.total))}</span>
                </div>
              </div>
            </div>

            {invoice.paidAmount > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-green-600">
                    -{formatCurrency(Number(invoice.paidAmount))}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Balance Due</span>
                  <span>
                    {formatCurrency(Number(invoice.total) - Number(invoice.paidAmount))}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground">
                  {formatDate(invoice.createdAt)}
                </p>
                <p>Invoice created</p>
              </div>
              {invoice.sentAt && (
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    {formatDate(invoice.sentAt)}
                  </p>
                  <p>Invoice sent to customer</p>
                </div>
              )}
              {invoice.paidAt && (
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    {formatDate(invoice.paidAt)}
                  </p>
                  <p>Payment received</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
