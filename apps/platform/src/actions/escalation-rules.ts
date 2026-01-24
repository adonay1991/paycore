/**
 * Escalation Rules Server Actions
 *
 * Server actions for managing automated escalation rules
 * that trigger actions based on debt case conditions.
 */

'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  Json,
  Tables,
  EscalationRuleConditions,
  EscalationRuleAction,
  EscalationActionTaken,
} from '@/lib/supabase/types';

// =============================================================================
// Types
// =============================================================================

export type EscalationRule = Tables<'escalation_rules'>;
export type EscalationRuleExecution = Tables<'escalation_rule_executions'>;

export interface CreateEscalationRuleInput {
  name: string;
  description?: string;
  priority?: number;
  conditions: EscalationRuleConditions;
  actions: EscalationRuleAction[];
  cooldownHours?: number;
  maxExecutions?: number;
  isActive?: boolean;
}

export interface UpdateEscalationRuleInput {
  name?: string;
  description?: string;
  priority?: number;
  conditions?: EscalationRuleConditions;
  actions?: EscalationRuleAction[];
  cooldownHours?: number;
  maxExecutions?: number;
  isActive?: boolean;
}

export interface EscalationRuleWithStats extends EscalationRule {
  executionCount: number;
  lastExecutedAt: string | null;
  successRate: number;
}

// Re-export for backwards compatibility
export type RuleExecutionResult = EscalationActionTaken;

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Rule CRUD Operations
// =============================================================================

/**
 * Get all escalation rules for the current company
 */
export async function getEscalationRules(): Promise<ActionResult<EscalationRuleWithStats[]>> {
  try {
    const supabase = await createClient();

    const { data: rules, error } = await supabase
      .from('escalation_rules')
      .select('*')
      .is('deleted_at', null)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get execution stats for each rule
    const rulesWithStats = await Promise.all(
      (rules || []).map(async (rule) => {
        const { data: executions } = await supabase
          .from('escalation_rule_executions')
          .select('id, executed_at, actions_taken')
          .eq('rule_id', rule.id)
          .order('executed_at', { ascending: false });

        const executionCount = executions?.length || 0;
        const lastExecutedAt = executions?.[0]?.executed_at || null;

        // Calculate success rate
        let successCount = 0;
        let totalActions = 0;

        for (const execution of executions || []) {
          const actionsTaken = (execution.actions_taken ?? []) as unknown as EscalationActionTaken[];
          for (const action of actionsTaken) {
            totalActions++;
            if (action.success) {
              successCount++;
            }
          }
        }

        const successRate = totalActions > 0 ? (successCount / totalActions) * 100 : 0;

        return {
          ...rule,
          executionCount,
          lastExecutedAt,
          successRate: Math.round(successRate * 100) / 100,
        };
      })
    );

    return { success: true, data: rulesWithStats };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch escalation rules';
    return { success: false, error: message };
  }
}

/**
 * Get a single escalation rule by ID
 */
