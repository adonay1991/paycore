/**
 * Debt Case Service
 *
 * Business logic for debt recovery workflow and escalation.
 * Following patterns from docs/DATA_ARCHITECTURE.md
 */

import { and, eq, isNull, sql, gte, lte, lt, desc } from 'drizzle-orm';
import { db, debtCases, debtCaseActivities, invoices, users } from '../db';
import type { DebtCaseRow, DebtCaseActivityRow, InvoiceRow, UserRow } from '../db';
import type { DebtCaseStatus, DebtCasePriority } from '@paycore/types';

// =============================================================================
// TYPES
// =============================================================================

export interface CreateDebtCaseInput {
  invoiceId: string;
  priority?: DebtCasePriority;
  assignedToId?: string | null;
  notes?: string | null;
}

export interface DebtCaseWithDetails extends DebtCaseRow {
  invoice: InvoiceRow;
  assignedTo?: UserRow | null;
  activities: DebtCaseActivityRow[];
}

export interface DebtCaseStatistics {
  totalCases: number;
  newCount: number;
  inProgressCount: number;
  escalatedCount: number;
  resolvedCount: number;
  totalDebt: number;
  resolvedDebt: number;
  byPriority: Record<DebtCasePriority, number>;
  byStatus: Record<DebtCaseStatus, number>;
}

export interface ActivityInput {
  action: string;
  notes?: string | null;
  contactMethod?: string | null;
  outcome?: string | null;
}

// =============================================================================
// DEBT CASE CREATION
// =============================================================================

/**
 * Create a debt case for an overdue invoice.
 */
export async function createDebtCase(
  input: CreateDebtCaseInput,
  companyId: string
): Promise<DebtCaseRow> {
  // Verify invoice exists and belongs to company
  const invoice = await db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, input.invoiceId),
      eq(invoices.companyId, companyId),
      isNull(invoices.deletedAt)
    ),
  });

  if (!invoice) {
    throw new Error(`Invoice ${input.invoiceId} not found`);
  }

  // Check if debt case already exists
  const existingCase = await db.query.debtCases.findFirst({
    where: and(
      eq(debtCases.invoiceId, input.invoiceId),
      isNull(debtCases.deletedAt)
    ),
  });

  if (existingCase) {
    throw new Error('A debt case already exists for this invoice');
  }

  // Calculate outstanding balance
  const outstandingBalance = Number(invoice.total) - Number(invoice.paidAmount);
  if (outstandingBalance <= 0) {
    throw new Error('Cannot create debt case for fully paid invoice');
  }

  // Verify assigned user if provided
  if (input.assignedToId) {
    const assignedUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, input.assignedToId),
        eq(users.companyId, companyId),
        isNull(users.deletedAt)
      ),
    });

    if (!assignedUser) {
      throw new Error(`User ${input.assignedToId} not found`);
    }
  }

  // Create debt case
  const [debtCase] = await db
    .insert(debtCases)
    .values({
      invoiceId: input.invoiceId,
      companyId,
      status: 'new',
      priority: input.priority || 'medium',
      assignedToId: input.assignedToId,
      totalDebt: String(outstandingBalance),
      currency: invoice.currency,
      notes: input.notes,
    })
    .returning();

  return debtCase;
}

/**
 * Auto-create debt cases for all overdue invoices.
 */
export async function autoCreateDebtCases(
  companyId: string,
  overdueGraceDays = 0
): Promise<DebtCaseRow[]> {
  const gracePeriodDate = new Date();
  gracePeriodDate.setDate(gracePeriodDate.getDate() - overdueGraceDays);

  // Find overdue invoices without debt cases
  const overdueInvoices = await db
    .select()
    .from(invoices)
    .leftJoin(debtCases, eq(invoices.id, debtCases.invoiceId))
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.status, 'overdue'),
        lt(invoices.dueDate, gracePeriodDate),
        isNull(invoices.deletedAt),
        isNull(debtCases.id) // No existing debt case
      )
    );

  const createdCases: DebtCaseRow[] = [];

  for (const row of overdueInvoices) {
    const invoice = row.invoices;
    const outstandingBalance = Number(invoice.total) - Number(invoice.paidAmount);

    if (outstandingBalance > 0) {
      // Determine priority based on amount
      let priority: DebtCasePriority = 'medium';
      if (outstandingBalance > 10000) {
        priority = 'critical';
      } else if (outstandingBalance > 5000) {
        priority = 'high';
      } else if (outstandingBalance < 500) {
        priority = 'low';
      }

      const [debtCase] = await db
        .insert(debtCases)
        .values({
          invoiceId: invoice.id,
          companyId,
          status: 'new',
          priority,
          totalDebt: String(outstandingBalance),
          currency: invoice.currency,
        })
        .returning();

      createdCases.push(debtCase);
    }
  }

  return createdCases;
}

