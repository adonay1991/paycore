/**
 * Types Package Unit Tests
 *
 * Tests for type guards, constants, and utility functions.
 */

import { describe, expect, test } from 'bun:test';
import {
  ROLE_PERMISSIONS,
  hasPermission,
  type UserRole,
  type Permission,
  type InvoiceStatus,
  type PaymentStatus,
  type DebtCaseStatus,
  type DebtCasePriority,
  type Currency,
  type PaymentMethod,
} from '../index';

describe('Types Package', () => {
  describe('ROLE_PERMISSIONS', () => {
    test('admin has all permissions', () => {
      const adminPerms = ROLE_PERMISSIONS.admin;

      expect(adminPerms).toContain('companies:read');
      expect(adminPerms).toContain('companies:write');
      expect(adminPerms).toContain('companies:delete');
      expect(adminPerms).toContain('users:delete');
      expect(adminPerms).toContain('invoices:delete');
      expect(adminPerms).toContain('debt_cases:escalate');
      expect(adminPerms).toContain('settings:write');
      expect(adminPerms).toContain('payments:refund');
    });

    test('manager has limited permissions', () => {
      const managerPerms = ROLE_PERMISSIONS.manager;

      expect(managerPerms).toContain('invoices:read');
      expect(managerPerms).toContain('invoices:write');
      expect(managerPerms).toContain('invoices:send');
      expect(managerPerms).toContain('debt_cases:assign');

      // Should not have delete permissions
      expect(managerPerms).not.toContain('invoices:delete');
      expect(managerPerms).not.toContain('users:delete');
      expect(managerPerms).not.toContain('companies:delete');
    });

    test('user has basic permissions', () => {
      const userPerms = ROLE_PERMISSIONS.user;

      expect(userPerms).toContain('invoices:read');
      expect(userPerms).toContain('invoices:write');
      expect(userPerms).toContain('invoices:send');
      expect(userPerms).toContain('payments:read');
      expect(userPerms).toContain('payments:write');
      expect(userPerms).toContain('debt_cases:read');
      expect(userPerms).toContain('debt_cases:write');

      // Should not have management permissions
      expect(userPerms).not.toContain('debt_cases:assign');
      expect(userPerms).not.toContain('payments:refund');
      expect(userPerms).not.toContain('settings:write');
    });

    test('readonly has only read permissions', () => {
      const readonlyPerms = ROLE_PERMISSIONS.readonly;

      // All permissions should be read-only
      for (const perm of readonlyPerms) {
        expect(perm.endsWith(':read')).toBe(true);
      }

      // Should not have any write permissions
      expect(readonlyPerms).not.toContain('invoices:write');
      expect(readonlyPerms).not.toContain('payments:write');
      expect(readonlyPerms).not.toContain('debt_cases:write');
    });

    test('all roles exist', () => {
      expect(ROLE_PERMISSIONS.admin).toBeDefined();
      expect(ROLE_PERMISSIONS.manager).toBeDefined();
      expect(ROLE_PERMISSIONS.user).toBeDefined();
      expect(ROLE_PERMISSIONS.readonly).toBeDefined();
    });
  });

  describe('hasPermission', () => {
    test('returns true when role has permission', () => {
      expect(hasPermission('admin', 'companies:delete')).toBe(true);
      expect(hasPermission('manager', 'invoices:write')).toBe(true);
      expect(hasPermission('user', 'payments:read')).toBe(true);
      expect(hasPermission('readonly', 'invoices:read')).toBe(true);
    });

    test('returns false when role lacks permission', () => {
      expect(hasPermission('readonly', 'invoices:write')).toBe(false);
      expect(hasPermission('user', 'debt_cases:assign')).toBe(false);
      expect(hasPermission('manager', 'users:delete')).toBe(false);
    });

    test('admin has all permissions', () => {
      const allPermissions: Permission[] = [
        'companies:read',
        'companies:write',
        'companies:delete',
        'users:read',
        'users:write',
        'users:delete',
        'invoices:read',
        'invoices:write',
        'invoices:delete',
        'invoices:send',
        'payments:read',
        'payments:write',
        'payments:process',
        'payments:refund',
        'debt_cases:read',
        'debt_cases:write',
        'debt_cases:delete',
        'debt_cases:assign',
        'debt_cases:escalate',
        'reports:read',
        'reports:export',
        'settings:read',
        'settings:write',
      ];

      for (const perm of allPermissions) {
        expect(hasPermission('admin', perm)).toBe(true);
      }
    });
  });

  describe('Type Definitions', () => {
    // These tests verify types compile correctly
    test('UserRole type allows valid values', () => {
      const roles: UserRole[] = ['admin', 'manager', 'user', 'readonly'];
      expect(roles).toHaveLength(4);
    });

    test('InvoiceStatus type allows valid values', () => {
      const statuses: InvoiceStatus[] = [
        'draft',
        'pending',
        'sent',
        'paid',
        'partial',
        'overdue',
        'cancelled',
      ];
      expect(statuses).toHaveLength(7);
    });

    test('PaymentStatus type allows valid values', () => {
      const statuses: PaymentStatus[] = [
        'pending',
        'processing',
        'completed',
        'failed',
        'refunded',
        'cancelled',
      ];
      expect(statuses).toHaveLength(6);
    });

    test('DebtCaseStatus type allows valid values', () => {
      const statuses: DebtCaseStatus[] = [
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
      expect(statuses).toHaveLength(9);
    });

    test('DebtCasePriority type allows valid values', () => {
      const priorities: DebtCasePriority[] = ['low', 'medium', 'high', 'critical'];
      expect(priorities).toHaveLength(4);
    });

    test('Currency type allows valid values', () => {
      const currencies: Currency[] = ['EUR', 'USD', 'GBP'];
      expect(currencies).toHaveLength(3);
    });

    test('PaymentMethod type allows valid values', () => {
      const methods: PaymentMethod[] = [
        'bank_transfer',
        'card',
        'direct_debit',
        'cash',
        'other',
      ];
      expect(methods).toHaveLength(5);
    });
  });

  describe('Role Hierarchy', () => {
    test('admin has more permissions than manager', () => {
      expect(ROLE_PERMISSIONS.admin.length).toBeGreaterThan(
        ROLE_PERMISSIONS.manager.length
      );
    });

    test('manager has more permissions than user', () => {
      expect(ROLE_PERMISSIONS.manager.length).toBeGreaterThan(
        ROLE_PERMISSIONS.user.length
      );
    });

    test('user has more permissions than readonly', () => {
      expect(ROLE_PERMISSIONS.user.length).toBeGreaterThan(
        ROLE_PERMISSIONS.readonly.length
      );
    });

    test('all manager permissions exist in admin', () => {
      for (const perm of ROLE_PERMISSIONS.manager) {
        expect(ROLE_PERMISSIONS.admin).toContain(perm);
      }
    });

    test('all user permissions exist in manager', () => {
      for (const perm of ROLE_PERMISSIONS.user) {
        expect(ROLE_PERMISSIONS.manager).toContain(perm);
      }
    });

    test('all readonly permissions exist in user', () => {
      for (const perm of ROLE_PERMISSIONS.readonly) {
        expect(ROLE_PERMISSIONS.user).toContain(perm);
      }
    });
  });
});
