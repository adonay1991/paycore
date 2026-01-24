/**
 * Notification Service
 *
 * Business logic for sending notifications (email, etc).
 * Following patterns from docs/DATA_ARCHITECTURE.md
 */

import { eq, and, isNull } from 'drizzle-orm';
import { db, invoices, customers, companies, debtCases, users } from '../db';
import type { InvoiceRow, CustomerRow, CompanyRow } from '../db';

// =============================================================================
// TYPES
// =============================================================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface InvoiceEmailData {
  invoice: InvoiceRow;
  customer: CustomerRow;
  company: CompanyRow;
}

export type NotificationType =
  | 'invoice_sent'
  | 'invoice_reminder'
  | 'payment_received'
  | 'payment_failed'
  | 'debt_case_created'
  | 'debt_case_escalated';

// =============================================================================
// EMAIL SENDING (stub - integrate with email provider)
// =============================================================================

/**
 * Send an email notification.
 * This is a stub that should be integrated with an email provider
 * (SendGrid, AWS SES, Resend, etc).
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In production, integrate with email provider
  // For now, log the email details
  console.log('📧 Sending email:', {
    to: options.to,
    subject: options.subject,
    from: options.from || process.env.EMAIL_FROM,
  });

  // Simulate sending
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email content:', options.html.substring(0, 200) + '...');
    return true;
  }

  // TODO: Integrate with email provider
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: options.from || process.env.EMAIL_FROM,
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  // });

  return true;
}

// =============================================================================
// INVOICE NOTIFICATIONS
// =============================================================================

/**
 * Send invoice to customer.
 */
export async function sendInvoiceEmail(
  invoiceId: string,
  companyId: string
): Promise<boolean> {
  // Get invoice with customer and company
  const invoice = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, invoiceId),
      eq(invoices.companyId, companyId),
      isNull(invoices.deletedAt)
    ),
    with: {
      customer: true,
      company: true,
    },
  });

  if (!invoice || !invoice.customer || !invoice.company) {
    throw new Error(`Invoice ${invoiceId} not found or missing relations`);
  }

  const customer = invoice.customer;
  const company = invoice.company;

  const subject = `Invoice ${invoice.number} from ${company.name}`;
  const html = generateInvoiceEmailHtml({
    invoice,
    customer,
    company,
  });

  return sendEmail({
    to: customer.email,
    subject,
    html,
    from: `${company.name} <${company.email}>`,
    replyTo: company.email,
  });
}

/**
 * Send payment reminder for invoice.
 */
export async function sendPaymentReminder(
  invoiceId: string,
  companyId: string,
  daysOverdue: number
): Promise<boolean> {
  const invoice = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, invoiceId),
      eq(invoices.companyId, companyId),
      isNull(invoices.deletedAt)
    ),
    with: {
      customer: true,
      company: true,
    },
  });

  if (!invoice || !invoice.customer || !invoice.company) {
    throw new Error(`Invoice ${invoiceId} not found or missing relations`);
  }

  const customer = invoice.customer;
  const company = invoice.company;

  const urgency = daysOverdue > 30 ? 'urgent' : daysOverdue > 14 ? 'important' : 'friendly';
  const subject = `Payment Reminder: Invoice ${invoice.number} ${daysOverdue > 0 ? `(${daysOverdue} days overdue)` : ''}`;

  const html = generateReminderEmailHtml({
    invoice,
    customer,
    company,
    daysOverdue,
    urgency,
  });

  return sendEmail({
    to: customer.email,
    subject,
    html,
    from: `${company.name} <${company.email}>`,
    replyTo: company.email,
  });
}

// =============================================================================
// PAYMENT NOTIFICATIONS
// =============================================================================

/**
 * Send payment received confirmation.
 */
export async function sendPaymentReceivedEmail(
  invoiceId: string,
  amount: number,
  companyId: string
): Promise<boolean> {
  const invoice = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, invoiceId),
      eq(invoices.companyId, companyId),
      isNull(invoices.deletedAt)
    ),
    with: {
      customer: true,
      company: true,
    },
  });

  if (!invoice || !invoice.customer || !invoice.company) {
    throw new Error(`Invoice ${invoiceId} not found or missing relations`);
  }

  const customer = invoice.customer;
  const company = invoice.company;
  const remainingBalance = Number(invoice.total) - Number(invoice.paidAmount);

  const subject = `Payment Received - Invoice ${invoice.number}`;
  const html = generatePaymentReceivedEmailHtml({
    invoice,
    customer,
    company,
    amount,
    remainingBalance,
  });

  return sendEmail({
    to: customer.email,
    subject,
    html,
    from: `${company.name} <${company.email}>`,
    replyTo: company.email,
  });
}

// =============================================================================
// DEBT CASE NOTIFICATIONS
// =============================================================================

/**
 * Notify assigned user about a new debt case.
 */