// =============================================================================
// STATUS MANAGEMENT
// =============================================================================

/**
 * Update debt case status.
 */
export async function updateDebtCaseStatus(
  debtCaseId: string,
  companyId: string,
  status: DebtCaseStatus,
  userId: string,
  notes?: string
): Promise<DebtCaseRow> {
  // Verify debt case exists
  const existing = await db.query.debtCases.findFirst({
    where: and(
      eq(debtCases.id, debtCaseId),
      eq(debtCases.companyId, companyId),
      isNull(debtCases.deletedAt)
    ),
  });

  if (!existing) {
    throw new Error(`Debt case ${debtCaseId} not found`);
  }

  // Build updates
  const updates: Partial<typeof debtCases.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };

  // Handle status-specific updates
  if (status === 'escalated' && existing.status !== 'escalated') {
    updates.escalatedAt = new Date();
  }
  if (status === 'resolved' && existing.status !== 'resolved') {
    updates.resolvedAt = new Date();
  }

  // Update in transaction with activity log
  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(debtCases)
      .set(updates)
      .where(eq(debtCases.id, debtCaseId))
      .returning();

    // Log activity
    await tx.insert(debtCaseActivities).values({
      debtCaseId,
      userId,
      action: 'status_changed',
      notes: notes || `Status changed from ${existing.status} to ${status}`,
    });

    return updated;
  });

  return result;
}

/**
 * Escalate a debt case.
 */
export async function escalateDebtCase(
  debtCaseId: string,
  companyId: string,
  userId: string,
  reason: string
): Promise<DebtCaseRow> {
  return updateDebtCaseStatus(
    debtCaseId,
    companyId,
    'escalated',
    userId,
    `Escalated: ${reason}`
  );
}

/**
 * Resolve a debt case.
 */
export async function resolveDebtCase(
  debtCaseId: string,
  companyId: string,
  userId: string,
  notes?: string
): Promise<DebtCaseRow> {
  return updateDebtCaseStatus(
    debtCaseId,
    companyId,
    'resolved',
    userId,
    notes || 'Debt case resolved'
  );
}

// =============================================================================
// ASSIGNMENT
// =============================================================================

/**
 * Assign a debt case to a user.
 */
export async function assignDebtCase(
  debtCaseId: string,
  companyId: string,
  assignToId: string,
  assignedById: string
): Promise<DebtCaseRow> {
  // Verify debt case exists
  const existing = await db.query.debtCases.findFirst({
    where: and(
      eq(debtCases.id, debtCaseId),
      eq(debtCases.companyId, companyId),
      isNull(debtCases.deletedAt)
    ),
  });

  if (!existing) {
    throw new Error(`Debt case ${debtCaseId} not found`);
  }

  // Verify target user
  const assignedUser = await db.query.users.findFirst({
    where: and(
      eq(users.id, assignToId),
      eq(users.companyId, companyId),
      isNull(users.deletedAt)
    ),
  });

  if (!assignedUser) {
    throw new Error(`User ${assignToId} not found`);
  }

  // Update assignment
  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(debtCases)
      .set({
        assignedToId: assignToId,
        updatedAt: new Date(),
      })
      .where(eq(debtCases.id, debtCaseId))
      .returning();

    // Log activity
    await tx.insert(debtCaseActivities).values({
      debtCaseId,
      userId: assignedById,
      action: 'assigned',
      notes: `Assigned to ${assignedUser.name}`,
    });

    return updated;
  });

  return result;
}

/**
 * Get unassigned debt cases.
 */
export async function getUnassignedDebtCases(
  companyId: string
): Promise<DebtCaseRow[]> {
  return db.query.debtCases.findMany({
    where: and(
      eq(debtCases.companyId, companyId),
      isNull(debtCases.assignedToId),
      isNull(debtCases.deletedAt),
      sql`${debtCases.status} NOT IN ('resolved', 'closed', 'written_off')`
    ),
    orderBy: [desc(debtCases.priority), desc(debtCases.createdAt)],
  });
}

// =============================================================================
// ACTIVITIES
// =============================================================================

/**
 * Log an activity on a debt case.
 */