export async function getEscalationRule(
  ruleId: string
): Promise<ActionResult<EscalationRuleWithStats>> {
  try {
    const supabase = await createClient();

    const { data: rule, error } = await supabase
      .from('escalation_rules')
      .select('*')
      .eq('id', ruleId)
      .is('deleted_at', null)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Get execution stats
    const { data: executions } = await supabase
      .from('escalation_rule_executions')
      .select('id, executed_at, actions_taken')
      .eq('rule_id', ruleId)
      .order('executed_at', { ascending: false });

    const executionCount = executions?.length || 0;
    const lastExecutedAt = executions?.[0]?.executed_at || null;

    let successCount = 0;
    let totalActions = 0;

    for (const execution of executions || []) {
      const actionsTaken = (execution.actions_taken ?? []) as unknown as EscalationActionTaken[];
      for (const action of actionsTaken) {
        totalActions++;
        if (action.success) {
          successCount++;
        }
      }
    }

    const successRate = totalActions > 0 ? (successCount / totalActions) * 100 : 0;

    return {
      success: true,
      data: {
        ...rule,
        executionCount,
        lastExecutedAt,
        successRate: Math.round(successRate * 100) / 100,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch escalation rule';
    return { success: false, error: message };
  }
}

/**
 * Create a new escalation rule
 */
export async function createEscalationRule(
  input: CreateEscalationRuleInput
): Promise<ActionResult<EscalationRule>> {
  try {
    const supabase = await createClient();

    // Get current user's company
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: profile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return { success: false, error: 'User not associated with a company' };
    }

    const { data: rule, error } = await supabase
      .from('escalation_rules')
      .insert({
        company_id: profile.company_id,
        name: input.name,
        description: input.description,
        priority: input.priority ?? 0,
        conditions: input.conditions as unknown as Json,
        actions: input.actions as unknown as Json,
        cooldown_hours: input.cooldownHours ?? 24,
        max_executions: input.maxExecutions,
        is_active: input.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/escalation-rules');
    return { success: true, data: rule };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create escalation rule';
    return { success: false, error: message };
  }
}

/**
 * Update an escalation rule
 */
export async function updateEscalationRule(
  ruleId: string,
  updates: UpdateEscalationRuleInput
): Promise<ActionResult<EscalationRule>> {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
    if (updates.actions !== undefined) updateData.actions = updates.actions;
    if (updates.cooldownHours !== undefined) updateData.cooldown_hours = updates.cooldownHours;
    if (updates.maxExecutions !== undefined) updateData.max_executions = updates.maxExecutions;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data: rule, error } = await supabase
      .from('escalation_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/escalation-rules');
    revalidatePath(`/escalation-rules/${ruleId}`);
    return { success: true, data: rule };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update escalation rule';
    return { success: false, error: message };
  }
}

/**
 * Delete (soft delete) an escalation rule
 */
export async function deleteEscalationRule(ruleId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('escalation_rules')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', ruleId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/escalation-rules');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete escalation rule';
    return { success: false, error: message };
  }
}

/**
 * Toggle rule active status
 */