export async function notifyDebtCaseAssignment(
  debtCaseId: string,
  companyId: string
): Promise<boolean> {
  const debtCase = await db.query.debtCases.findFirst({
    where: and(
      eq(debtCases.id, debtCaseId),
      eq(debtCases.companyId, companyId),
      isNull(debtCases.deletedAt)
    ),
    with: {
      invoice: {
        with: {
          customer: true,
        },
      },
      assignedTo: true,
    },
  });

  if (!debtCase || !debtCase.assignedTo || !debtCase.invoice) {
    return false;
  }

  const assignedUser = debtCase.assignedTo;
  const invoice = debtCase.invoice;
  const customer = invoice.customer;

  const subject = `Debt Case Assigned: ${customer?.name || 'Unknown'} - ${debtCase.totalDebt} ${debtCase.currency}`;
  const html = `
    <h2>You have been assigned a debt case</h2>
    <p><strong>Customer:</strong> ${customer?.name || 'Unknown'}</p>
    <p><strong>Invoice:</strong> ${invoice.number}</p>
    <p><strong>Amount:</strong> ${debtCase.totalDebt} ${debtCase.currency}</p>
    <p><strong>Priority:</strong> ${debtCase.priority}</p>
    <p>Please review and take appropriate action.</p>
  `;

  return sendEmail({
    to: assignedUser.email,
    subject,
    html,
  });
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

function generateInvoiceEmailHtml(data: InvoiceEmailData): string {
  const { invoice, customer, company } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .details { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice from ${company.name}</h1>
    </div>

    <p>Dear ${customer.contactPerson || customer.name},</p>

    <p>Please find attached invoice <strong>${invoice.number}</strong> for your review.</p>

    <div class="details">
      <p><strong>Invoice Number:</strong> ${invoice.number}</p>
      <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      <p class="amount">Total: ${invoice.total} ${invoice.currency}</p>
    </div>

    <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

    <p>Thank you for your business!</p>

    <p>Best regards,<br>${company.name}</p>

    <div class="footer">
      <p>${company.address}, ${company.city} ${company.postalCode}</p>
      <p>Email: ${company.email} | Phone: ${company.phone || 'N/A'}</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateReminderEmailHtml(data: {
  invoice: InvoiceRow;
  customer: CustomerRow;
  company: CompanyRow;
  daysOverdue: number;
  urgency: 'friendly' | 'important' | 'urgent';
}): string {
  const { invoice, customer, company, daysOverdue, urgency } = data;

  const urgencyText = {
    friendly: 'This is a friendly reminder',
    important: 'This is an important reminder',
    urgent: 'URGENT: Immediate attention required',
  }[urgency];

  const urgencyColor = {
    friendly: '#10b981',
    important: '#f59e0b',
    urgent: '#ef4444',
  }[urgency];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid ${urgencyColor}; padding-bottom: 20px; }
    .urgency { color: ${urgencyColor}; font-weight: bold; }
    .details { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Reminder</h1>
      <p class="urgency">${urgencyText}</p>
    </div>

    <p>Dear ${customer.contactPerson || customer.name},</p>

    <p>We are writing to remind you that invoice <strong>${invoice.number}</strong>
    ${daysOverdue > 0 ? `is now <strong>${daysOverdue} days overdue</strong>` : 'is due soon'}.</p>

    <div class="details">
      <p><strong>Invoice Number:</strong> ${invoice.number}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      <p><strong>Amount Due:</strong></p>
      <p class="amount">${Number(invoice.total) - Number(invoice.paidAmount)} ${invoice.currency}</p>
    </div>

    <p>Please arrange payment at your earliest convenience.</p>

    <p>If you have already made this payment, please disregard this notice.</p>

    <p>Best regards,<br>${company.name}</p>

    <div class="footer">
      <p>${company.address}, ${company.city} ${company.postalCode}</p>
      <p>Email: ${company.email} | Phone: ${company.phone || 'N/A'}</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePaymentReceivedEmailHtml(data: {
  invoice: InvoiceRow;
  customer: CustomerRow;
  company: CompanyRow;
  amount: number;
  remainingBalance: number;
}): string {
  const { invoice, customer, company, amount, remainingBalance } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .success { color: #10b981; }
    .details { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #10b981; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="success">Payment Received</h1>
    </div>

    <p>Dear ${customer.contactPerson || customer.name},</p>

    <p>Thank you! We have received your payment for invoice <strong>${invoice.number}</strong>.</p>

    <div class="details">
      <p><strong>Invoice Number:</strong> ${invoice.number}</p>
      <p><strong>Payment Amount:</strong></p>
      <p class="amount">${amount} ${invoice.currency}</p>
      ${remainingBalance > 0 ? `<p><strong>Remaining Balance:</strong> ${remainingBalance} ${invoice.currency}</p>` : '<p><strong>Status:</strong> Paid in Full</p>'}
    </div>

    <p>Thank you for your prompt payment!</p>

    <p>Best regards,<br>${company.name}</p>

    <div class="footer">
      <p>${company.address}, ${company.city} ${company.postalCode}</p>
      <p>Email: ${company.email} | Phone: ${company.phone || 'N/A'}</p>
    </div>
  </div>
</body>
</html>
  `;
}

export default {
  sendEmail,
  sendInvoiceEmail,
  sendPaymentReminder,
  sendPaymentReceivedEmail,
  notifyDebtCaseAssignment,
};
