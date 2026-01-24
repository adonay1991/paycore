'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EmptyPage, DollarCircle, WarningTriangle, ArrowRight } from 'iconoir-react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Button } from '@paycore/ui/components';
import { useAuth } from '@/lib/auth/context';
import { getAccountSummary, getMyInvoices } from '@/lib/api/client';
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

type AccountSummary = {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  invoiceCount: number;
  overdueCount: number;
};

export default function PortalDashboard() {
  const { session } = useAuth();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!session?.access_token) return;

      const [summaryResult, invoicesResult] = await Promise.all([
        getAccountSummary(session.access_token),
        getMyInvoices({ limit: 5 }, session.access_token),
      ]);

      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data);
      }
      if (invoicesResult.success && invoicesResult.data?.data) {
        setRecentInvoices(invoicesResult.data.data);
      }
      setLoading(false);
    }

    fetchData();
  }, [session?.access_token]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">
          Here's an overview of your account
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Outstanding
              </CardTitle>
              <DollarCircle className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-3xl font-bold">
                {formatCurrency(summary?.totalOutstanding ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Invoices
              </CardTitle>
              <EmptyPage className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold">{summary?.invoiceCount ?? 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className={summary?.overdueCount ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
              <WarningTriangle className={`h-5 w-5 ${summary?.overdueCount ? 'text-destructive' : 'text-muted-foreground'}`} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div>
                <p className={`text-3xl font-bold ${summary?.overdueCount ? 'text-destructive' : ''}`}>
                  {formatCurrency(summary?.overdueAmount ?? 0)}
                </p>
                {summary?.overdueCount ? (
                  <p className="text-sm text-destructive mt-1">
                    {summary.overdueCount} invoice{summary.overdueCount > 1 ? 's' : ''} overdue
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <Link href="/portal/invoices">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : recentInvoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No invoices yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/portal/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{invoice.number}</p>
                    <p className="text-sm text-muted-foreground">
                      Due {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(invoice.total))}</p>
                    <p className={`text-sm ${
                      invoice.status === 'paid' ? 'text-green-600' :
                      invoice.status === 'overdue' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).replace('_', ' ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
