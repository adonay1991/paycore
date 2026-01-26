/**
 * Database Seed Script
 *
 * Creates comprehensive demo data for the PayCore platform.
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
  voiceAgents,
  voiceCalls,
  communicationTemplates,
  collectionCampaigns,
  campaignContacts,
  paymentPlans,
  installments,
  escalationRules,
} from './schema';

// Helper to create dates relative to now
const now = new Date();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // ==========================================================================
  // COMPANY
  // ==========================================================================

  console.log('📦 Creating company...');
  const [company] = await db
    .insert(companies)
    .values({
      name: 'AutoFinance España',
      taxId: 'B12345678',
      address: 'Calle Gran Vía 42, Planta 5',
      city: 'Madrid',
      postalCode: '28013',
      country: 'ES',
      email: 'cobranzas@autofinance.es',
      phone: '+34 912 345 678',
      website: 'https://autofinance.es',
      currency: 'EUR',
      settings: {
        invoicePrefix: 'AF',
        invoiceNextNumber: 2024001,
        paymentTermsDays: 30,
        reminderEnabled: true,
        reminderDays: [7, 14, 21],
        overdueGraceDays: 5,
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
      email: 'admin@autofinance.es',
      name: 'Elena Rodríguez',
      role: 'admin',
      companyId: company.id,
      phone: '+34 612 345 001',
      isActive: true,
    })
    .returning();

  const [managerUser] = await db
    .insert(users)
    .values({
      email: 'carlos.manager@autofinance.es',
      name: 'Carlos Fernández',
      role: 'manager',
      companyId: company.id,
      phone: '+34 612 345 002',
      isActive: true,
    })
    .returning();

  const [agentUser1] = await db
    .insert(users)
    .values({
      email: 'ana.cobranzas@autofinance.es',
      name: 'Ana García',
      role: 'user',
      companyId: company.id,
      phone: '+34 612 345 003',
      isActive: true,
    })
    .returning();

  const [agentUser2] = await db
    .insert(users)
    .values({
      email: 'miguel.cobranzas@autofinance.es',
      name: 'Miguel Torres',
      role: 'user',
      companyId: company.id,
      phone: '+34 612 345 004',
      isActive: true,
    })
    .returning();

  console.log(`  ✓ Admin: ${adminUser.email}`);
  console.log(`  ✓ Manager: ${managerUser.email}`);
  console.log(`  ✓ Agent 1: ${agentUser1.email}`);
  console.log(`  ✓ Agent 2: ${agentUser2.email}\n`);

  // ==========================================================================
  // CUSTOMERS (Concesionarios de coches)
  // ==========================================================================

  console.log('🏢 Creating customers (car dealerships)...');
  const customerData = [
    {
      companyId: company.id,
      name: 'Concesionario Madrid Norte',
      email: 'facturacion@madridnorte.auto.es',
      taxId: 'B28765432',
      address: 'Av. de Burgos 45',
      city: 'Madrid',
      postalCode: '28036',
      country: 'ES',
      phone: '+34 917 234 567',
      contactPerson: 'Roberto Sánchez',
      notes: 'Cliente desde 2019. Historial de pagos regular.',
    },
    {
      companyId: company.id,
      name: 'AutoSur Sevilla',
      email: 'administracion@autosur.es',
      taxId: 'B41123456',
      address: 'Polígono Calonge, Nave 12',
      city: 'Sevilla',
      postalCode: '41007',
      country: 'ES',
      phone: '+34 954 678 901',
      contactPerson: 'Laura Moreno',
      notes: 'Problemas de liquidez recientes. Requiere seguimiento.',
    },
    {
      companyId: company.id,
      name: 'Barcelona Premium Cars',
      email: 'contabilidad@bcnpremium.es',
      taxId: 'B08234567',
      address: 'Carrer de Balmes 231',
      city: 'Barcelona',
      postalCode: '08006',
      country: 'ES',
      phone: '+34 932 456 789',
      contactPerson: 'Jordi Puig',
      notes: 'Concesionario premium. Alto volumen de financiación.',
    },
    {
      companyId: company.id,
      name: 'Valencia Motor Sport',
      email: 'pagos@valenciamotorsport.es',
      taxId: 'B46345678',
      address: 'Av. del Puerto 88',
      city: 'Valencia',
      postalCode: '46023',
      country: 'ES',
      phone: '+34 963 345 678',
      contactPerson: 'Vicente Martínez',
      notes: 'Especialista en vehículos deportivos.',
    },
    {
      companyId: company.id,
      name: 'Galicia Autos',
      email: 'tesoreria@galiciaautos.es',
      taxId: 'B15456789',
      address: 'Rúa Nova 23',
      city: 'A Coruña',
      postalCode: '15003',
      country: 'ES',
      phone: '+34 981 234 567',
      contactPerson: 'Marta Iglesias',
    },
    {
      companyId: company.id,
      name: 'Málaga Sol Motors',
      email: 'admin@malagasol.es',
      taxId: 'B29567890',
      address: 'Av. de Andalucía 156',
      city: 'Málaga',
      postalCode: '29007',
      country: 'ES',
      phone: '+34 952 567 890',
      contactPerson: 'Pedro Ruiz',
      notes: 'Retrasos ocasionales. Preferencia por planes de pago.',
    },
    {
      companyId: company.id,
      name: 'Bilbao Auto Center',
      email: 'facturas@bilbaoauto.es',
      taxId: 'B48678901',
      address: 'Gran Vía 58',
      city: 'Bilbao',
      postalCode: '48011',
      country: 'ES',
      phone: '+34 944 678 901',
      contactPerson: 'Iker Aguirre',
    },
    {
      companyId: company.id,
      name: 'Zaragoza Wheels',
      email: 'cobros@zaragozawheels.es',
      taxId: 'B50789012',
      address: 'Paseo Independencia 34',
      city: 'Zaragoza',
      postalCode: '50004',
      country: 'ES',
      phone: '+34 976 789 012',
      contactPerson: 'Pilar Navarro',
    },
  ];

  const createdCustomers = await db
    .insert(customers)
    .values(customerData)
    .returning();

  for (const customer of createdCustomers) {
    console.log(`  ✓ ${customer.name}`);
  }
  console.log('');

  // ==========================================================================
  // INVOICES (Various statuses for demo)
  // ==========================================================================

  console.log('📄 Creating invoices...');
  const invoiceData = [
    // Paid invoices
    {
      number: 'AF-2024001',
      companyId: company.id,
      customerId: createdCustomers[0].id,
      status: 'paid' as const,
      issueDate: daysAgo(60),
      dueDate: daysAgo(30),
      subtotal: '45000.00',
      taxRate: '21.00',
      taxAmount: '9450.00',
      total: '54450.00',
      paidAmount: '54450.00',
      paidAt: daysAgo(28),
      notes: 'Financiación vehículos lote Enero',
    },
    {
      number: 'AF-2024002',
      companyId: company.id,
      customerId: createdCustomers[2].id,
      status: 'paid' as const,
      issueDate: daysAgo(45),
      dueDate: daysAgo(15),
      subtotal: '125000.00',
      taxRate: '21.00',
      taxAmount: '26250.00',
      total: '151250.00',
      paidAmount: '151250.00',
      paidAt: daysAgo(12),
      notes: 'Financiación vehículos premium Q1',
    },
    // Sent / Pending
    {
      number: 'AF-2024003',
      companyId: company.id,
      customerId: createdCustomers[3].id,
      status: 'sent' as const,
      issueDate: daysAgo(5),
      dueDate: daysFromNow(25),
      subtotal: '67000.00',
      taxRate: '21.00',
      taxAmount: '14070.00',
      total: '81070.00',
      paidAmount: '0.00',
      sentAt: daysAgo(5),
    },
    {
      number: 'AF-2024004',
      companyId: company.id,
      customerId: createdCustomers[4].id,
      status: 'sent' as const,
      issueDate: daysAgo(10),
      dueDate: daysFromNow(20),
      subtotal: '38500.00',
      taxRate: '21.00',
      taxAmount: '8085.00',
      total: '46585.00',
      paidAmount: '0.00',
      sentAt: daysAgo(10),
    },
    // OVERDUE - These will have debt cases
    {
      number: 'AF-2024005',
      companyId: company.id,
      customerId: createdCustomers[1].id, // AutoSur Sevilla - problematic
      status: 'overdue' as const,
      issueDate: daysAgo(75),
      dueDate: daysAgo(45),
      subtotal: '89000.00',
      taxRate: '21.00',
      taxAmount: '18690.00',
      total: '107690.00',
      paidAmount: '0.00',
      sentAt: daysAgo(75),
      notes: 'URGENTE: Sin respuesta a recordatorios',
    },
    {
      number: 'AF-2024006',
      companyId: company.id,
      customerId: createdCustomers[5].id, // Málaga Sol
      status: 'overdue' as const,
      issueDate: daysAgo(50),
      dueDate: daysAgo(20),
      subtotal: '52000.00',
      taxRate: '21.00',
      taxAmount: '10920.00',
      total: '62920.00',
      paidAmount: '0.00',
      sentAt: daysAgo(50),
    },
    {
      number: 'AF-2024007',
      companyId: company.id,
      customerId: createdCustomers[1].id, // AutoSur Sevilla - second overdue
      status: 'overdue' as const,
      issueDate: daysAgo(40),
      dueDate: daysAgo(10),
      subtotal: '34500.00',
      taxRate: '21.00',
      taxAmount: '7245.00',
      total: '41745.00',
      paidAmount: '0.00',
      sentAt: daysAgo(40),
    },
    // Partial payment
    {
      number: 'AF-2024008',
      companyId: company.id,
      customerId: createdCustomers[6].id,
      status: 'partial' as const,
      issueDate: daysAgo(35),
      dueDate: daysAgo(5),
      subtotal: '78000.00',
      taxRate: '21.00',
      taxAmount: '16380.00',
      total: '94380.00',
      paidAmount: '50000.00',
      sentAt: daysAgo(35),
      notes: 'Pago parcial recibido, pendiente resto',
    },
    // Drafts
    {
      number: 'AF-2024009',
      companyId: company.id,
      customerId: createdCustomers[7].id,
      status: 'draft' as const,
      issueDate: now,
      dueDate: daysFromNow(30),
      subtotal: '41000.00',
      taxRate: '21.00',
      taxAmount: '8610.00',
      total: '49610.00',
      paidAmount: '0.00',
    },
    {
      number: 'AF-2024010',
      companyId: company.id,
      customerId: createdCustomers[0].id,
      status: 'draft' as const,
      issueDate: now,
      dueDate: daysFromNow(30),
      subtotal: '92000.00',
      taxRate: '21.00',
      taxAmount: '19320.00',
      total: '111320.00',
      paidAmount: '0.00',
    },
  ];

  const createdInvoices = await db
    .insert(invoices)
    .values(invoiceData)
    .returning();

  for (const invoice of createdInvoices) {
    console.log(
      `  ✓ ${invoice.number} - ${invoice.status} (€${invoice.total})`
    );
  }
  console.log('');

  // ==========================================================================
  // INVOICE ITEMS
  // ==========================================================================

  console.log('📝 Creating invoice items...');
  const invoiceItemsData = createdInvoices.flatMap((invoice, index) => {
    const itemsPerInvoice = [
      // Invoice 1 items
      [
        {
          invoiceId: invoice.id,
          description: 'Financiación Seat León 2024 - VIN: VSSZZZ5FZPR000001',
          quantity: '1.0000',
          unitPrice: '22500.00',
          taxRate: '21.00',
          total: '22500.00',
          sortOrder: 0,
        },
        {
          invoiceId: invoice.id,
          description: 'Financiación Seat Ibiza 2024 - VIN: VSSZZZ6JZPR000002',
          quantity: '1.0000',
          unitPrice: '22500.00',
          taxRate: '21.00',
          total: '22500.00',
          sortOrder: 1,
        },
      ],
      // Invoice 2 items
      [
        {
          invoiceId: invoice.id,
          description: 'Financiación BMW Serie 3 - VIN: WBA8E9C50KB000001',
          quantity: '1.0000',
          unitPrice: '45000.00',
          taxRate: '21.00',
          total: '45000.00',
          sortOrder: 0,
        },
        {
          invoiceId: invoice.id,
          description: 'Financiación Mercedes Clase A - VIN: WDD1770001N000001',
          quantity: '1.0000',
          unitPrice: '42000.00',
          taxRate: '21.00',
          total: '42000.00',
          sortOrder: 1,
        },
        {
          invoiceId: invoice.id,
          description: 'Financiación Audi A4 - VIN: WAUZZZ8K5BA000001',
          quantity: '1.0000',
          unitPrice: '38000.00',
          taxRate: '21.00',
          total: '38000.00',
          sortOrder: 2,
        },
      ],
      // Invoice 3 items
      [
        {
          invoiceId: invoice.id,
          description:
            'Financiación Porsche 911 Carrera - VIN: WP0ZZZ99ZRS000001',
          quantity: '1.0000',
          unitPrice: '67000.00',
          taxRate: '21.00',
          total: '67000.00',
          sortOrder: 0,
        },
      ],
      // Invoice 4 items
      [
        {
          invoiceId: invoice.id,
          description: 'Financiación Volkswagen Golf - VIN: WVWZZZ1KZAM000001',
          quantity: '1.0000',
          unitPrice: '18500.00',
          taxRate: '21.00',
          total: '18500.00',
          sortOrder: 0,
        },
        {
          invoiceId: invoice.id,
          description:
            'Financiación Volkswagen Passat - VIN: WVWZZZ3CZWE000001',
          quantity: '1.0000',
          unitPrice: '20000.00',
          taxRate: '21.00',
          total: '20000.00',
          sortOrder: 1,
        },
      ],
      // Invoice 5 items (overdue)
      [
        {
          invoiceId: invoice.id,
          description: 'Financiación lote 5 vehículos Hyundai',
          quantity: '5.0000',
          unitPrice: '17800.00',
          taxRate: '21.00',
          total: '89000.00',
          sortOrder: 0,
        },
      ],
      // Invoice 6 items (overdue)
      [
        {
          invoiceId: invoice.id,
          description: 'Financiación Kia Sportage - VIN: KNAP081ABL0000001',
          quantity: '1.0000',
          unitPrice: '28000.00',
          taxRate: '21.00',
          total: '28000.00',
          sortOrder: 0,
        },
        {
          invoiceId: invoice.id,
          description: 'Financiación Kia Ceed - VIN: KNAP081ABL0000002',
          quantity: '1.0000',
          unitPrice: '24000.00',
          taxRate: '21.00',
          total: '24000.00',
          sortOrder: 1,
        },
      ],
      // Invoice 7 items (overdue)
      [
        {
          invoiceId: invoice.id,
          description: 'Financiación Peugeot 3008 - VIN: VF3MCBHXHLS000001',
          quantity: '1.0000',
          unitPrice: '34500.00',
          taxRate: '21.00',
          total: '34500.00',
          sortOrder: 0,
        },
      ],
      // Invoice 8 items (partial)
      [
        {
          invoiceId: invoice.id,
          description: 'Financiación lote 3 vehículos Toyota',
          quantity: '3.0000',
          unitPrice: '26000.00',
          taxRate: '21.00',
          total: '78000.00',
          sortOrder: 0,
        },
      ],
      // Invoice 9 items (draft)
      [
        {
          invoiceId: invoice.id,
          description: 'Financiación Renault Captur - VIN: VF18RFL0A68000001',
          quantity: '1.0000',
          unitPrice: '21000.00',
          taxRate: '21.00',
          total: '21000.00',
          sortOrder: 0,
        },
        {
          invoiceId: invoice.id,
          description: 'Financiación Renault Clio - VIN: VF1RJA00068000001',
          quantity: '1.0000',
          unitPrice: '20000.00',
          taxRate: '21.00',
          total: '20000.00',
          sortOrder: 1,
        },
      ],
      // Invoice 10 items (draft)
      [
        {
          invoiceId: invoice.id,
          description: 'Financiación Ford Kuga - VIN: WF0XXXGCDXMY00001',
          quantity: '1.0000',
          unitPrice: '32000.00',
          taxRate: '21.00',
          total: '32000.00',
          sortOrder: 0,
        },
        {
          invoiceId: invoice.id,
          description: 'Financiación Ford Focus - VIN: WF0XXXGCDXMY00002',
          quantity: '2.0000',
          unitPrice: '30000.00',
          taxRate: '21.00',
          total: '60000.00',
          sortOrder: 1,
        },
      ],
    ];
    return itemsPerInvoice[index] || [];
  });

  await db.insert(invoiceItems).values(invoiceItemsData);
  console.log(`  ✓ Created ${invoiceItemsData.length} invoice items\n`);

  // ==========================================================================
  // PAYMENTS
  // ==========================================================================

  console.log('💳 Creating payments...');
  const paymentData = [
    {
      invoiceId: createdInvoices[0].id,
      amount: '54450.00',
      method: 'bank_transfer' as const,
      status: 'completed' as const,
      reference: 'TRANS-2024-0001',
      transactionId: 'ES7621000418401234567891',
      processedAt: daysAgo(28),
    },
    {
      invoiceId: createdInvoices[1].id,
      amount: '151250.00',
      method: 'bank_transfer' as const,
      status: 'completed' as const,
      reference: 'TRANS-2024-0002',
      transactionId: 'ES7621000418401234567892',
      processedAt: daysAgo(12),
    },
    {
      invoiceId: createdInvoices[7].id, // Partial payment
      amount: '50000.00',
      method: 'bank_transfer' as const,
      status: 'completed' as const,
      reference: 'TRANS-2024-0003',
      transactionId: 'ES7621000418401234567893',
      processedAt: daysAgo(20),
      notes: 'Pago parcial - Resto pendiente',
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

  console.log('⚠️  Creating debt cases...');
  const debtCaseData = [
    {
      invoiceId: createdInvoices[4].id, // AF-2024005 - AutoSur Sevilla
      companyId: company.id,
      status: 'contacted' as const,
      priority: 'critical' as const,
      assignedToId: managerUser.id,
      totalDebt: '107690.00',
      lastContactAt: daysAgo(2),
      nextActionAt: daysFromNow(1),
      nextAction: 'Llamada de seguimiento - confirmar plan de pago',
      notes:
        'Cliente con dificultades financieras. Ha solicitado plan de pago.',
    },
    {
      invoiceId: createdInvoices[5].id, // AF-2024006 - Málaga Sol
      companyId: company.id,
      status: 'in_progress' as const,
      priority: 'high' as const,
      assignedToId: agentUser1.id,
      totalDebt: '62920.00',
      lastContactAt: daysAgo(5),
      nextActionAt: daysFromNow(2),
      nextAction: 'Enviar recordatorio por email y llamar',
      notes: 'Promesa de pago para fin de mes.',
    },
    {
      invoiceId: createdInvoices[6].id, // AF-2024007 - AutoSur Sevilla second
      companyId: company.id,
      status: 'new' as const,
      priority: 'medium' as const,
      assignedToId: agentUser2.id,
      totalDebt: '41745.00',
      nextActionAt: now,
      nextAction: 'Contacto inicial',
    },
    {
      invoiceId: createdInvoices[7].id, // AF-2024008 - Partial
      companyId: company.id,
      status: 'payment_plan' as const,
      priority: 'low' as const,
      assignedToId: agentUser1.id,
      totalDebt: '44380.00', // Remaining after partial
      lastContactAt: daysAgo(10),
      nextActionAt: daysFromNow(15),
      nextAction: 'Verificar próximo pago del plan',
      notes: 'Plan de pago activo. 3 cuotas mensuales.',
    },
  ];

  const createdDebtCases = await db
    .insert(debtCases)
    .values(debtCaseData)
    .returning();

  for (const debtCase of createdDebtCases) {
    console.log(`  ✓ Debt case ${debtCase.status} - €${debtCase.totalDebt}`);
  }
  console.log('');

  // ==========================================================================
  // DEBT CASE ACTIVITIES
  // ==========================================================================

  console.log('📞 Creating debt case activities...');
  const activitiesData = [
    // Activities for first debt case (critical)
    {
      debtCaseId: createdDebtCases[0].id,
      userId: managerUser.id,
      action: 'case_created',
      notes: 'Caso de deuda abierto automáticamente - Factura vencida 45 días',
      createdAt: daysAgo(15),
    },
    {
      debtCaseId: createdDebtCases[0].id,
      userId: managerUser.id,
      action: 'email_sent',
      contactMethod: 'email',
      outcome: 'no_response',
      notes: 'Primer recordatorio enviado por email',
      createdAt: daysAgo(14),
    },
    {
      debtCaseId: createdDebtCases[0].id,
      userId: managerUser.id,
      action: 'phone_call',
      contactMethod: 'phone',
      outcome: 'no_answer',
      notes: 'Llamada sin respuesta. Buzón de voz.',
      createdAt: daysAgo(10),
    },
    {
      debtCaseId: createdDebtCases[0].id,
      userId: managerUser.id,
      action: 'phone_call',
      contactMethod: 'phone',
      outcome: 'spoke_to_customer',
      notes:
        'Hablado con Laura Moreno. Confirma problemas de liquidez. Solicita plan de pago.',
      createdAt: daysAgo(5),
    },
    {
      debtCaseId: createdDebtCases[0].id,
      userId: managerUser.id,
      action: 'email_sent',
      contactMethod: 'email',
      outcome: 'awaiting_response',
      notes: 'Enviada propuesta de plan de pago: 3 cuotas de €35,896.67',
      createdAt: daysAgo(2),
    },
    // Activities for second debt case
    {
      debtCaseId: createdDebtCases[1].id,
      userId: agentUser1.id,
      action: 'case_created',
      notes: 'Caso asignado para seguimiento',
      createdAt: daysAgo(8),
    },
    {
      debtCaseId: createdDebtCases[1].id,
      userId: agentUser1.id,
      action: 'phone_call',
      contactMethod: 'phone',
      outcome: 'promise_to_pay',
      notes:
        'Pedro Ruiz confirma que realizará el pago a final de mes. Fecha prometida: 30/01',
      createdAt: daysAgo(5),
    },
    // Activities for third debt case
    {
      debtCaseId: createdDebtCases[2].id,
      userId: agentUser2.id,
      action: 'case_created',
      notes: 'Nuevo caso de deuda - Pendiente de contacto inicial',
      createdAt: daysAgo(1),
    },
    // Activities for fourth debt case (payment plan)
    {
      debtCaseId: createdDebtCases[3].id,
      userId: agentUser1.id,
      action: 'case_created',
      notes: 'Caso para seguimiento de pago parcial',
      createdAt: daysAgo(25),
    },
    {
      debtCaseId: createdDebtCases[3].id,
      userId: agentUser1.id,
      action: 'payment_plan_created',
      contactMethod: 'phone',
      outcome: 'payment_plan_agreed',
      notes: 'Plan de pago acordado: €50,000 inicial + 3 cuotas de €14,793.33',
      createdAt: daysAgo(20),
    },
    {
      debtCaseId: createdDebtCases[3].id,
      userId: agentUser1.id,
      action: 'payment_received',
      notes: 'Pago inicial de €50,000 recibido',
      createdAt: daysAgo(20),
    },
  ];

  await db.insert(debtCaseActivities).values(activitiesData);
  console.log(`  ✓ Created ${activitiesData.length} debt case activities\n`);

  // ==========================================================================
  // VOICE AGENTS
  // ==========================================================================

  console.log('🤖 Creating voice agents...');
  const voiceAgentData = [
    {
      companyId: company.id,
      name: 'Sofia - Cobranzas Amable',
      elevenLabsAgentId: 'agent_demo_sofia_001',
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah - ElevenLabs
      language: 'es',
      systemPrompt: `Eres Sofia, una asistente de cobranzas profesional de AutoFinance España.
Tu objetivo es contactar a clientes con facturas pendientes de manera amable pero firme.
- Siempre saluda cordialmente y te identificas
- Explica el motivo de la llamada claramente
- Escucha las razones del cliente con empatía
- Ofrece soluciones como planes de pago
- Nunca seas agresiva ni amenazante
- Si el cliente se compromete a pagar, confirma la fecha y monto
- Termina la llamada agradeciendo su tiempo`,
      firstMessage:
        'Hola, buenos días. Le llamo de AutoFinance España. ¿Podría hablar con el responsable de pagos, por favor?',
      settings: {
        maxCallDuration: 300,
        temperature: 0.7,
        stability: 0.5,
        similarityBoost: 0.75,
        enableTranscription: true,
        enableRecording: true,
      },
      isActive: true,
    },
    {
      companyId: company.id,
      name: 'Carlos - Cobranzas Profesional',
      elevenLabsAgentId: 'agent_demo_carlos_001',
      voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold - ElevenLabs
      language: 'es',
      systemPrompt: `Eres Carlos, un gestor de cobranzas profesional de AutoFinance España.
Tu objetivo es gestionar deudas de manera efectiva y profesional.
- Mantén un tono profesional y directo
- Explica claramente el estado de la deuda
- Ofrece opciones de pago y planes de financiación
- Documenta cualquier compromiso del cliente
- Si hay disputas, escucha y registra la información
- Escala casos complicados al supervisor`,
      firstMessage:
        'Buenos días, le llamo de AutoFinance España, departamento de gestión de cuentas. ¿Hablo con el departamento de administración?',
      settings: {
        maxCallDuration: 240,
        temperature: 0.5,
        stability: 0.6,
        similarityBoost: 0.8,
        enableTranscription: true,
        enableRecording: true,
      },
      isActive: true,
    },
    {
      companyId: company.id,
      name: 'Isabel - Recordatorios Suaves',
      elevenLabsAgentId: 'agent_demo_isabel_001',
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - ElevenLabs
      language: 'es',
      systemPrompt: `Eres Isabel, una asistente de recordatorios de AutoFinance España.
Tu objetivo es realizar recordatorios amables de pagos próximos a vencer.
- Tono muy amable y cordial
- Solo recordatorios, no presiones
- Si ya pagaron, agradecer y registrar
- Si necesitan más tiempo, ofrecer ayuda`,
      firstMessage:
        'Hola, buenos días. Le llamo de AutoFinance para un breve recordatorio sobre su cuenta. ¿Tiene un momento?',
      settings: {
        maxCallDuration: 180,
        temperature: 0.8,
        stability: 0.4,
        similarityBoost: 0.7,
        enableTranscription: true,
        enableRecording: true,
      },
      isActive: true,
    },
  ];

  const createdVoiceAgents = await db
    .insert(voiceAgents)
    .values(voiceAgentData)
    .returning();

  for (const agent of createdVoiceAgents) {
    console.log(`  ✓ ${agent.name}`);
  }
  console.log('');

  // ==========================================================================
  // VOICE CALLS
  // ==========================================================================

  console.log('📱 Creating voice calls...');
  const voiceCallData = [
    // Completed calls
    {
      companyId: company.id,
      debtCaseId: createdDebtCases[0].id,
      customerId: createdCustomers[1].id,
      voiceAgentId: createdVoiceAgents[0].id,
      phoneNumber: '+34 954 678 901',
      status: 'completed' as const,
      outcome: 'promise_to_pay' as const,
      direction: 'outbound',
      duration: 245,
      transcription: `Sofia: Hola, buenos días. Le llamo de AutoFinance España. ¿Podría hablar con Laura Moreno, por favor?
Cliente: Sí, soy yo. Dígame.
Sofia: Buenos días Laura. Le llamo en relación a la factura AF-2024005 por un importe de 107.690 euros que tiene un vencimiento pendiente desde hace 45 días.
Cliente: Sí, soy consciente. Hemos tenido algunos problemas de liquidez últimamente.
Sofia: Entiendo. ¿Hay algo que podamos hacer para ayudarle a regularizar esta situación?
Cliente: Sí, necesitaríamos un plan de pago. ¿Sería posible fraccionarlo?
Sofia: Por supuesto. Podríamos ofrecerle un plan de 3 cuotas mensuales. ¿Le parece bien que le enviemos la propuesta por email?
Cliente: Sí, perfecto. Se lo agradezco.
Sofia: Excelente. Le enviaré la propuesta hoy mismo. Muchas gracias por su tiempo, Laura.`,
      summary:
        'Cliente confirma problemas de liquidez. Acepta recibir propuesta de plan de pago en 3 cuotas.',
      sentiment: 'neutral',
      metadata: {
        promisedAmount: 107690,
        notes: 'Enviar propuesta de plan de pago por email',
      },
      startedAt: daysAgo(5),
      endedAt: new Date(daysAgo(5).getTime() + 245000),
    },
    {
      companyId: company.id,
      debtCaseId: createdDebtCases[1].id,
      customerId: createdCustomers[5].id,
      voiceAgentId: createdVoiceAgents[1].id,
      phoneNumber: '+34 952 567 890',
      status: 'completed' as const,
      outcome: 'promise_to_pay' as const,
      direction: 'outbound',
      duration: 189,
      transcription: `Carlos: Buenos días, le llamo de AutoFinance España. ¿Hablo con Pedro Ruiz?
Cliente: Sí, soy yo.
Carlos: Buenos días Pedro. Le llamo en relación a la factura AF-2024006 con vencimiento hace 20 días.
Cliente: Sí, lo sé. Hemos tenido un retraso pero lo tenemos previsto pagar a final de mes.
Carlos: Perfecto. ¿Podría confirmarme la fecha exacta?
Cliente: El 30 de este mes sin falta.
Carlos: Entendido. Queda registrado el compromiso de pago para el día 30. ¿Necesita algo más?
Cliente: No, eso es todo. Gracias.`,
      summary:
        'Cliente confirma compromiso de pago para el 30 del mes en curso.',
      sentiment: 'positive',
      metadata: {
        promisedAmount: 62920,
        promisedDate: '2024-01-30',
      },
      startedAt: daysAgo(5),
      endedAt: new Date(daysAgo(5).getTime() + 189000),
    },
    // Failed calls
    {
      companyId: company.id,
      debtCaseId: createdDebtCases[0].id,
      customerId: createdCustomers[1].id,
      voiceAgentId: createdVoiceAgents[0].id,
      phoneNumber: '+34 954 678 901',
      status: 'no_answer' as const,
      outcome: 'no_outcome' as const,
      direction: 'outbound',
      duration: 30,
      startedAt: daysAgo(10),
      endedAt: new Date(daysAgo(10).getTime() + 30000),
    },
    {
      companyId: company.id,
      debtCaseId: createdDebtCases[0].id,
      customerId: createdCustomers[1].id,
      voiceAgentId: createdVoiceAgents[0].id,
      phoneNumber: '+34 954 678 901',
      status: 'voicemail' as const,
      outcome: 'callback_requested' as const,
      direction: 'outbound',
      duration: 45,
      summary: 'Mensaje dejado en buzón de voz solicitando devolución de llamada.',
      startedAt: daysAgo(8),
      endedAt: new Date(daysAgo(8).getTime() + 45000),
    },
    // Scheduled calls
    {
      companyId: company.id,
      debtCaseId: createdDebtCases[2].id,
      customerId: createdCustomers[1].id,
      voiceAgentId: createdVoiceAgents[0].id,
      phoneNumber: '+34 954 678 901',
      status: 'pending' as const,
      direction: 'outbound',
      scheduledAt: daysFromNow(1),
    },
    {
      companyId: company.id,
      debtCaseId: createdDebtCases[1].id,
      customerId: createdCustomers[5].id,
      voiceAgentId: createdVoiceAgents[2].id,
      phoneNumber: '+34 952 567 890',
      status: 'pending' as const,
      direction: 'outbound',
      scheduledAt: daysFromNow(3),
    },
  ];

  const createdVoiceCalls = await db
    .insert(voiceCalls)
    .values(voiceCallData)
    .returning();

  for (const call of createdVoiceCalls) {
    console.log(`  ✓ Call ${call.status} - ${call.phoneNumber}`);
  }
  console.log('');

  // ==========================================================================
  // COMMUNICATION TEMPLATES
  // ==========================================================================

  console.log('📧 Creating communication templates...');
  const templateData = [
    {
      companyId: company.id,
      name: 'Recordatorio 7 días',
      type: 'email' as const,
      subject: 'Recordatorio de pago - Factura {{invoice_number}}',
      content: `Estimado/a {{contact_name}},

Le recordamos que la factura {{invoice_number}} por importe de {{amount}} € tiene fecha de vencimiento {{due_date}}.

Le agradeceríamos que procediera al pago a la mayor brevedad posible.

Para cualquier consulta, no dude en contactarnos.

Atentamente,
Departamento de Cobranzas
AutoFinance España`,
      language: 'es',
      variables: [
        'contact_name',
        'invoice_number',
        'amount',
        'due_date',
        'company_name',
      ],
      daysOverdue: 7,
      isDefault: true,
      isActive: true,
    },
    {
      companyId: company.id,
      name: 'Recordatorio 14 días',
      type: 'email' as const,
      subject: 'Segundo aviso - Factura {{invoice_number}} pendiente',
      content: `Estimado/a {{contact_name}},

Observamos que la factura {{invoice_number}} por {{amount}} € continúa pendiente de pago.

Es importante regularizar esta situación para evitar posibles recargos.

Si ya ha realizado el pago, por favor ignore este mensaje.

Atentamente,
Departamento de Cobranzas
AutoFinance España`,
      language: 'es',
      variables: ['contact_name', 'invoice_number', 'amount'],
      daysOverdue: 14,
      isDefault: true,
      isActive: true,
    },
    {
      companyId: company.id,
      name: 'Aviso urgente 30 días',
      type: 'email' as const,
      subject: 'URGENTE: Factura {{invoice_number}} vencida',
      content: `Estimado/a {{contact_name}},

La factura {{invoice_number}} por importe de {{amount}} € se encuentra vencida desde hace más de 30 días.

Le instamos a regularizar esta deuda de inmediato o contactar con nuestro departamento para establecer un plan de pago.

Si no recibimos respuesta en los próximos 7 días, nos veremos obligados a iniciar acciones de recobro.

Atentamente,
Departamento de Cobranzas
AutoFinance España
Tel: +34 912 345 678`,
      language: 'es',
      variables: ['contact_name', 'invoice_number', 'amount'],
      daysOverdue: 30,
      isDefault: true,
      isActive: true,
    },
    {
      companyId: company.id,
      name: 'SMS Recordatorio',
      type: 'sms' as const,
      content:
        'AutoFinance: Recordatorio factura {{invoice_number}} - {{amount}}€ pendiente. Contacte 912345678. Gracias.',
      language: 'es',
      variables: ['invoice_number', 'amount'],
      daysOverdue: 7,
      isDefault: true,
      isActive: true,
    },
    {
      companyId: company.id,
      name: 'Script llamada inicial',
      type: 'voice_script' as const,
      content: `Buenos días, le llamo de AutoFinance España.
¿Podría hablar con {{contact_name}}, responsable de administración?

[Si está disponible]
Le llamo en relación a la factura {{invoice_number}} por importe de {{amount}} euros.

[Preguntar]
¿Tienen previsto realizar el pago próximamente?

[Si hay problemas]
Entiendo. ¿Podríamos ayudarle con un plan de pago?

[Cierre]
Gracias por su tiempo. Quedamos a la espera de su gestión.`,
      language: 'es',
      variables: ['contact_name', 'invoice_number', 'amount'],
      isDefault: false,
      isActive: true,
    },
  ];

  const createdTemplates = await db
    .insert(communicationTemplates)
    .values(templateData)
    .returning();

  for (const template of createdTemplates) {
    console.log(`  ✓ ${template.name} (${template.type})`);
  }
  console.log('');

  // ==========================================================================
  // COLLECTION CAMPAIGNS
  // ==========================================================================

  console.log('📢 Creating collection campaigns...');
  const campaignData = [
    {
      companyId: company.id,
      name: 'Campaña Enero 2024 - Deudas >30 días',
      description:
        'Campaña de cobro para facturas vencidas más de 30 días en Enero 2024',
      type: 'voice' as const,
      status: 'running' as const,
      voiceAgentId: createdVoiceAgents[0].id,
      filters: {
        minDebtAmount: 10000,
        daysOverdueMin: 30,
        priorities: ['high', 'critical'],
      },
      schedule: {
        startTime: '09:00',
        endTime: '18:00',
        timezone: 'Europe/Madrid',
        daysOfWeek: [1, 2, 3, 4, 5],
        maxCallsPerDay: 50,
        maxCallsPerHour: 10,
      },
      stats: {
        totalContacts: 15,
        contacted: 8,
        successful: 3,
        failed: 2,
        pending: 7,
      },
      startedAt: daysAgo(7),
    },
    {
      companyId: company.id,
      name: 'Recordatorios Preventivos',
      description:
        'Campaña de recordatorios para facturas próximas a vencer (7 días)',
      type: 'email' as const,
      status: 'running' as const,
      templateId: createdTemplates[0].id,
      filters: {
        daysOverdueMin: -7,
        daysOverdueMax: 0,
      },
      schedule: {
        startTime: '08:00',
        endTime: '20:00',
        timezone: 'Europe/Madrid',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      stats: {
        totalContacts: 25,
        contacted: 25,
        successful: 18,
        failed: 0,
        pending: 0,
      },
      startedAt: daysAgo(14),
    },
    {
      companyId: company.id,
      name: 'Campaña Q1 - Alto Valor',
      description: 'Campaña intensiva para deudas de alto valor (>50.000€)',
      type: 'mixed' as const,
      status: 'scheduled' as const,
      voiceAgentId: createdVoiceAgents[1].id,
      templateId: createdTemplates[2].id,
      filters: {
        minDebtAmount: 50000,
        daysOverdueMin: 15,
      },
      schedule: {
        startTime: '10:00',
        endTime: '17:00',
        timezone: 'Europe/Madrid',
        daysOfWeek: [1, 2, 3, 4, 5],
        maxCallsPerDay: 20,
      },
      stats: {
        totalContacts: 5,
        contacted: 0,
        successful: 0,
        failed: 0,
        pending: 5,
      },
      scheduledAt: daysFromNow(3),
    },
    {
      companyId: company.id,
      name: 'Campaña Diciembre - Completada',
      description: 'Campaña de cierre de año para regularizar deudas',
      type: 'voice' as const,
      status: 'completed' as const,
      voiceAgentId: createdVoiceAgents[0].id,
      filters: {
        daysOverdueMin: 14,
      },
      schedule: {
        startTime: '09:00',
        endTime: '18:00',
        timezone: 'Europe/Madrid',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      stats: {
        totalContacts: 45,
        contacted: 45,
        successful: 32,
        failed: 8,
        pending: 0,
      },
      startedAt: daysAgo(60),
      completedAt: daysAgo(30),
    },
  ];

  const createdCampaigns = await db
    .insert(collectionCampaigns)
    .values(campaignData)
    .returning();

  for (const campaign of createdCampaigns) {
    console.log(`  ✓ ${campaign.name} (${campaign.status})`);
  }
  console.log('');

  // ==========================================================================
  // CAMPAIGN CONTACTS
  // ==========================================================================

  console.log('👥 Creating campaign contacts...');
  const campaignContactData = [
    // Contacts for running campaign
    {
      campaignId: createdCampaigns[0].id,
      debtCaseId: createdDebtCases[0].id,
      customerId: createdCustomers[1].id,
      status: 'contacted',
      attempts: 3,
      maxAttempts: 5,
      lastAttemptAt: daysAgo(2),
      nextAttemptAt: daysFromNow(1),
      outcome: 'promise_to_pay' as const,
      notes: 'Cliente solicitó plan de pago',
    },
    {
      campaignId: createdCampaigns[0].id,
      debtCaseId: createdDebtCases[1].id,
      customerId: createdCustomers[5].id,
      status: 'contacted',
      attempts: 2,
      maxAttempts: 5,
      lastAttemptAt: daysAgo(5),
      nextAttemptAt: daysFromNow(3),
      outcome: 'promise_to_pay' as const,
      notes: 'Promesa de pago para fin de mes',
    },
    {
      campaignId: createdCampaigns[0].id,
      debtCaseId: createdDebtCases[2].id,
      customerId: createdCustomers[1].id,
      status: 'pending',
      attempts: 0,
      maxAttempts: 5,
      nextAttemptAt: now,
    },
  ];

  await db.insert(campaignContacts).values(campaignContactData);
  console.log(`  ✓ Created ${campaignContactData.length} campaign contacts\n`);

  // ==========================================================================
  // PAYMENT PLANS
  // ==========================================================================

  console.log('📅 Creating payment plans...');
  const paymentPlanData = [
    {
      companyId: company.id,
      debtCaseId: createdDebtCases[3].id,
      customerId: createdCustomers[6].id,
      status: 'active' as const,
      totalAmount: '94380.00',
      downPayment: '50000.00',
      numberOfInstallments: 3,
      installmentAmount: '14793.33',
      frequency: 'monthly',
      currency: 'EUR' as const,
      startDate: daysAgo(20),
      endDate: daysFromNow(70),
      paidAmount: '50000.00',
      remainingAmount: '44380.00',
      acceptedAt: daysAgo(20),
      notes: 'Plan acordado con Bilbao Auto Center. Pago inicial recibido.',
    },
    {
      companyId: company.id,
      debtCaseId: createdDebtCases[0].id,
      customerId: createdCustomers[1].id,
      status: 'proposed' as const,
      totalAmount: '107690.00',
      downPayment: '0.00',
      numberOfInstallments: 3,
      installmentAmount: '35896.67',
      frequency: 'monthly',
      currency: 'EUR' as const,
      startDate: daysFromNow(15),
      endDate: daysFromNow(75),
      paidAmount: '0.00',
      remainingAmount: '107690.00',
      notes: 'Propuesta enviada a AutoSur Sevilla. Pendiente de aceptación.',
    },
  ];

  const createdPaymentPlans = await db
    .insert(paymentPlans)
    .values(paymentPlanData)
    .returning();

  for (const plan of createdPaymentPlans) {
    console.log(
      `  ✓ Plan ${plan.status} - €${plan.totalAmount} (${plan.numberOfInstallments} cuotas)`
    );
  }
  console.log('');

  // ==========================================================================
  // INSTALLMENTS
  // ==========================================================================

  console.log('💰 Creating installments...');
  const installmentData = [
    // Installments for active payment plan
    {
      paymentPlanId: createdPaymentPlans[0].id,
      installmentNumber: 1,
      amount: '14793.33',
      dueDate: daysFromNow(10),
      status: 'pending' as const,
      paidAmount: '0.00',
    },
    {
      paymentPlanId: createdPaymentPlans[0].id,
      installmentNumber: 2,
      amount: '14793.33',
      dueDate: daysFromNow(40),
      status: 'pending' as const,
      paidAmount: '0.00',
    },
    {
      paymentPlanId: createdPaymentPlans[0].id,
      installmentNumber: 3,
      amount: '14793.34',
      dueDate: daysFromNow(70),
      status: 'pending' as const,
      paidAmount: '0.00',
    },
    // Installments for proposed plan
    {
      paymentPlanId: createdPaymentPlans[1].id,
      installmentNumber: 1,
      amount: '35896.67',
      dueDate: daysFromNow(15),
      status: 'pending' as const,
      paidAmount: '0.00',
    },
    {
      paymentPlanId: createdPaymentPlans[1].id,
      installmentNumber: 2,
      amount: '35896.67',
      dueDate: daysFromNow(45),
      status: 'pending' as const,
      paidAmount: '0.00',
    },
    {
      paymentPlanId: createdPaymentPlans[1].id,
      installmentNumber: 3,
      amount: '35896.66',
      dueDate: daysFromNow(75),
      status: 'pending' as const,
      paidAmount: '0.00',
    },
  ];

  await db.insert(installments).values(installmentData);
  console.log(`  ✓ Created ${installmentData.length} installments\n`);

  // ==========================================================================
  // ESCALATION RULES
  // ==========================================================================

  console.log('⚡ Creating escalation rules...');
  const escalationRuleData = [
    {
      companyId: company.id,
      name: 'Recordatorio automático 7 días',
      description:
        'Envía email automático cuando la factura está vencida 7 días',
      priority: 10,
      isActive: true,
      conditions: {
        daysOverdue: { min: 7, max: 13 },
        currentStatus: ['sent', 'overdue'],
      },
      actions: [
        {
          type: 'send_email',
          params: { templateId: createdTemplates[0].id },
        },
      ],
      cooldownHours: 168, // 7 days
    },
    {
      companyId: company.id,
      name: 'Segundo recordatorio 14 días',
      description: 'Envía segundo recordatorio y SMS a los 14 días',
      priority: 20,
      isActive: true,
      conditions: {
        daysOverdue: { min: 14, max: 20 },
        currentStatus: ['overdue'],
      },
      actions: [
        {
          type: 'send_email',
          params: { templateId: createdTemplates[1].id },
        },
        {
          type: 'send_sms',
          params: { templateId: createdTemplates[3].id },
        },
      ],
      cooldownHours: 168,
    },
    {
      companyId: company.id,
      name: 'Crear caso de deuda 21 días',
      description: 'Crea caso de deuda automáticamente a los 21 días',
      priority: 30,
      isActive: true,
      conditions: {
        daysOverdue: { min: 21, max: 29 },
        currentStatus: ['overdue'],
      },
      actions: [
        {
          type: 'create_debt_case',
          params: { priority: 'medium' },
        },
        {
          type: 'send_email',
          params: { templateId: createdTemplates[2].id },
        },
      ],
      cooldownHours: 168,
      maxExecutions: 1,
    },
    {
      companyId: company.id,
      name: 'Escalación a alta prioridad 30 días',
      description:
        'Escala a alta prioridad y programa llamada automática a los 30 días',
      priority: 40,
      isActive: true,
      conditions: {
        daysOverdue: { min: 30 },
        debtAmount: { min: 10000 },
        currentStatus: ['new', 'contacted'],
      },
      actions: [
        {
          type: 'escalate_priority',
          params: { newPriority: 'high' },
        },
        {
          type: 'add_to_campaign',
          params: { campaignType: 'voice' },
        },
      ],
      cooldownHours: 72,
    },
    {
      companyId: company.id,
      name: 'Deudas críticas >50K',
      description:
        'Asigna a manager y notifica inmediatamente para deudas mayores a 50.000€',
      priority: 50,
      isActive: true,
      conditions: {
        debtAmount: { min: 50000 },
        daysOverdue: { min: 15 },
      },
      actions: [
        {
          type: 'escalate_priority',
          params: { newPriority: 'critical' },
        },
        {
          type: 'assign_agent',
          params: { userId: managerUser.id },
        },
      ],
      cooldownHours: 24,
      maxExecutions: 1,
    },
  ];

  const createdEscalationRules = await db
    .insert(escalationRules)
    .values(escalationRuleData)
    .returning();

  for (const rule of createdEscalationRules) {
    console.log(`  ✓ ${rule.name}`);
  }
  console.log('');

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  console.log('═'.repeat(60));
  console.log('✅ Database seed completed!\n');
  console.log('Summary:');
  console.log('  - 1 company (AutoFinance España)');
  console.log('  - 4 users (admin, manager, 2 agents)');
  console.log('  - 8 customers (car dealerships)');
  console.log('  - 10 invoices (2 paid, 2 sent, 3 overdue, 1 partial, 2 draft)');
  console.log('  - 3 payments');
  console.log('  - 4 debt cases with activities');
  console.log('  - 3 voice agents');
  console.log('  - 6 voice calls');
  console.log('  - 5 communication templates');
  console.log('  - 4 collection campaigns');
  console.log('  - 2 payment plans with 6 installments');
  console.log('  - 5 escalation rules');
  console.log('');
  console.log('🎉 Demo data ready!');
  console.log('');
  console.log('Demo users:');
  console.log('  Admin:   admin@autofinance.es');
  console.log('  Manager: carlos.manager@autofinance.es');
  console.log('  Agent 1: ana.cobranzas@autofinance.es');
  console.log('  Agent 2: miguel.cobranzas@autofinance.es');
  console.log('');
  console.log('⚠️  Note: Create these users in your auth provider if needed.');
  console.log('═'.repeat(60));
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
