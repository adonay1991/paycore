/**
 * Zod Validators Unit Tests
 *
 * Tests for input validation schemas.
 */

import { describe, expect, test } from 'bun:test';
import {
  uuidSchema,
  emailSchema,
  phoneSchema,
  currencySchema,
  paginationSchema,
  createCompanySchema,
  createCustomerSchema,
  createInvoiceSchema,
  createInvoiceItemSchema,
  createPaymentSchema,
  createDebtCaseSchema,
  invoiceStatusSchema,
  paymentStatusSchema,
  paymentMethodSchema,
  debtCaseStatusSchema,
  debtCasePrioritySchema,
  userRoleSchema,
} from '../index';

describe('Common Schemas', () => {
  describe('uuidSchema', () => {
    test('accepts valid UUIDs', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '123e4567-e89b-12d3-a456-426614174000',
      ];

      for (const uuid of validUUIDs) {
        const result = uuidSchema.safeParse(uuid);
        expect(result.success).toBe(true);
      }
    });

    test('rejects invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123',
        '',
        '550e8400-e29b-41d4-a716-44665544000', // Too short
        '550e8400-e29b-41d4-a716-4466554400000', // Too long
        'GGGGGGGG-GGGG-GGGG-GGGG-GGGGGGGGGGGG', // Invalid chars
      ];

      for (const uuid of invalidUUIDs) {
        const result = uuidSchema.safeParse(uuid);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('emailSchema', () => {
    test('accepts valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@example.co.uk',
        'name@subdomain.domain.com',
      ];

      for (const email of validEmails) {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      }
    });

    test('rejects invalid emails', () => {
      const invalidEmails = [
        'not-an-email',
        '@missing-local.com',
        'missing-at-sign.com',
        'missing@domain',
        '',
      ];

      for (const email of invalidEmails) {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      }
    });

    test('rejects emails longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      const result = emailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('phoneSchema', () => {
    test('accepts valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+1 (555) 123-4567',
        '555-123-4567',
        '(555) 123 4567',
      ];

      for (const phone of validPhones) {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(true);
      }
    });

    test('accepts null and undefined', () => {
      expect(phoneSchema.safeParse(null).success).toBe(true);
      expect(phoneSchema.safeParse(undefined).success).toBe(true);
    });

    test('rejects invalid phone numbers', () => {
      const invalidPhones = [
        'abc123',
        'phone: 123',
        '123-abc-4567',
      ];

      for (const phone of invalidPhones) {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('currencySchema', () => {
    test('accepts valid currencies', () => {
      expect(currencySchema.safeParse('EUR').success).toBe(true);
      expect(currencySchema.safeParse('USD').success).toBe(true);
      expect(currencySchema.safeParse('GBP').success).toBe(true);
    });

    test('rejects invalid currencies', () => {
      expect(currencySchema.safeParse('JPY').success).toBe(false);
      expect(currencySchema.safeParse('eur').success).toBe(false);
      expect(currencySchema.safeParse('').success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    test('provides default values', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    test('accepts valid pagination params', () => {
      const result = paginationSchema.safeParse({
        cursor: 'abc123',
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });
      expect(result.success).toBe(true);
    });

    test('coerces string limit to number', () => {
      const result = paginationSchema.safeParse({ limit: '25' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    test('rejects limit below 1', () => {
      const result = paginationSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    test('rejects limit above 100', () => {
      const result = paginationSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    test('rejects invalid sort order', () => {
      const result = paginationSchema.safeParse({ sortOrder: 'random' });
      expect(result.success).toBe(false);
    });
  });
});

describe('Enum Schemas', () => {
  describe('invoiceStatusSchema', () => {
    test('accepts all valid statuses', () => {
      const validStatuses = [
        'draft',
        'pending',
        'sent',
        'paid',
        'partial',
        'overdue',
        'cancelled',
      ];

      for (const status of validStatuses) {
        expect(invoiceStatusSchema.safeParse(status).success).toBe(true);
      }
    });

    test('rejects invalid statuses', () => {
      expect(invoiceStatusSchema.safeParse('completed').success).toBe(false);
      expect(invoiceStatusSchema.safeParse('').success).toBe(false);
    });
  });

  describe('paymentStatusSchema', () => {
    test('accepts all valid statuses', () => {
      const validStatuses = [
        'pending',
        'processing',
        'completed',
        'failed',
        'refunded',
        'cancelled',
      ];

      for (const status of validStatuses) {
        expect(paymentStatusSchema.safeParse(status).success).toBe(true);
      }
    });
  });

  describe('paymentMethodSchema', () => {
    test('accepts all valid methods', () => {
      const validMethods = [
        'bank_transfer',
        'card',
        'direct_debit',
        'cash',
        'other',
      ];

      for (const method of validMethods) {
        expect(paymentMethodSchema.safeParse(method).success).toBe(true);
      }
    });
  });

  describe('debtCaseStatusSchema', () => {
    test('accepts all valid statuses', () => {
      const validStatuses = [
        'new',
        'contacted',
        'in_progress',
        'payment_plan',
        'resolved',
        'escalated',
        'legal',
        'closed',
        'written_off',
      ];

      for (const status of validStatuses) {
        expect(debtCaseStatusSchema.safeParse(status).success).toBe(true);
      }
    });
  });

  describe('debtCasePrioritySchema', () => {
    test('accepts all valid priorities', () => {
      const validPriorities = ['low', 'medium', 'high', 'critical'];

      for (const priority of validPriorities) {
        expect(debtCasePrioritySchema.safeParse(priority).success).toBe(true);
      }
    });
  });

  describe('userRoleSchema', () => {
    test('accepts all valid roles', () => {
      const validRoles = ['admin', 'manager', 'user', 'readonly'];

      for (const role of validRoles) {
        expect(userRoleSchema.safeParse(role).success).toBe(true);
      }
    });
  });
});

describe('Entity Schemas', () => {
  describe('createCompanySchema', () => {
    const validCompany = {
      name: 'Test Company',
      taxId: 'NL123456789B01',
      address: '123 Main Street',
      city: 'Amsterdam',
      postalCode: '1012 AB',
      country: 'NL',
      email: 'contact@test.com',
    };

    test('accepts valid company data', () => {
      const result = createCompanySchema.safeParse(validCompany);
      expect(result.success).toBe(true);
    });

    test('requires all mandatory fields', () => {
      const requiredFields = ['name', 'taxId', 'address', 'city', 'postalCode', 'country', 'email'];

      for (const field of requiredFields) {
        const data = { ...validCompany };
        delete data[field as keyof typeof data];
        const result = createCompanySchema.safeParse(data);
        expect(result.success).toBe(false);
      }
    });

    test('uppercases country code', () => {
      const result = createCompanySchema.safeParse({
        ...validCompany,
        country: 'nl',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.country).toBe('NL');
      }
    });

    test('rejects invalid country code length', () => {
      const result = createCompanySchema.safeParse({
        ...validCompany,
        country: 'NLD',
      });
      expect(result.success).toBe(false);
    });

    test('defaults currency to EUR', () => {
      const result = createCompanySchema.safeParse(validCompany);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('EUR');
      }
    });

    test('accepts optional phone', () => {
      const result = createCompanySchema.safeParse({
        ...validCompany,
        phone: '+31 20 123 4567',
      });
      expect(result.success).toBe(true);
    });

    test('accepts optional website', () => {
      const result = createCompanySchema.safeParse({
        ...validCompany,
        website: 'https://example.com',
      });
      expect(result.success).toBe(true);
    });

    test('rejects invalid website URL', () => {
      const result = createCompanySchema.safeParse({
        ...validCompany,
        website: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createCustomerSchema', () => {
    const validCustomer = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Customer',
      email: 'customer@test.com',
      address: '456 Customer Street',
      city: 'Rotterdam',
      postalCode: '3011 AA',
      country: 'NL',
    };

    test('accepts valid customer data', () => {
      const result = createCustomerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    test('requires companyId', () => {
      const data = { ...validCustomer };
      delete (data as Partial<typeof data>).companyId;
      const result = createCustomerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('accepts optional fields', () => {
      const result = createCustomerSchema.safeParse({
        ...validCustomer,
        taxId: 'NL987654321B01',
        phone: '+31 10 987 6543',
        contactPerson: 'John Doe',
        notes: 'Important customer',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createInvoiceItemSchema', () => {
    test('accepts valid item', () => {
      const result = createInvoiceItemSchema.safeParse({
        description: 'Service',
        quantity: 1,
        unitPrice: 100,
      });
      expect(result.success).toBe(true);
    });

    test('defaults tax rate to 21', () => {
      const result = createInvoiceItemSchema.safeParse({
        description: 'Service',
        quantity: 1,
        unitPrice: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taxRate).toBe(21);
      }
    });

    test('rejects negative quantity', () => {
      const result = createInvoiceItemSchema.safeParse({
        description: 'Service',
        quantity: -1,
        unitPrice: 100,
      });
      expect(result.success).toBe(false);
    });

    test('rejects negative unit price', () => {
      const result = createInvoiceItemSchema.safeParse({
        description: 'Service',
        quantity: 1,
        unitPrice: -50,
      });
      expect(result.success).toBe(false);
    });

    test('accepts zero unit price', () => {
      const result = createInvoiceItemSchema.safeParse({
        description: 'Free item',
        quantity: 1,
        unitPrice: 0,
      });
      expect(result.success).toBe(true);
    });

    test('coerces string numbers', () => {
      const result = createInvoiceItemSchema.safeParse({
        description: 'Service',
        quantity: '2.5',
        unitPrice: '99.99',
        taxRate: '10',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(2.5);
        expect(result.data.unitPrice).toBe(99.99);
        expect(result.data.taxRate).toBe(10);
      }
    });

    test('rejects tax rate above 100', () => {
      const result = createInvoiceItemSchema.safeParse({
        description: 'Service',
        quantity: 1,
        unitPrice: 100,
        taxRate: 150,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createInvoiceSchema', () => {
    const validInvoice = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
      items: [
        {
          description: 'Consulting services',
          quantity: 10,
          unitPrice: 150,
        },
      ],
    };

    test('accepts valid invoice data', () => {
      const result = createInvoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    test('coerces date strings to Date objects', () => {
      const result = createInvoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.issueDate instanceof Date).toBe(true);
        expect(result.data.dueDate instanceof Date).toBe(true);
      }
    });

    test('requires at least one item', () => {
      const result = createInvoiceSchema.safeParse({
        ...validInvoice,
        items: [],
      });
      expect(result.success).toBe(false);
    });

    test('accepts multiple items', () => {
      const result = createInvoiceSchema.safeParse({
        ...validInvoice,
        items: [
          { description: 'Item 1', quantity: 1, unitPrice: 100 },
          { description: 'Item 2', quantity: 2, unitPrice: 50 },
          { description: 'Item 3', quantity: 3, unitPrice: 25 },
        ],
      });
      expect(result.success).toBe(true);
    });

    test('defaults currency to EUR', () => {
      const result = createInvoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('EUR');
      }
    });

    test('accepts optional notes', () => {
      const result = createInvoiceSchema.safeParse({
        ...validInvoice,
        notes: 'Thank you for your business',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createPaymentSchema', () => {
    const validPayment = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 500,
      method: 'bank_transfer',
    };

    test('accepts valid payment data', () => {
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    test('requires positive amount', () => {
      const result = createPaymentSchema.safeParse({
        ...validPayment,
        amount: 0,
      });
      expect(result.success).toBe(false);
    });

    test('rejects negative amount', () => {
      const result = createPaymentSchema.safeParse({
        ...validPayment,
        amount: -100,
      });
      expect(result.success).toBe(false);
    });

    test('accepts all payment methods', () => {
      const methods = ['bank_transfer', 'card', 'direct_debit', 'cash', 'other'];

      for (const method of methods) {
        const result = createPaymentSchema.safeParse({
          ...validPayment,
          method,
        });
        expect(result.success).toBe(true);
      }
    });

    test('accepts optional reference', () => {
      const result = createPaymentSchema.safeParse({
        ...validPayment,
        reference: 'TRX-123456',
      });
      expect(result.success).toBe(true);
    });

    test('coerces string amount to number', () => {
      const result = createPaymentSchema.safeParse({
        ...validPayment,
        amount: '250.50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(250.5);
      }
    });
  });

  describe('createDebtCaseSchema', () => {
    const validDebtCase = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
    };

    test('accepts valid debt case data', () => {
      const result = createDebtCaseSchema.safeParse(validDebtCase);
      expect(result.success).toBe(true);
    });

    test('defaults priority to medium', () => {
      const result = createDebtCaseSchema.safeParse(validDebtCase);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('medium');
      }
    });

    test('accepts all priority levels', () => {
      const priorities = ['low', 'medium', 'high', 'critical'];

      for (const priority of priorities) {
        const result = createDebtCaseSchema.safeParse({
          ...validDebtCase,
          priority,
        });
        expect(result.success).toBe(true);
      }
    });

    test('accepts optional assignedToId', () => {
      const result = createDebtCaseSchema.safeParse({
        ...validDebtCase,
        assignedToId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      expect(result.success).toBe(true);
    });

    test('accepts null assignedToId', () => {
      const result = createDebtCaseSchema.safeParse({
        ...validDebtCase,
        assignedToId: null,
      });
      expect(result.success).toBe(true);
    });

    test('accepts optional notes', () => {
      const result = createDebtCaseSchema.safeParse({
        ...validDebtCase,
        notes: 'Customer not responding to calls',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Field Length Validation', () => {
  test('rejects overly long notes', () => {
    const result = createPaymentSchema.safeParse({
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100,
      method: 'bank_transfer',
      notes: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  test('rejects overly long description', () => {
    const result = createInvoiceItemSchema.safeParse({
      description: 'a'.repeat(501),
      quantity: 1,
      unitPrice: 100,
    });
    expect(result.success).toBe(false);
  });

  test('accepts maximum length description', () => {
    const result = createInvoiceItemSchema.safeParse({
      description: 'a'.repeat(500),
      quantity: 1,
      unitPrice: 100,
    });
    expect(result.success).toBe(true);
  });
});
