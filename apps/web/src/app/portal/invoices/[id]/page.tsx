'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, CreditCard } from 'iconoir-react';
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
import { getMyInvoice } from '@/lib/api/client';
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
    sent: 'Pending Payment',
    paid: 'Paid',
    partial: 'Partially Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  };

  return (
    <Badge variant={variants[status]} className="text-base px-3 py-1">
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
  const { session } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoice() {
      if (!session?.access_token) return;

      const result = await getMyInvoice(id, session.access_token);
      if (result.success && result.data) {
        setInvoice(result.data);
      }
      setLoading(false);
    }

    fetchInvoice();
  }, [id, session?.access_token]);

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

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Link href="/portal/invoices">
          <Button variant="outline" className="mt-4">
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const balance = Number(invoice.total) - Number(invoice.paidAmount);
  const canPay = ['sent', 'partial', 'overdue', 'pending'].includes(invoice.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/portal/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Invoice {invoice.number}</h1>
            <p className="text-muted-foreground">
              Issued {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(invoice.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {invoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{invoice.notes}</p>
                </div>
              )}

              {/* Line Items would be rendered here */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(invoice.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(Number(invoice.taxAmount))}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(Number(invoice.total))}</span>
                </div>
              </div>

              {invoice.paidAmount > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-green-600">
                    <span>Paid</span>
                    <span>-{formatCurrency(Number(invoice.paidAmount))}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>Balance Due</span>
                    <span>{formatCurrency(balance)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canPay ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Due</p>
                    <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
                    {invoice.dueDate && (
                      <p className={`text-sm ${invoice.status === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        Due {formatDate(invoice.dueDate)}
                      </p>
                    )}
                  </div>
                  <Button className="w-full" size="lg">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay Now
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Secure payment powered by Stripe
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  {invoice.status === 'paid' ? (
                    <p className="text-green-600 font-medium">Paid in full</p>
                  ) : (
                    <p className="text-muted-foreground">No payment required</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </CardContent>
          </Card>

          {invoice.dueDate && (
            <Card>
              <CardHeader>
                <CardTitle>Due Date</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-lg font-medium ${invoice.status === 'overdue' ? 'text-destructive' : ''}`}>
                  {formatDate(invoice.dueDate)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
