'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash } from 'iconoir-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@paycore/ui/components';
import { useAuth } from '@/lib/auth/context';
import { createInvoice, getCustomers } from '@/lib/api/client';
import type { Customer } from '@paycore/types';

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export default function NewInvoicePage() {
  const router = useRouter();
  const { session } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    dueDate: '',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, taxRate: 21 },
  ]);

  useEffect(() => {
    async function fetchCustomers() {
      if (!session?.access_token) return;
      const result = await getCustomers({}, session.access_token);
      if (result.success && result.data?.data) {
        setCustomers(result.data.data);
      }
    }
    fetchCustomers();
  }, [session?.access_token]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: String(Date.now()),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 21,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTax = () => {
    return lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100),
      0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    const invoiceData = {
      customerId: formData.customerId,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      notes: formData.notes || undefined,
      items: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      })),
    };

    const result = await createInvoice(invoiceData, session.access_token);

    if (result.success && result.data) {
      router.push(`/invoices/${result.data.id}`);
    } else {
      setError(result.error?.message || 'Failed to create invoice');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">New Invoice</h2>
          <p className="text-muted-foreground">Create a new invoice for your customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer & Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, customerId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes for the invoice..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-3 items-end"
                    >
                      <div className="col-span-5 space-y-1">
                        {index === 0 && (
                          <Label className="text-xs">Description</Label>
                        )}
                        <Input
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(item.id, 'description', e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        {index === 0 && <Label className="text-xs">Qty</Label>}
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              'quantity',
                              Number.parseInt(e.target.value) || 1
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        {index === 0 && <Label className="text-xs">Price</Label>}
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              'unitPrice',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        {index === 0 && <Label className="text-xs">Tax %</Label>}
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxRate}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              'taxRate',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(calculateTax())}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading || !formData.customerId}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Create Invoice'}
              </Button>
              <Link href="/invoices" className="w-full">
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
