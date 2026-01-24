'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'iconoir-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
} from '@paycore/ui/components';
import { useAuth } from '@/lib/auth/context';
import { createPayment, processPayment, getInvoices } from '@/lib/api/client';
import type { Invoice } from '@paycore/types';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    invoiceId: searchParams.get('invoiceId') || '',
    amount: '',
    method: 'bank_transfer' as 'bank_transfer' | 'card' | 'direct_debit' | 'cash' | 'other',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  });

  useEffect(() => {
    async function fetchInvoices() {
      if (!session?.access_token) return;
      const result = await getInvoices({ status: 'sent' }, session.access_token);
      if (result.success && result.data?.data) {
        // Include partial and overdue invoices as well
        const unpaidInvoices = result.data.data.filter(
          (inv) => inv.status !== 'paid' && inv.status !== 'cancelled'
        );
        setInvoices(unpaidInvoices);
      }
    }
    fetchInvoices();
  }, [session?.access_token]);

  useEffect(() => {
    if (formData.invoiceId) {
      const invoice = invoices.find((inv) => inv.id === formData.invoiceId);
      setSelectedInvoice(invoice || null);
      if (invoice) {
        const balance = Number(invoice.total) - Number(invoice.paidAmount);
        setFormData((prev) => ({ ...prev, amount: balance.toFixed(2) }));
      }
    }
  }, [formData.invoiceId, invoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    const paymentData = {
      invoiceId: formData.invoiceId,
      amount: Number.parseFloat(formData.amount),
      method: formData.method,
      paymentDate: new Date(formData.paymentDate),
      reference: formData.reference || undefined,
      notes: formData.notes || undefined,
    };

    const createResult = await createPayment(paymentData, session.access_token);

    if (!createResult.success || !createResult.data) {
      setError(createResult.error?.message || 'Failed to create payment');
      setLoading(false);
      return;
    }

    // Immediately process the payment
    const processResult = await processPayment(
      createResult.data.id,
      formData.reference || undefined,
      session.access_token
    );

    if (processResult.success && processResult.data) {
      router.push(`/payments/${processResult.data.id}`);
    } else {
      // Payment created but processing failed
      router.push(`/payments/${createResult.data.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Record Payment</h2>
          <p className="text-muted-foreground">Record a new payment against an invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="invoice">Invoice</Label>
                  <Select
                    value={formData.invoiceId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, invoiceId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.number} - {formatCurrency(Number(invoice.total) - Number(invoice.paidAmount))} due
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="method">Payment Method</Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          method: value as typeof formData.method,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="direct_debit">Direct Debit</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference / Transaction ID</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) =>
                        setFormData({ ...formData, reference: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {selectedInvoice && (
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice Total</span>
                    <span>{formatCurrency(Number(selectedInvoice.total))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Already Paid</span>
                    <span className="text-green-600">
                      -{formatCurrency(Number(selectedInvoice.paidAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-3">
                    <span>Balance Due</span>
                    <span>
                      {formatCurrency(
                        Number(selectedInvoice.total) - Number(selectedInvoice.paidAmount)
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading || !formData.invoiceId || !formData.amount}
                className="w-full"
              >
                {loading ? 'Processing...' : 'Record Payment'}
              </Button>
              <Link href="/payments" className="w-full">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
