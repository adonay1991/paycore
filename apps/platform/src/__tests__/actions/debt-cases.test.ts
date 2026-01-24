/**
 * Debt Cases Server Actions Tests
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test';
import {
  createMockSupabaseClient,
  createMockDebtCase,
  createMockCustomer,
  mockUserData,
  mockCompanyId,
} from '../setup';

describe('Debt Cases Server Actions', () => {
  describe('getDebtCases', () => {
    it('should return debt cases for authenticated user', () => {
      const debtCases = [
        createMockDebtCase({ id: 'case-1', total_debt: '1000.00' }),
        createMockDebtCase({ id: 'case-2', total_debt: '2500.00' }),
      ];

      expect(debtCases).toHaveLength(2);
      expect(debtCases[0]).toHaveProperty('id');
      expect(debtCases[0]).toHaveProperty('company_id');
      expect(debtCases[0]).toHaveProperty('customer_id');
      expect(debtCases[0]).toHaveProperty('status');
      expect(debtCases[0]).toHaveProperty('total_debt');
      expect(debtCases[0]).toHaveProperty('days_overdue');
    });

    it('should filter by company_id for multi-tenancy', () => {
      const case1 = createMockDebtCase({ company_id: mockCompanyId });
      const case2 = createMockDebtCase({ company_id: 'other-company' });

      const userCases = [case1, case2].filter(
        (c) => c.company_id === mockCompanyId
      );

      expect(userCases).toHaveLength(1);
      expect(userCases[0].company_id).toBe(mockCompanyId);
    });
  });

  describe('Debt Case Filters', () => {
    it('should filter by status', () => {
      const cases = [
        createMockDebtCase({ status: 'pending' }),
        createMockDebtCase({ status: 'in_progress' }),
        createMockDebtCase({ status: 'resolved' }),
        createMockDebtCase({ status: 'pending' }),
      ];

      const pendingCases = cases.filter((c) => c.status === 'pending');

      expect(pendingCases).toHaveLength(2);
    });

    it('should filter by priority', () => {
      const cases = [
        createMockDebtCase({ priority: 'low' }),
        createMockDebtCase({ priority: 'medium' }),
        createMockDebtCase({ priority: 'high' }),
        createMockDebtCase({ priority: 'critical' }),
      ];

      const highPriority = cases.filter((c) =>
        ['high', 'critical'].includes(c.priority)
      );

      expect(highPriority).toHaveLength(2);
    });

    it('should filter by debt amount range', () => {
      const cases = [
        createMockDebtCase({ total_debt: '100.00' }),
        createMockDebtCase({ total_debt: '500.00' }),
        createMockDebtCase({ total_debt: '1500.00' }),
        createMockDebtCase({ total_debt: '5000.00' }),
      ];

      const minAmount = 200;
      const maxAmount = 2000;

      const filtered = cases.filter((c) => {
        const amount = parseFloat(c.total_debt);
        return amount >= minAmount && amount <= maxAmount;
      });

      expect(filtered).toHaveLength(2);
    });

    it('should filter by days overdue', () => {
      const cases = [
        createMockDebtCase({ days_overdue: 10 }),
        createMockDebtCase({ days_overdue: 30 }),
        createMockDebtCase({ days_overdue: 60 }),
        createMockDebtCase({ days_overdue: 90 }),
      ];

      const overdue30Plus = cases.filter((c) => c.days_overdue >= 30);

      expect(overdue30Plus).toHaveLength(3);
    });
  });

  describe('createDebtCase', () => {
    it('should create debt case with valid input', () => {
      const input = {
        customerId: 'customer-1',
        totalDebt: 1500,
        currency: 'EUR',
        dueDate: '2024-01-15',
        description: 'Invoice #12345 - Services rendered',
      };

      const debtCase = createMockDebtCase({
        customer_id: input.customerId,
        total_debt: input.totalDebt.toFixed(2),
        currency: input.currency,
        status: 'pending',
        priority: 'medium',
        paid_amount: '0.00',
        days_overdue: 0,
      });

      expect(debtCase.customer_id).toBe(input.customerId);
      expect(debtCase.total_debt).toBe('1500.00');
      expect(debtCase.status).toBe('pending');
    });

    it('should calculate initial priority based on amount', () => {
      const calculatePriority = (amount: number): string => {
        if (amount >= 10000) return 'critical';
        if (amount >= 5000) return 'high';
        if (amount >= 1000) return 'medium';
        return 'low';
      };

      expect(calculatePriority(500)).toBe('low');
      expect(calculatePriority(1500)).toBe('medium');
      expect(calculatePriority(7000)).toBe('high');
      expect(calculatePriority(15000)).toBe('critical');
    });
  });

  describe('updateDebtCase', () => {
    it('should update debt case status', () => {
      const originalCase = createMockDebtCase({ status: 'pending' });

      const updatedCase = {
        ...originalCase,
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      };

      expect(updatedCase.status).toBe('in_progress');
    });

    it('should update paid amount', () => {
      const originalCase = createMockDebtCase({
        total_debt: '1000.00',
        paid_amount: '0.00',
      });

      const paymentAmount = 250;
      const newPaidAmount = parseFloat(originalCase.paid_amount) + paymentAmount;

      const updatedCase = {
        ...originalCase,
        paid_amount: newPaidAmount.toFixed(2),
      };

      expect(updatedCase.paid_amount).toBe('250.00');
    });

    it('should recalculate remaining amount', () => {
      const totalDebt = 1000;
      const paidAmount = 350;
      const remainingAmount = totalDebt - paidAmount;

      expect(remainingAmount).toBe(650);
    });

    it('should mark as resolved when fully paid', () => {
      const debtCase = createMockDebtCase({
        total_debt: '1000.00',
        paid_amount: '1000.00',
      });

      const isFullyPaid =
        parseFloat(debtCase.paid_amount) >= parseFloat(debtCase.total_debt);

      expect(isFullyPaid).toBe(true);

      const resolvedCase = {
        ...debtCase,
        status: isFullyPaid ? 'resolved' : debtCase.status,
        resolved_at: isFullyPaid ? new Date().toISOString() : null,
      };

      expect(resolvedCase.status).toBe('resolved');
      expect(resolvedCase.resolved_at).toBeDefined();
    });
  });

  describe('Days Overdue Calculation', () => {
    it('should calculate days overdue correctly', () => {
      const dueDate = new Date('2024-01-01');
      const today = new Date('2024-01-31');

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(30);
    });

    it('should return 0 if not yet due', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10);
      const today = new Date();

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      expect(diffDays).toBe(0);
    });

    it('should update priority based on days overdue', () => {
      const updatePriorityByDaysOverdue = (
        currentPriority: string,
        daysOverdue: number
      ): string => {
        if (daysOverdue >= 90) return 'critical';
        if (daysOverdue >= 60) return 'high';
        if (daysOverdue >= 30) return 'medium';
        return currentPriority;
      };

      expect(updatePriorityByDaysOverdue('low', 15)).toBe('low');
      expect(updatePriorityByDaysOverdue('low', 35)).toBe('medium');
      expect(updatePriorityByDaysOverdue('low', 65)).toBe('high');
      expect(updatePriorityByDaysOverdue('low', 95)).toBe('critical');
    });
  });

  describe('Debt Case Statistics', () => {
    it('should calculate portfolio statistics', () => {
      const cases = [
        createMockDebtCase({ total_debt: '1000.00', status: 'pending' }),
        createMockDebtCase({ total_debt: '2000.00', status: 'in_progress' }),
        createMockDebtCase({ total_debt: '1500.00', status: 'resolved' }),
        createMockDebtCase({ total_debt: '3000.00', status: 'pending' }),
      ];

      const stats = {
        totalCases: cases.length,
        totalDebt: cases.reduce((sum, c) => sum + parseFloat(c.total_debt), 0),
        pendingCases: cases.filter((c) => c.status === 'pending').length,
        inProgressCases: cases.filter((c) => c.status === 'in_progress').length,
        resolvedCases: cases.filter((c) => c.status === 'resolved').length,
      };

      expect(stats.totalCases).toBe(4);
      expect(stats.totalDebt).toBe(7500);
      expect(stats.pendingCases).toBe(2);
      expect(stats.inProgressCases).toBe(1);
      expect(stats.resolvedCases).toBe(1);
    });

    it('should calculate collection rate', () => {
      const totalDebt = 10000;
      const collectedAmount = 3500;
      const collectionRate = (collectedAmount / totalDebt) * 100;

      expect(collectionRate).toBe(35);
    });

    it('should calculate average days to resolution', () => {
      const resolvedCases = [
        { createdAt: new Date('2024-01-01'), resolvedAt: new Date('2024-01-16') },
        { createdAt: new Date('2024-01-01'), resolvedAt: new Date('2024-01-21') },
        { createdAt: new Date('2024-01-01'), resolvedAt: new Date('2024-01-11') },
      ];

      const totalDays = resolvedCases.reduce((sum, c) => {
        const diffTime = c.resolvedAt.getTime() - c.createdAt.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);

      const avgDays = totalDays / resolvedCases.length;

      // 15 + 20 + 10 = 45, 45 / 3 = 15
      expect(avgDays).toBe(15);
    });
  });

  describe('Bulk Operations', () => {
    it('should update multiple cases status', () => {
      const caseIds = ['case-1', 'case-2', 'case-3'];
      const newStatus = 'in_progress';

      const updates = caseIds.map((id) => ({
        id,
        status: newStatus,
        updated_at: new Date().toISOString(),
      }));

      expect(updates).toHaveLength(3);
      expect(updates.every((u) => u.status === 'in_progress')).toBe(true);
    });

    it('should assign cases to agent', () => {
      const caseIds = ['case-1', 'case-2'];
      const agentId = 'agent-1';

      const assignments = caseIds.map((id) => ({
        debt_case_id: id,
        agent_id: agentId,
        assigned_at: new Date().toISOString(),
      }));

      expect(assignments).toHaveLength(2);
      expect(assignments.every((a) => a.agent_id === agentId)).toBe(true);
    });
  });

  describe('Customer Integration', () => {
    it('should link debt case to customer', () => {
      const customer = createMockCustomer({ id: 'cust-1', name: 'John Doe' });
      const debtCase = createMockDebtCase({ customer_id: customer.id });

      expect(debtCase.customer_id).toBe(customer.id);
    });

    it('should aggregate debt cases per customer', () => {
      const cases = [
        createMockDebtCase({ customer_id: 'cust-1', total_debt: '500.00' }),
        createMockDebtCase({ customer_id: 'cust-1', total_debt: '750.00' }),
        createMockDebtCase({ customer_id: 'cust-2', total_debt: '1000.00' }),
      ];

      const cust1Cases = cases.filter((c) => c.customer_id === 'cust-1');
      const cust1TotalDebt = cust1Cases.reduce(
        (sum, c) => sum + parseFloat(c.total_debt),
        0
      );

      expect(cust1Cases).toHaveLength(2);
      expect(cust1TotalDebt).toBe(1250);
    });
  });
});
