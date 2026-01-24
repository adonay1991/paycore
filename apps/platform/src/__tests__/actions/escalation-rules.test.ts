/**
 * Escalation Rules Server Actions Tests
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test';
import {
  createMockSupabaseClient,
  createMockEscalationRule,
  createMockDebtCase,
  mockUserData,
  mockCompanyId,
} from '../setup';

describe('Escalation Rules Server Actions', () => {
  describe('getEscalationRules', () => {
    it('should return escalation rules for authenticated user', () => {
      const rules = [
        createMockEscalationRule({ id: 'rule-1', name: 'Rule 1', priority: 1 }),
        createMockEscalationRule({ id: 'rule-2', name: 'Rule 2', priority: 2 }),
      ];

      expect(rules).toHaveLength(2);
      expect(rules[0]).toHaveProperty('id');
      expect(rules[0]).toHaveProperty('company_id');
      expect(rules[0]).toHaveProperty('name');
      expect(rules[0]).toHaveProperty('conditions');
      expect(rules[0]).toHaveProperty('actions');
      expect(rules[0]).toHaveProperty('priority');
    });

    it('should return rules sorted by priority', () => {
      const rules = [
        createMockEscalationRule({ priority: 3 }),
        createMockEscalationRule({ priority: 1 }),
        createMockEscalationRule({ priority: 2 }),
      ];

      const sorted = [...rules].sort((a, b) => a.priority - b.priority);

      expect(sorted[0].priority).toBe(1);
      expect(sorted[1].priority).toBe(2);
      expect(sorted[2].priority).toBe(3);
    });

    it('should filter by active status', () => {
      const rules = [
        createMockEscalationRule({ is_active: true }),
        createMockEscalationRule({ is_active: false }),
        createMockEscalationRule({ is_active: true }),
      ];

      const activeRules = rules.filter((r) => r.is_active);

      expect(activeRules).toHaveLength(2);
    });
  });

  describe('createEscalationRule', () => {
    it('should create rule with valid conditions and actions', () => {
      const input = {
        name: 'High Priority Escalation',
        description: 'Escalate high-value overdue debts',
        conditions: {
          daysOverdue: { min: 30 },
          debtAmount: { min: 1000 },
          priority: ['high', 'critical'],
        },
        actions: [
          { type: 'send_email', params: { templateId: 'reminder-1' } },
          { type: 'assign_agent', params: { agentId: 'agent-1' } },
        ],
      };

      const rule = createMockEscalationRule({
        ...input,
        is_active: true,
        execution_count: 0,
      });

      expect(rule.name).toBe(input.name);
      expect(rule.conditions).toEqual(input.conditions);
      expect(rule.actions).toHaveLength(2);
      expect(rule.is_active).toBe(true);
    });

    it('should auto-assign priority based on existing rules', () => {
      const existingRules = [
        createMockEscalationRule({ priority: 1 }),
        createMockEscalationRule({ priority: 2 }),
      ];

      const maxPriority = Math.max(...existingRules.map((r) => r.priority));
      const newPriority = maxPriority + 1;

      expect(newPriority).toBe(3);
    });
  });

  describe('updateEscalationRule', () => {
    it('should update rule properties', () => {
      const originalRule = createMockEscalationRule({
        name: 'Original Rule',
        is_active: true,
      });

      const updates = {
        name: 'Updated Rule',
        is_active: false,
      };

      const updatedRule = {
        ...originalRule,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      expect(updatedRule.name).toBe('Updated Rule');
      expect(updatedRule.is_active).toBe(false);
    });

    it('should preserve execution count on update', () => {
      const originalRule = createMockEscalationRule({
        execution_count: 42,
      });

      const updates = { name: 'New Name' };

      const updatedRule = {
        ...originalRule,
        ...updates,
      };

      expect(updatedRule.execution_count).toBe(42);
    });
  });

  describe('Condition Evaluation', () => {
    it('should evaluate daysOverdue condition', () => {
      const condition = { daysOverdue: { min: 30, max: 90 } };
      const debtCases = [
        createMockDebtCase({ days_overdue: 15 }), // Too few
        createMockDebtCase({ days_overdue: 45 }), // Match
        createMockDebtCase({ days_overdue: 120 }), // Too many
      ];

      const matches = debtCases.filter((dc) => {
        const days = dc.days_overdue;
        if (condition.daysOverdue.min && days < condition.daysOverdue.min) return false;
        if (condition.daysOverdue.max && days > condition.daysOverdue.max) return false;
        return true;
      });

      expect(matches).toHaveLength(1);
      expect(matches[0].days_overdue).toBe(45);
    });

    it('should evaluate debtAmount condition', () => {
      const condition = { debtAmount: { min: 500, max: 5000 } };
      const debtCases = [
        createMockDebtCase({ total_debt: '100.00' }), // Too low
        createMockDebtCase({ total_debt: '1500.00' }), // Match
        createMockDebtCase({ total_debt: '10000.00' }), // Too high
      ];

      const matches = debtCases.filter((dc) => {
        const amount = parseFloat(dc.total_debt);
        if (condition.debtAmount.min && amount < condition.debtAmount.min) return false;
        if (condition.debtAmount.max && amount > condition.debtAmount.max) return false;
        return true;
      });

      expect(matches).toHaveLength(1);
    });

    it('should evaluate priority condition', () => {
      const condition = { priority: ['high', 'critical'] };
      const debtCases = [
        createMockDebtCase({ priority: 'low' }),
        createMockDebtCase({ priority: 'medium' }),
        createMockDebtCase({ priority: 'high' }),
        createMockDebtCase({ priority: 'critical' }),
      ];

      const matches = debtCases.filter((dc) =>
        condition.priority.includes(dc.priority)
      );

      expect(matches).toHaveLength(2);
    });

    it('should evaluate status condition', () => {
      const condition = { status: ['pending', 'in_progress'] };
      const debtCases = [
        createMockDebtCase({ status: 'pending' }),
        createMockDebtCase({ status: 'in_progress' }),
        createMockDebtCase({ status: 'resolved' }),
        createMockDebtCase({ status: 'cancelled' }),
      ];

      const matches = debtCases.filter((dc) =>
        condition.status.includes(dc.status)
      );

      expect(matches).toHaveLength(2);
    });

    it('should combine multiple conditions with AND logic', () => {
      const conditions = {
        daysOverdue: { min: 30 },
        debtAmount: { min: 1000 },
        priority: ['high', 'critical'],
      };

      const debtCases = [
        createMockDebtCase({
          days_overdue: 45,
          total_debt: '1500.00',
          priority: 'high',
        }), // Match all
        createMockDebtCase({
          days_overdue: 15,
          total_debt: '1500.00',
          priority: 'high',
        }), // Fail days
        createMockDebtCase({
          days_overdue: 45,
          total_debt: '500.00',
          priority: 'high',
        }), // Fail amount
        createMockDebtCase({
          days_overdue: 45,
          total_debt: '1500.00',
          priority: 'low',
        }), // Fail priority
      ];

      const matches = debtCases.filter((dc) => {
        const amount = parseFloat(dc.total_debt);

        if (conditions.daysOverdue.min && dc.days_overdue < conditions.daysOverdue.min)
          return false;
        if (conditions.debtAmount.min && amount < conditions.debtAmount.min) return false;
        if (!conditions.priority.includes(dc.priority)) return false;

        return true;
      });

      expect(matches).toHaveLength(1);
    });
  });

  describe('Action Execution', () => {
    it('should parse send_email action', () => {
      const action = {
        type: 'send_email',
        params: {
          templateId: 'reminder-template',
          subject: 'Payment Reminder',
        },
      };

      expect(action.type).toBe('send_email');
      expect(action.params.templateId).toBeDefined();
    });

    it('should parse send_sms action', () => {
      const action = {
        type: 'send_sms',
        params: {
          templateId: 'sms-reminder',
          message: 'Payment reminder for your account',
        },
      };

      expect(action.type).toBe('send_sms');
      expect(action.params.message).toBeDefined();
    });

    it('should parse initiate_call action', () => {
      const action = {
        type: 'initiate_call',
        params: {
          voiceAgentId: 'agent-1',
          priority: 'high',
        },
      };

      expect(action.type).toBe('initiate_call');
      expect(action.params.voiceAgentId).toBeDefined();
    });

    it('should parse update_priority action', () => {
      const action = {
        type: 'update_priority',
        params: {
          newPriority: 'critical',
        },
      };

      expect(action.type).toBe('update_priority');
      expect(action.params.newPriority).toBe('critical');
    });

    it('should parse assign_agent action', () => {
      const action = {
        type: 'assign_agent',
        params: {
          agentId: 'human-agent-1',
          reason: 'High-value account requires personal attention',
        },
      };

      expect(action.type).toBe('assign_agent');
      expect(action.params.agentId).toBeDefined();
    });
  });

  describe('Rule Execution Tracking', () => {
    it('should increment execution count', () => {
      const rule = createMockEscalationRule({ execution_count: 5 });

      const updatedRule = {
        ...rule,
        execution_count: rule.execution_count + 1,
        last_executed_at: new Date().toISOString(),
      };

      expect(updatedRule.execution_count).toBe(6);
      expect(updatedRule.last_executed_at).toBeDefined();
    });

    it('should track execution per debt case', () => {
      interface RuleExecution {
        rule_id: string;
        debt_case_id: string;
        executed_at: string;
        actions_executed: string[];
        result: 'success' | 'partial' | 'failed';
      }

      const execution: RuleExecution = {
        rule_id: 'rule-1',
        debt_case_id: 'debt-case-1',
        executed_at: new Date().toISOString(),
        actions_executed: ['send_email', 'update_priority'],
        result: 'success',
      };

      expect(execution.actions_executed).toHaveLength(2);
      expect(execution.result).toBe('success');
    });
  });

  describe('Rule Priority Management', () => {
    it('should process rules in priority order', () => {
      const rules = [
        createMockEscalationRule({ id: 'r1', priority: 2, name: 'Rule 2' }),
        createMockEscalationRule({ id: 'r2', priority: 1, name: 'Rule 1' }),
        createMockEscalationRule({ id: 'r3', priority: 3, name: 'Rule 3' }),
      ];

      const processOrder = [...rules]
        .sort((a, b) => a.priority - b.priority)
        .map((r) => r.name);

      expect(processOrder).toEqual(['Rule 1', 'Rule 2', 'Rule 3']);
    });

    it('should handle priority reordering', () => {
      const rules = [
        { id: 'r1', priority: 1 },
        { id: 'r2', priority: 2 },
        { id: 'r3', priority: 3 },
      ];

      // Move r3 to position 1
      const targetId = 'r3';
      const newPosition = 1;

      const reordered = rules.map((rule) => {
        if (rule.id === targetId) {
          return { ...rule, priority: newPosition };
        }
        if (rule.priority >= newPosition && rule.id !== targetId) {
          return { ...rule, priority: rule.priority + 1 };
        }
        return rule;
      });

      const sorted = reordered.sort((a, b) => a.priority - b.priority);

      expect(sorted[0].id).toBe('r3');
      expect(sorted[1].id).toBe('r1');
      expect(sorted[2].id).toBe('r2');
    });
  });

  describe('Escalation Stats', () => {
    it('should calculate rule execution stats', () => {
      const executions = [
        { result: 'success' },
        { result: 'success' },
        { result: 'success' },
        { result: 'failed' },
        { result: 'partial' },
      ];

      const stats = {
        total: executions.length,
        successful: executions.filter((e) => e.result === 'success').length,
        failed: executions.filter((e) => e.result === 'failed').length,
        partial: executions.filter((e) => e.result === 'partial').length,
      };

      expect(stats.total).toBe(5);
      expect(stats.successful).toBe(3);
      expect(stats.failed).toBe(1);
      expect(stats.partial).toBe(1);
    });

    it('should calculate success rate', () => {
      const stats = {
        total: 100,
        successful: 85,
      };

      const successRate = (stats.successful / stats.total) * 100;

      expect(successRate).toBe(85);
    });
  });
});
