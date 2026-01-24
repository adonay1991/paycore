/**
 * Database Seed Script
 *
 * Creates initial development data for testing the PayCore platform.
 * Run with: bun run db:seed
 */

import { db } from './index';
import {
  companies,
  users,
  customers,
  invoices,
  invoiceItems,
  payments,
  debtCases,
  debtCaseActivities,
} from './schema';

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // ==========================================================================
  // COMPANY
  // ==========================================================================

  console.log('📦 Creating company...');
  const [company] = await db
    .insert(companies)
    .values({
      name: 'PayCore Demo Company',
      taxId: 'B12345678',
      address: 'Calle Mayor 123',
      city: 'Madrid',
      postalCode: '28001',
      country: 'ES',
      email: 'demo@paycore.dev',
      phone: '+34 912 345 678',
      website: 'https://paycore.dev',
      currency: 'EUR',
      settings: {
        invoicePrefix: 'INV',
        invoiceNextNumber: 1001,
        paymentTermsDays: 30,
        reminderEnabled: true,
        reminderDays: [7, 14, 21],
        overdueGraceDays: 3,
        defaultCurrency: 'EUR',
      },
    })
    .returning();

  console.log(`  ✓ Company created: ${company.name} (${company.id})\n`);

  // ==========================================================================
  // USERS
  // ==========================================================================

  console.log('👤 Creating users...');
  const [adminUser] = await db
    .insert(users)
    .values({
      email: 'admin@paycore.dev',
      name: 'Admin User',
      role: 'admin',
      companyId: company.id,
      isActive: true,
    })
    .returning();

  const [managerUser] = await db
    .insert(users)
    .values({
      email: 'manager@paycore.dev',
      name: 'Manager User',
      role: 'manager',
      companyId: company.id,
      isActive: true,
    })
    .returning();

  const [regularUser] = await db
    .insert(users)
    .values({
      email: 'user@paycore.dev',
      name: 'Regular User',
      role: 'user',
      companyId: company.id,
      isActive: true,
    })
    .returning();

  console.log(`  ✓ Admin: ${adminUser.email}`);
  console.log(`  ✓ Manager: ${managerUser.email}`);
  console.log(`  ✓ User: ${regularUser.email}\n`);

  // ==========================================================================
  // CUSTOMERS
  // ==========================================================================

  console.log('🏢 Creating customers...');
  const customerData = [
    {
      companyId: company.id,
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      taxId: 'B98765432',
      address: 'Avenida de la Innovación 45',
      city: 'Barcelona',
      postalCode: '08001',
      country: 'ES',
      phone: '+34 932 123 456',
      contactPerson: 'María García',
    },
    {
      companyId: company.id,
      name: 'TechStart SL',
      email: 'finance@techstart.es',
      taxId: 'B11223344',
      address: 'Calle Tecnología 12',
      city: 'Valencia',
      postalCode: '46001',
      country: 'ES',
      phone: '+34 963 456 789',
      contactPerson: 'Carlos López',
    },
    {
      companyId: company.id,
      name: 'Global Services Inc',
      email: 'accounts@globalservices.com',
      taxId: 'B55667788',
      address: 'Plaza del Sol 8',
      city: 'Sevilla',
      postalCode: '41001',
      country: 'ES',
      phone: '+34 954 789 012',
      contactPerson: 'Ana Martínez',
    },
  ];

  const createdCustomers = await db
    .insert(customers)
    .values(customerData)
    .returning();

  for (const customer of createdCustomers) {
    console.log(`  ✓ ${customer.name} (${customer.email})`);
  }
  console.log('');

  // ==========================================================================
  // INVOICES
  // ==========================================================================

  console.log('📄 Creating invoices...');
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const invoiceData = [
    {
      number: 'INV-1001',
      companyId: company.id,
      customerId: createdCustomers[0].id,
      status: 'paid' as const,
      issueDate: sixtyDaysAgo,
      dueDate: thirtyDaysAgo,
      subtotal: '5000.00',
      taxRate: '21.00',
      taxAmount: '1050.00',
      total: '6050.00',
      paidAmount: '6050.00',
      paidAt: thirtyDaysAgo,
    },
    {
      number: 'INV-1002',
      companyId: company.id,
      customerId: createdCustomers[1].id,
      status: 'sent' as const,
      issueDate: now,
      dueDate: thirtyDaysFromNow,
      subtotal: '3500.00',
      taxRate: '21.00',
      taxAmount: '735.00',
      total: '4235.00',
      paidAmount: '0.00',
      sentAt: now,
    },
    {
      number: 'INV-1003',
      companyId: company.id,
      customerId: createdCustomers[0].id,
      status: 'overdue' as const,
      issueDate: sixtyDaysAgo,
      dueDate: thirtyDaysAgo,
      subtotal: '8000.00',
      taxRate: '21.00',
      taxAmount: '1680.00',
      total: '9680.00',
      paidAmount: '0.00',
      sentAt: sixtyDaysAgo,
    },
    {
      number: 'INV-1004',
      companyId: company.id,
      customerId: createdCustomers[2].id,
      status: 'partial' as const,
      issueDate: thirtyDaysAgo,
      dueDate: now,
      subtotal: '2500.00',
      taxRate: '21.00',
      taxAmount: '525.00',
      total: '3025.00',
      paidAmount: '1500.00',
      sentAt: thirtyDaysAgo,
    },
    {
      number: 'INV-1005',
      companyId: company.id,
      customerId: createdCustomers[1].id,
      status: 'draft' as const,
      issueDate: now,
      dueDate: thirtyDaysFromNow,
      subtotal: '1200.00',
      taxRate: '21.00',
      taxAmount: '252.00',
      total: '1452.00',
      paidAmount: '0.00',
    },
  ];

  const createdInvoices = await db
    .insert(invoices)
    .values(invoiceData)
    .returning();

  for (const invoice of createdInvoices) {
    console.log(`  ✓ ${invoice.number} - ${invoice.status} (€${invoice.total})`);
  }
  console.log('');

  // ==========================================================================
  // INVOICE ITEMS
  // ==========================================================================

  console.log('📝 Creating invoice items...');
  const invoiceItemsData = [
    // INV-1001 items
    {
      invoiceId: createdInvoices[0].id,
      description: 'Web Development Services - October 2024',
      quantity: '40.0000',
      unitPrice: '100.00',
      taxRate: '21.00',
      total: '4000.00',
      sortOrder: 0,
    },
    {
      invoiceId: createdInvoices[0].id,
      description: 'Server Hosting - October 2024',
      quantity: '1.0000',
      unitPrice: '1000.00',
      taxRate: '21.00',
      total: '1000.00',
      sortOrder: 1,
    },
    // INV-1002 items
    {
      invoiceId: createdInvoices[1].id,
      description: 'Mobile App Development - Phase 1',
      quantity: '35.0000',
      unitPrice: '100.00',
      taxRate: '21.00',
      total: '3500.00',
      sortOrder: 0,
    },
    // INV-1003 items
    {
      invoiceId: createdInvoices[2].id,
      description: 'ERP Integration Project',
      quantity: '80.0000',
      unitPrice: '100.00',
      taxRate: '21.00',
      total: '8000.00',
      sortOrder: 0,
    },
    // INV-1004 items
    {
      invoiceId: createdInvoices[3].id,
      description: 'Consulting Services',
      quantity: '25.0000',
      unitPrice: '100.00',
      taxRate: '21.00',
      total: '2500.00',
      sortOrder: 0,
    },
    // INV-1005 items
    {
      invoiceId: createdInvoices[4].id,
      description: 'UI/UX Design - Logo and Branding',
      quantity: '12.0000',
      unitPrice: '100.00',
      taxRate: '21.00',
      total: '1200.00',
      sortOrder: 0,
    },
  ];

  await db.insert(invoiceItems).values(invoiceItemsData);
  console.log(`  ✓ Created ${invoiceItemsData.length} invoice items\n`);

  // ==========================================================================
  // PAYMENTS
  // ==========================================================================

  console.log('💳 Creating payments...');
  const paymentData = [
    {
      invoiceId: createdInvoices[0].id,
      amount: '6050.00',
      method: 'bank_transfer' as const,
      status: 'completed' as const,
      reference: 'TRANSFER-2024-001',
      processedAt: thirtyDaysAgo,
    },
    {
      invoiceId: createdInvoices[3].id,
      amount: '1500.00',
      method: 'card' as const,
      status: 'completed' as const,
      reference: 'CARD-2024-002',
      processedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
  ];

  const createdPayments = await db
    .insert(payments)
    .values(paymentData)
    .returning();

  for (const payment of createdPayments) {
    console.log(`  ✓ Payment €${payment.amount} - ${payment.status}`);
  }
  console.log('');

  // ==========================================================================
  // DEBT CASES
  // ==========================================================================

  console.log('⚠️ Creating debt cases...');
  const [debtCase] = await db
    .insert(debtCases)
    .values({
      invoiceId: createdInvoices[2].id,
      companyId: company.id,
      status: 'contacted',
      priority: 'high',
      assignedToId: managerUser.id,
      totalDebt: '9680.00',
      lastContactAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      nextActionAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      nextAction: 'Follow up call to discuss payment plan',
      notes: 'Customer experiencing temporary cash flow issues',
    })
    .returning();

  console.log(`  ✓ Debt case for INV-1003 - ${debtCase.status}\n`);

  // ==========================================================================
  // DEBT CASE ACTIVITIES
  // ==========================================================================

  console.log('📞 Creating debt case activities...');
  await db.insert(debtCaseActivities).values([
    {
      debtCaseId: debtCase.id,
      userId: managerUser.id,
      action: 'case_created',
      notes: 'Debt case opened for overdue invoice INV-1003',
    },
    {
      debtCaseId: debtCase.id,
      userId: managerUser.id,
      action: 'phone_call',
      contactMethod: 'phone',
      outcome: 'left_voicemail',
      notes: 'Called customer, no answer. Left voicemail requesting callback.',
    },
    {
      debtCaseId: debtCase.id,
      userId: managerUser.id,
      action: 'email_sent',
      contactMethod: 'email',
      outcome: 'awaiting_response',
      notes: 'Sent payment reminder email with invoice attached.',
    },
    {
      debtCaseId: debtCase.id,
      userId: managerUser.id,
      action: 'phone_call',
      contactMethod: 'phone',
      outcome: 'spoke_to_customer',
      notes:
        'Spoke with María García. They are experiencing temporary cash flow issues. Agreed to follow up next week to discuss payment plan options.',
    },
  ]);

  console.log(`  ✓ Created 4 activities for debt case\n`);

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  console.log('✅ Database seed completed!\n');
  console.log('Summary:');
  console.log('  - 1 company');
  console.log('  - 3 users (admin, manager, user)');
  console.log('  - 3 customers');
  console.log('  - 5 invoices (paid, sent, overdue, partial, draft)');
  console.log('  - 6 invoice items');
  console.log('  - 2 payments');
  console.log('  - 1 debt case with 4 activities');
  console.log('\n🎉 You can now log in with:');
  console.log('  Admin: admin@paycore.dev');
  console.log('  Manager: manager@paycore.dev');
  console.log('  User: user@paycore.dev');
  console.log('\n⚠️  Note: Create these users in Supabase Auth first!');
}

// Run seed
seed()
  .then(() => {
    console.log('\nSeed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });
