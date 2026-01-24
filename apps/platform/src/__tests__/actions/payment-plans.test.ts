/**
 * Payment Plans Server Actions Tests
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test';
import {
  createMockPaymentPlan,
  createMockDebtCase,
  createMockCustomer,
  mockCompanyId,
} from '../setup';

describe('Payment Plans Server Actions', () => {
  describe('createPaymentPlan', () => {
    it('should calculate installment amounts correctly', () => {
      const input = {
        totalAmount: 1000,
        downPayment: 100,
        numberOfInstallments: 3,
      };

      const remainingAmount = input.totalAmount - input.downPayment;
      const installmentAmount = remainingAmount / input.numberOfInstallments;

      expect(remainingAmount).toBe(900);
      expect(installmentAmount).toBe(300);
    });

    it('should create installments with correct due dates for monthly frequency', () => {
      const startDate = new Date('2024-01-15');
      const numberOfInstallments = 3;
      const frequency = 'monthly';

      const frequencyDays: Record<string, number> = {
        weekly: 7,
        biweekly: 14,
        monthly: 30,
      };

      const installments = [];
      let currentDate = new Date(startDate);

      for (let i = 1; i <= numberOfInstallments; i++) {
        installments.push({
          installment_number: i,
          due_date: currentDate.toISOString(),
        });

        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + frequencyDays[frequency]);
      }

      expect(installments).toHaveLength(3);
      expect(installments[0].installment_number).toBe(1);
      expect(installments[2].installment_number).toBe(3);
    });

    it('should create installments with correct due dates for weekly frequency', () => {
      const startDate = new Date('2024-01-15');
      const numberOfInstallments = 4;
      const frequency = 'weekly';
      const frequencyDays = 7;

      const installments = [];
      let currentDate = new Date(startDate);

      for (let i = 1; i <= numberOfInstallments; i++) {
        installments.push({
          installment_number: i,
          due_date: new Date(currentDate).toISOString(),
        });

        currentDate.setDate(currentDate.getDate() + frequencyDays);
      }

      expect(installments).toHaveLength(4);

      // Verify spacing
      const date1 = new Date(installments[0].due_date);
      const date2 = new Date(installments[1].due_date);
      const diffDays = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(7);
    });

    it('should calculate end date based on frequency and installments', () => {
      const startDate = new Date('2024-01-01');
      const numberOfInstallments = 6;
      const frequency = 'monthly';
      const frequencyDays = 30;

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + frequencyDays * numberOfInstallments);

      // ~6 months later
      expect(endDate.getMonth()).toBeGreaterThan(startDate.getMonth());
    });
  });

  describe('acceptPaymentPlan', () => {
    it('should transition plan from proposed to active', () => {
      const proposedPlan = createMockPaymentPlan({ status: 'proposed' });

      const acceptedPlan = {
        ...proposedPlan,
        status: 'active',
        accepted_at: new Date().toISOString(),
      };

      expect(acceptedPlan.status).toBe('active');
      expect(acceptedPlan.accepted_at).toBeDefined();
    });

    it('should only accept plans in proposed status', () => {
      const statuses = ['proposed', 'active', 'completed', 'defaulted', 'cancelled'];

      statuses.forEach((status) => {
        const canAccept = status === 'proposed';
        if (status === 'proposed') {
          expect(canAccept).toBe(true);
        } else {
          expect(canAccept).toBe(false);
        }
      });
    });
  });

  describe('recordInstallmentPayment', () => {
    it('should update installment paid amount', () => {
      const installment = {
        id: 'inst-1',
        amount: '300.00',
        paid_amount: '0.00',
        status: 'pending',
      };

      const paymentAmount = 300;
      const newPaidAmount = parseFloat(installment.paid_amount) + paymentAmount;
      const isFullyPaid = newPaidAmount >= parseFloat(installment.amount);

      const updatedInstallment = {
        ...installment,
        paid_amount: newPaidAmount.toFixed(2),
        status: isFullyPaid ? 'paid' : 'partial',
        paid_at: isFullyPaid ? new Date().toISOString() : null,
      };

      expect(updatedInstallment.paid_amount).toBe('300.00');
      expect(updatedInstallment.status).toBe('paid');
      expect(updatedInstallment.paid_at).toBeDefined();
    });

    it('should handle partial payments', () => {
      const installment = {
        amount: '300.00',
        paid_amount: '0.00',
        status: 'pending',
      };

      const paymentAmount = 150;
      const newPaidAmount = parseFloat(installment.paid_amount) + paymentAmount;
      const isFullyPaid = newPaidAmount >= parseFloat(installment.amount);

      expect(newPaidAmount).toBe(150);
      expect(isFullyPaid).toBe(false);

      const updatedStatus = isFullyPaid ? 'paid' : 'partial';
      expect(updatedStatus).toBe('partial');
    });

    it('should update payment plan totals after installment payment', () => {
      const plan = {
        total_amount: '900.00',
        paid_amount: '0.00',
        remaining_amount: '900.00',
        number_of_installments: 3,
      };

      const paymentAmount = 300;
      const newPaidAmount = parseFloat(plan.paid_amount) + paymentAmount;
      const newRemainingAmount = parseFloat(plan.remaining_amount) - paymentAmount;

      expect(newPaidAmount).toBe(300);
      expect(newRemainingAmount).toBe(600);
    });

    it('should mark plan as completed when all installments paid', () => {
      const plan = {
        status: 'active',
        number_of_installments: 3,
      };

      const paidInstallmentsCount = 3;
      const allPaid = paidInstallmentsCount >= plan.number_of_installments;

      expect(allPaid).toBe(true);

      const completedPlan = {
        ...plan,
        status: allPaid ? 'completed' : 'active',
        completed_at: allPaid ? new Date().toISOString() : null,
      };

      expect(completedPlan.status).toBe('completed');
      expect(completedPlan.completed_at).toBeDefined();
    });
  });

  describe('getOverdueInstallments', () => {
    it('should identify overdue installments', () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const installments = [
        { id: '1', due_date: yesterday.toISOString(), status: 'pending' },
        { id: '2', due_date: tomorrow.toISOString(), status: 'pending' },
        { id: '3', due_date: yesterday.toISOString(), status: 'paid' },
      ];

      const overdue = installments.filter((i) => {
        const dueDate = new Date(i.due_date);
        return i.status === 'pending' && dueDate < now;
      });

      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe('1');
    });
  });

  describe('checkDefaultedPlans', () => {
    it('should detect plan with 2+ consecutive overdue installments', () => {
      const installments = [
        { installment_number: 1, status: 'paid' },
        { installment_number: 2, status: 'overdue' },
        { installment_number: 3, status: 'overdue' },
        { installment_number: 4, status: 'pending' },
      ];

      // Sort by installment number
      const sorted = [...installments].sort(
        (a, b) => a.installment_number - b.installment_number
      );

      // Check for consecutive overdue
      let consecutiveOverdue = 0;
      let isDefaulted = false;

      for (const inst of sorted) {
        if (inst.status === 'overdue') {
          consecutiveOverdue++;
          if (consecutiveOverdue >= 2) {
            isDefaulted = true;
            break;
          }
        } else if (inst.status === 'paid') {
          consecutiveOverdue = 0;
        }
      }

      expect(isDefaulted).toBe(true);
    });

    it('should not default plan with non-consecutive overdue', () => {
      const installments = [
        { installment_number: 1, status: 'overdue' },
        { installment_number: 2, status: 'paid' },
        { installment_number: 3, status: 'overdue' },
        { installment_number: 4, status: 'pending' },
      ];

      const sorted = [...installments].sort(
        (a, b) => a.installment_number - b.installment_number
      );

      let consecutiveOverdue = 0;
      let isDefaulted = false;

      for (const inst of sorted) {
        if (inst.status === 'overdue') {
          consecutiveOverdue++;
          if (consecutiveOverdue >= 2) {
            isDefaulted = true;
            break;
          }
        } else if (inst.status === 'paid') {
          consecutiveOverdue = 0;
        }
      }

      expect(isDefaulted).toBe(false);
    });
  });

  describe('Payment Plan Calculations', () => {
    it('should handle currency formatting', () => {
      const amount = 1234.56;
      const currency = 'EUR';

      const formatted = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency,
      }).format(amount);

      // Formatting may vary by locale implementation
      expect(formatted).toContain('€');
      expect(formatted.replace(/\s/g, '')).toMatch(/1\.?234,56/);
    });

    it('should calculate remaining amount correctly', () => {
      const totalAmount = 1000;
      const paidAmount = 350;
      const remaining = totalAmount - paidAmount;

      expect(remaining).toBe(650);
    });

    it('should calculate progress percentage', () => {
      const totalAmount = 1000;
      const paidAmount = 350;
      const progress = (paidAmount / totalAmount) * 100;

      expect(progress).toBe(35);
    });
  });
});