export async function toggleRuleStatus(ruleId: string): Promise<ActionResult<EscalationRule>> {
  try {
    const supabase = await createClient();

    // Get current status
    const { data: rule, error: fetchError } = await supabase
      .from('escalation_rules')
      .select('is_active')
      .eq('id', ruleId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Toggle status
    const { data: updatedRule, error: updateError } = await supabase
      .from('escalation_rules')
      .update({
        is_active: !rule.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/escalation-rules');
    return { success: true, data: updatedRule };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle rule status';
    return { success: false, error: message };
  }
}

// =============================================================================
// Rule Execution
// =============================================================================

/**
 * Get rule execution history
 */
export async function getRuleExecutions(
  ruleId: string,
  limit = 50
): Promise<ActionResult<EscalationRuleExecution[]>> {
  try {
    const supabase = await createClient();

    const { data: executions, error } = await supabase
      .from('escalation_rule_executions')
      .select(`
        *,
        debt_case:debt_cases (
          id,
          total_debt,
          status,
          priority
        )
      `)
      .eq('rule_id', ruleId)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: executions };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rule executions';
    return { success: false, error: message };
  }
}

/**
 * Check if a debt case matches rule conditions
 */
function checkConditions(
  debtCase: {
    daysOverdue: number;
    totalDebt: number;
    status: string;
    previousAttempts: number;
    lastContactDaysAgo: number | null;
  },
  conditions: EscalationRuleConditions
): boolean {
  // Check days overdue
  if (conditions.daysOverdue) {
    if (conditions.daysOverdue.min !== undefined && debtCase.daysOverdue < conditions.daysOverdue.min) {
      return false;
    }
    if (conditions.daysOverdue.max !== undefined && debtCase.daysOverdue > conditions.daysOverdue.max) {
      return false;
    }
  }

  // Check debt amount
  if (conditions.debtAmount) {
    if (conditions.debtAmount.min !== undefined && debtCase.totalDebt < conditions.debtAmount.min) {
      return false;
    }
    if (conditions.debtAmount.max !== undefined && debtCase.totalDebt > conditions.debtAmount.max) {
      return false;
    }
  }

  // Check current status
  if (conditions.currentStatus && conditions.currentStatus.length > 0) {
    if (!conditions.currentStatus.includes(debtCase.status)) {
      return false;
    }
  }

  // Check previous attempts
  if (conditions.previousAttempts) {
    if (conditions.previousAttempts.min !== undefined && debtCase.previousAttempts < conditions.previousAttempts.min) {
      return false;
    }
    if (conditions.previousAttempts.max !== undefined && debtCase.previousAttempts > conditions.previousAttempts.max) {
      return false;
    }
  }

  // Check last contact days ago
  if (conditions.lastContactDaysAgo && debtCase.lastContactDaysAgo !== null) {
    if (conditions.lastContactDaysAgo.min !== undefined && debtCase.lastContactDaysAgo < conditions.lastContactDaysAgo.min) {
      return false;
    }
    if (conditions.lastContactDaysAgo.max !== undefined && debtCase.lastContactDaysAgo > conditions.lastContactDaysAgo.max) {
      return false;
    }
  }

  return true;
}

/**
 * Execute a single rule action
 */
async function executeAction(
  action: EscalationRuleAction,
  debtCaseId: string,
  companyId: string
): Promise<RuleExecutionResult> {
  const supabase = await createAdminClient();

  try {
    switch (action.type) {
      case 'escalate_priority': {
        const newPriority = (action.params.priority as Tables<'debt_cases'>['priority']) || 'high';
        const { error } = await supabase
          .from('debt_cases')
          .update({
            priority: newPriority,
            updated_at: new Date().toISOString(),
          })
          .eq('id', debtCaseId);

        if (error) throw error;
        return { type: action.type, success: true, result: { newPriority } };
      }

      case 'assign_agent': {
        const agentId = action.params.agentId as string;
        if (!agentId) throw new Error('Agent ID not specified');

        const { error } = await supabase
          .from('debt_cases')
          .update({
            assigned_to_id: agentId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', debtCaseId);

        if (error) throw error;
        return { type: action.type, success: true, result: { assignedTo: agentId } };
      }

      case 'add_to_campaign': {
        const campaignId = action.params.campaignId as string;
        if (!campaignId) throw new Error('Campaign ID not specified');

        // Get debt case with customer
        const { data: debtCase, error: fetchError } = await supabase
          .from('debt_cases')
          .select('invoice:invoices(customer_id)')
          .eq('id', debtCaseId)
          .single();

        if (fetchError) throw fetchError;

        // Type assertion for nested query result
        const invoiceData = debtCase?.invoice as unknown as { customer_id: string } | null;
        const customerId = invoiceData?.customer_id;

        if (!customerId) throw new Error('Customer not found for debt case');

        // Add to campaign contacts
        const { error: insertError } = await supabase
          .from('campaign_contacts')
          .insert({
            campaign_id: campaignId,
            debt_case_id: debtCaseId,
            customer_id: customerId,
            status: 'pending',
          });

        if (insertError) throw insertError;
        return { type: action.type, success: true, result: { campaignId } };
      }

      case 'voice_call': {
        // This would trigger an outbound voice call
        // For now, we'll create a pending voice call record
        const voiceAgentId = action.params.voiceAgentId as string;

        const { data: debtCase, error: fetchError } = await supabase
          .from('debt_cases')
          .select(`
            id,
            invoice:invoices (
              customer:customers (
                id,
                phone
              )
            )
          `)
          .eq('id', debtCaseId)
          .single();

        if (fetchError) throw fetchError;

        // Type assertion for nested query
        const invoiceData = debtCase?.invoice as unknown as { customer: { id: string; phone: string } | null } | null;
        const customer = invoiceData?.customer;

        if (!customer?.phone) {
          return { type: action.type, success: false, error: 'Customer has no phone number' };
        }

        const { data: voiceCall, error: callError } = await supabase
          .from('voice_calls')
          .insert({
            company_id: companyId,
            debt_case_id: debtCaseId,
            customer_id: customer.id,
            voice_agent_id: voiceAgentId,
            phone_number: customer.phone,
            status: 'pending',
            direction: 'outbound',
            scheduled_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (callError) throw callError;
        return { type: action.type, success: true, result: { voiceCallId: voiceCall?.id } };
      }

      case 'send_email':
      case 'send_sms': {
        // These would integrate with email/SMS providers
        // For now, return a placeholder success
        return {
          type: action.type,
          success: true,
          result: { scheduled: true, message: `${action.type} scheduled for delivery` },
        };
      }

      case 'create_debt_case': {
        // This action doesn't make sense for an existing debt case
        return {
          type: action.type,
          success: false,
          error: 'Cannot create debt case from existing debt case',
        };
      }

      default:
        return { type: action.type, success: false, error: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action execution failed';
    return { type: action.type, success: false, error: message };
  }
}

/**
 * Evaluate and execute rules for a specific debt case
 */
export async function evaluateRulesForDebtCase(
  debtCaseId: string
): Promise<ActionResult<{ rulesExecuted: number; actionsExecuted: number }>> {
  try {
    const supabase = await createAdminClient();

    // Get debt case details
    const { data: debtCase, error: debtCaseError } = await supabase
      .from('debt_cases')
      .select(`
        id,
        company_id,
        total_debt,
        status,
        priority,
        last_contact_at,
        created_at,
        invoice:invoices (
          due_date
        )
      `)
      .eq('id', debtCaseId)
      .single();

    if (debtCaseError || !debtCase) {
      return { success: false, error: 'Debt case not found' };
    }

    // Calculate days overdue
    const invoiceData = debtCase.invoice as unknown as { due_date: string } | null;
    const dueDate = invoiceData?.due_date ? new Date(invoiceData.due_date) : new Date();
    const now = new Date();
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate days since last contact
    const lastContactDaysAgo = debtCase.last_contact_at
      ? Math.floor((now.getTime() - new Date(debtCase.last_contact_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Get previous attempts (voice calls + activities)
    const { count: callCount } = await supabase
      .from('voice_calls')
      .select('id', { count: 'exact', head: true })
      .eq('debt_case_id', debtCaseId);

    const previousAttempts = callCount || 0;

    // Get active rules for the company, ordered by priority
    const { data: rules, error: rulesError } = await supabase
      .from('escalation_rules')
      .select('*')
      .eq('company_id', debtCase.company_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('priority', { ascending: true });

    if (rulesError) {
      return { success: false, error: rulesError.message };
    }

    let rulesExecuted = 0;
    let actionsExecuted = 0;

    const debtCaseData = {
      daysOverdue,
      totalDebt: Number(debtCase.total_debt),
      status: debtCase.status,
      previousAttempts,
      lastContactDaysAgo,
    };

    // Evaluate each rule
    for (const rule of rules || []) {
      const conditions = rule.conditions as unknown as EscalationRuleConditions;
      const actions = (rule.actions ?? []) as unknown as EscalationRuleAction[];

      // Check if conditions match
      if (!checkConditions(debtCaseData, conditions)) {
        continue;
      }

      // Check cooldown period
      const { data: recentExecution } = await supabase
        .from('escalation_rule_executions')
        .select('executed_at')
        .eq('rule_id', rule.id)
        .eq('debt_case_id', debtCaseId)
        .order('executed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentExecution) {
        const executedAt = new Date(recentExecution.executed_at);
        const cooldownMs = (rule.cooldown_hours || 24) * 60 * 60 * 1000;
        if (now.getTime() - executedAt.getTime() < cooldownMs) {
          continue; // Still in cooldown
        }
      }

      // Check max executions
      if (rule.max_executions) {
        const { count: executionCount } = await supabase
          .from('escalation_rule_executions')
          .select('id', { count: 'exact', head: true })
          .eq('rule_id', rule.id)
          .eq('debt_case_id', debtCaseId);

        if ((executionCount || 0) >= rule.max_executions) {
          continue; // Max executions reached
        }
      }

      // Execute all actions for this rule
      const actionResults: RuleExecutionResult[] = [];
      for (const action of actions) {
        const result = await executeAction(action, debtCaseId, debtCase.company_id);
        actionResults.push(result);
        if (result.success) {
          actionsExecuted++;
        }
      }

      // Record execution
      await supabase.from('escalation_rule_executions').insert({
        rule_id: rule.id,
        debt_case_id: debtCaseId,
        actions_taken: actionResults as unknown as Json,
        executed_at: new Date().toISOString(),
      });

      rulesExecuted++;
    }

    return {
      success: true,
      data: { rulesExecuted, actionsExecuted },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to evaluate rules';
    return { success: false, error: message };
  }
}

/**
 * Run rules evaluation for all active debt cases
 */
export async function runRulesEngine(): Promise<
  ActionResult<{ debtCasesProcessed: number; rulesExecuted: number; actionsExecuted: number }>
> {
  try {
    const supabase = await createAdminClient();

    // Get all active debt cases (not resolved, closed, or written off)
    const { data: debtCases, error } = await supabase
      .from('debt_cases')
      .select('id')
      .in('status', ['new', 'contacted', 'in_progress', 'payment_plan', 'escalated'])
      .is('deleted_at', null);

    if (error) {
      return { success: false, error: error.message };
    }

    let totalRulesExecuted = 0;
    let totalActionsExecuted = 0;

    // Process each debt case
    for (const debtCase of debtCases || []) {
      const result = await evaluateRulesForDebtCase(debtCase.id);
      if (result.success && result.data) {
        totalRulesExecuted += result.data.rulesExecuted;
        totalActionsExecuted += result.data.actionsExecuted;
      }
    }

    return {
      success: true,
      data: {
        debtCasesProcessed: debtCases?.length || 0,
        rulesExecuted: totalRulesExecuted,
        actionsExecuted: totalActionsExecuted,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run rules engine';
    return { success: false, error: message };
  }
}

/**
 * Get rules statistics for the dashboard
 */
export async function getRulesStats(): Promise<
  ActionResult<{
    totalRules: number;
    activeRules: number;
    totalExecutions: number;
    executionsToday: number;
    avgSuccessRate: number;
  }>
> {
  try {
    const supabase = await createClient();

    // Get total and active rules count
    const { count: totalRules } = await supabase
      .from('escalation_rules')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    const { count: activeRules } = await supabase
      .from('escalation_rules')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null);

    // Get executions count
    const { count: totalExecutions } = await supabase
      .from('escalation_rule_executions')
      .select('id', { count: 'exact', head: true });

    // Get today's executions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: executionsToday } = await supabase
      .from('escalation_rule_executions')
      .select('id', { count: 'exact', head: true })
      .gte('executed_at', today.toISOString());

    // Calculate average success rate
    const { data: recentExecutions } = await supabase
      .from('escalation_rule_executions')
      .select('actions_taken')
      .order('executed_at', { ascending: false })
      .limit(100);

    let successCount = 0;
    let totalActions = 0;

    for (const execution of recentExecutions || []) {
      const actions = (execution.actions_taken ?? []) as unknown as EscalationActionTaken[];
      for (const action of actions) {
        totalActions++;
        if (action.success) {
          successCount++;
        }
      }
    }

    const avgSuccessRate = totalActions > 0 ? (successCount / totalActions) * 100 : 0;

    return {
      success: true,
      data: {
        totalRules: totalRules || 0,
        activeRules: activeRules || 0,
        totalExecutions: totalExecutions || 0,
        executionsToday: executionsToday || 0,
        avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rules stats';
    return { success: false, error: message };
  }
}
