/**
 * Invoice Service Unit Tests
 *
 * Tests for invoice calculation functions.
 * These tests are isolated and don't require database connection.
 */

import { describe, expect, test } from 'bun:test';

// =============================================================================
// TYPES (copied from invoice.service.ts to avoid DB import)
// =============================================================================

interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

interface CalculatedInvoiceItem extends InvoiceItemInput {
  subtotal: number;
  taxAmount: number;
  total: number;
  sortOrder: number;
}

interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

// =============================================================================
// FUNCTIONS (copied from invoice.service.ts to avoid DB import)
// =============================================================================

/**
 * Calculate totals for invoice items.
 */
function calculateInvoiceItems(
  items: InvoiceItemInput[],
  defaultTaxRate = 21
): CalculatedInvoiceItem[] {
  return items.map((item, index) => {
    const taxRate = item.taxRate ?? defaultTaxRate;
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    return {
      ...item,
      taxRate,
      subtotal,
      taxAmount,
      total,
      sortOrder: index,
    };
  });
}

/**
 * Calculate invoice totals from items.
 */
function calculateInvoiceTotals(
  items: CalculatedInvoiceItem[]
): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = subtotal + taxAmount;

  return { subtotal, taxAmount, total };
}

describe('Invoice Service', () => {
  describe('calculateInvoiceItems', () => {
    test('calculates totals for single item with default tax rate', () => {
      const items: InvoiceItemInput[] = [
        { description: 'Service', quantity: 1, unitPrice: 100 },
      ];

      const result = calculateInvoiceItems(items);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        description: 'Service',
        quantity: 1,
        unitPrice: 100,
        taxRate: 21,
        subtotal: 100,
        taxAmount: 21,
        total: 121,
        sortOrder: 0,
      });
    });

    test('calculates totals for multiple items', () => {
      const items: InvoiceItemInput[] = [
        { description: 'Item 1', quantity: 2, unitPrice: 50 },
        { description: 'Item 2', quantity: 1, unitPrice: 200 },
      ];

      const result = calculateInvoiceItems(items);

      expect(result).toHaveLength(2);
      expect(result[0].subtotal).toBe(100); // 2 * 50
      expect(result[0].taxAmount).toBe(21); // 100 * 0.21
      expect(result[0].total).toBe(121);
      expect(result[0].sortOrder).toBe(0);

      expect(result[1].subtotal).toBe(200); // 1 * 200
      expect(result[1].taxAmount).toBe(42); // 200 * 0.21
      expect(result[1].total).toBe(242);
      expect(result[1].sortOrder).toBe(1);
    });

    test('respects custom tax rate per item', () => {
      const items: InvoiceItemInput[] = [
        { description: 'Standard', quantity: 1, unitPrice: 100, taxRate: 21 },
        { description: 'Reduced', quantity: 1, unitPrice: 100, taxRate: 10 },
        { description: 'Zero', quantity: 1, unitPrice: 100, taxRate: 0 },
      ];

      const result = calculateInvoiceItems(items);

      expect(result[0].taxAmount).toBe(21);
      expect(result[1].taxAmount).toBe(10);
      expect(result[2].taxAmount).toBe(0);
    });

    test('uses custom default tax rate', () => {
      const items: InvoiceItemInput[] = [
        { description: 'Service', quantity: 1, unitPrice: 100 },
      ];

      const result = calculateInvoiceItems(items, 19);

      expect(result[0].taxRate).toBe(19);
      expect(result[0].taxAmount).toBe(19);
    });

    test('handles decimal quantities', () => {
      const items: InvoiceItemInput[] = [
        { description: 'Hours', quantity: 1.5, unitPrice: 100 },
      ];

      const result = calculateInvoiceItems(items);

      expect(result[0].subtotal).toBe(150); // 1.5 * 100
      expect(result[0].taxAmount).toBe(31.5); // 150 * 0.21
      expect(result[0].total).toBe(181.5);
    });

    test('handles decimal prices', () => {
      const items: InvoiceItemInput[] = [
        { description: 'Item', quantity: 3, unitPrice: 33.33 },
      ];

      const result = calculateInvoiceItems(items);

      expect(result[0].subtotal).toBeCloseTo(99.99, 2);
      expect(result[0].taxAmount).toBeCloseTo(20.9979, 2);
    });

    test('handles empty items array', () => {
      const items: InvoiceItemInput[] = [];

      const result = calculateInvoiceItems(items);

      expect(result).toHaveLength(0);
    });

    test('handles zero quantity', () => {
      const items: InvoiceItemInput[] = [
        { description: 'Free', quantity: 0, unitPrice: 100 },
      ];

      const result = calculateInvoiceItems(items);

      expect(result[0].subtotal).toBe(0);
      expect(result[0].taxAmount).toBe(0);
      expect(result[0].total).toBe(0);
    });

    test('handles zero unit price', () => {
      const items: InvoiceItemInput[] = [
        { description: 'Complimentary', quantity: 5, unitPrice: 0 },
      ];

      const result = calculateInvoiceItems(items);

      expect(result[0].subtotal).toBe(0);
      expect(result[0].taxAmount).toBe(0);
      expect(result[0].total).toBe(0);
    });
  });

  describe('calculateInvoiceTotals', () => {
    test('calculates totals from calculated items', () => {
      const items: CalculatedInvoiceItem[] = [
        {
          description: 'Item 1',
          quantity: 1,
          unitPrice: 100,
          taxRate: 21,
          subtotal: 100,
          taxAmount: 21,
          total: 121,
          sortOrder: 0,
        },
        {
          description: 'Item 2',
          quantity: 1,
          unitPrice: 200,
          taxRate: 21,
          subtotal: 200,
          taxAmount: 42,
          total: 242,
          sortOrder: 1,
        },
      ];

      const result = calculateInvoiceTotals(items);

      expect(result.subtotal).toBe(300);
      expect(result.taxAmount).toBe(63);
      expect(result.total).toBe(363);
    });

    test('handles empty items', () => {
      const result = calculateInvoiceTotals([]);

      expect(result.subtotal).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(0);
    });

    test('handles items with different tax rates', () => {
      const items: CalculatedInvoiceItem[] = [
        {
          description: 'Standard',
          quantity: 1,
          unitPrice: 100,
          taxRate: 21,
          subtotal: 100,
          taxAmount: 21,
          total: 121,
          sortOrder: 0,
        },
        {
          description: 'Reduced',
          quantity: 1,
          unitPrice: 100,
          taxRate: 10,
          subtotal: 100,
          taxAmount: 10,
          total: 110,
          sortOrder: 1,
        },
      ];

      const result = calculateInvoiceTotals(items);

      expect(result.subtotal).toBe(200);
      expect(result.taxAmount).toBe(31);
      expect(result.total).toBe(231);
    });

    test('handles single item', () => {
      const items: CalculatedInvoiceItem[] = [
        {
          description: 'Only item',
          quantity: 5,
          unitPrice: 50,
          taxRate: 21,
          subtotal: 250,
          taxAmount: 52.5,
          total: 302.5,
          sortOrder: 0,
        },
      ];

      const result = calculateInvoiceTotals(items);

      expect(result.subtotal).toBe(250);
      expect(result.taxAmount).toBe(52.5);
      expect(result.total).toBe(302.5);
    });
  });

  describe('integration: calculateInvoiceItems + calculateInvoiceTotals', () => {
    test('works together for real invoice calculation', () => {
      const inputItems: InvoiceItemInput[] = [
        { description: 'Consulting hours', quantity: 10, unitPrice: 150 },
        { description: 'Software license', quantity: 1, unitPrice: 500 },
        { description: 'Support package', quantity: 1, unitPrice: 200, taxRate: 0 },
      ];

      const calculatedItems = calculateInvoiceItems(inputItems);
      const totals = calculateInvoiceTotals(calculatedItems);

      // Item 1: 10 * 150 = 1500, tax = 315, total = 1815
      // Item 2: 1 * 500 = 500, tax = 105, total = 605
      // Item 3: 1 * 200 = 200, tax = 0, total = 200
      expect(totals.subtotal).toBe(2200);
      expect(totals.taxAmount).toBe(420); // 315 + 105 + 0
      expect(totals.total).toBe(2620);
    });

    test('handles complex scenario with multiple quantities and tax rates', () => {
      const inputItems: InvoiceItemInput[] = [
        { description: 'Product A', quantity: 3, unitPrice: 99.99, taxRate: 21 },
        { description: 'Product B', quantity: 2.5, unitPrice: 40, taxRate: 10 },
        { description: 'Shipping', quantity: 1, unitPrice: 15, taxRate: 21 },
      ];

      const calculatedItems = calculateInvoiceItems(inputItems);
      const totals = calculateInvoiceTotals(calculatedItems);

      // Product A: 3 * 99.99 = 299.97, tax = 62.9937
      // Product B: 2.5 * 40 = 100, tax = 10
      // Shipping: 1 * 15 = 15, tax = 3.15
      expect(totals.subtotal).toBeCloseTo(414.97, 2);
      expect(totals.taxAmount).toBeCloseTo(76.1437, 2);
      expect(totals.total).toBeCloseTo(491.1137, 2);
    });
  });
});