export async function logActivity(
  debtCaseId: string,
  userId: string,
  input: ActivityInput
): Promise<DebtCaseActivityRow> {
  // Create activity and update last contact if applicable
  const result = await db.transaction(async (tx) => {
    const [activity] = await tx
      .insert(debtCaseActivities)
      .values({
        debtCaseId,
        userId,
        action: input.action,
        notes: input.notes,
        contactMethod: input.contactMethod,
        outcome: input.outcome,
      })
      .returning();

    // Update last contact if this was a contact action
    if (input.contactMethod) {
      await tx
        .update(debtCases)
        .set({
          lastContactAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(debtCases.id, debtCaseId));
    }

    return activity;
  });

  return result;
}

/**
 * Get activity history for a debt case.
 */
export async function getActivityHistory(
  debtCaseId: string,
  limit = 50
): Promise<DebtCaseActivityRow[]> {
  return db.query.debtCaseActivities.findMany({
    where: eq(debtCaseActivities.debtCaseId, debtCaseId),
    orderBy: [desc(debtCaseActivities.createdAt)],
    limit,
    with: {
      user: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get debt case statistics for a company.
 */
export async function getDebtCaseStatistics(
  companyId: string
): Promise<DebtCaseStatistics> {
  // Get counts by status
  const statusResults = await db
    .select({
      status: debtCases.status,
      count: sql<number>`count(*)`,
      totalDebt: sql<number>`sum(${debtCases.totalDebt}::numeric)`,
    })
    .from(debtCases)
    .where(and(eq(debtCases.companyId, companyId), isNull(debtCases.deletedAt)))
    .groupBy(debtCases.status);

  // Get counts by priority
  const priorityResults = await db
    .select({
      priority: debtCases.priority,
      count: sql<number>`count(*)`,
    })
    .from(debtCases)
    .where(
      and(
        eq(debtCases.companyId, companyId),
        isNull(debtCases.deletedAt),
        sql`${debtCases.status} NOT IN ('resolved', 'closed', 'written_off')`
      )
    )
    .groupBy(debtCases.priority);

  const stats: DebtCaseStatistics = {
    totalCases: 0,
    newCount: 0,
    inProgressCount: 0,
    escalatedCount: 0,
    resolvedCount: 0,
    totalDebt: 0,
    resolvedDebt: 0,
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    byStatus: {
      new: 0,
      contacted: 0,
      in_progress: 0,
      payment_plan: 0,
      resolved: 0,
      escalated: 0,
      legal: 0,
      closed: 0,
      written_off: 0,
    },
  };

  for (const row of statusResults) {
    const count = Number(row.count);
    const totalDebt = Number(row.totalDebt) || 0;

    stats.totalCases += count;
    stats.byStatus[row.status] = count;

    switch (row.status) {
      case 'new':
        stats.newCount = count;
        stats.totalDebt += totalDebt;
        break;
      case 'contacted':
      case 'in_progress':
      case 'payment_plan':
        stats.inProgressCount += count;
        stats.totalDebt += totalDebt;
        break;
      case 'escalated':
      case 'legal':
        stats.escalatedCount += count;
        stats.totalDebt += totalDebt;
        break;
      case 'resolved':
      case 'closed':
        stats.resolvedCount += count;
        stats.resolvedDebt += totalDebt;
        break;
    }
  }

  for (const row of priorityResults) {
    stats.byPriority[row.priority] = Number(row.count);
  }

  return stats;
}

/**
 * Get debt cases requiring action (not contacted recently).
 */
export async function getCasesRequiringAction(
  companyId: string,
  daysSinceLastContact = 7
): Promise<DebtCaseRow[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastContact);

  return db.query.debtCases.findMany({
    where: and(
      eq(debtCases.companyId, companyId),
      isNull(debtCases.deletedAt),
      sql`${debtCases.status} NOT IN ('resolved', 'closed', 'written_off')`,
      sql`(${debtCases.lastContactAt} IS NULL OR ${debtCases.lastContactAt} < ${cutoffDate})`
    ),
    orderBy: [desc(debtCases.priority), desc(debtCases.totalDebt)],
  });
}

export default {
  createDebtCase,
  autoCreateDebtCases,
  updateDebtCaseStatus,
  escalateDebtCase,
  resolveDebtCase,
  assignDebtCase,
  getUnassignedDebtCases,
  logActivity,
  getActivityHistory,
  getDebtCaseStatistics,
  getCasesRequiringAction,
};
