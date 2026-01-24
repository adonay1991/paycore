'use server';

/**
 * Payment Plans Server Actions
 *
 * Server actions for managing payment plans and installments.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types';

// =============================================================================
// TYPES
// =============================================================================

export type PaymentPlan = Tables<'payment_plans'>;
export type Installment = Tables<'installments'>;

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreatePaymentPlanInput {
  debtCaseId: string;
  customerId: string;
  totalAmount: number;
  downPayment?: number;
  numberOfInstallments: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  notes?: string;
  createdByVoiceCall?: string;
}

export interface PaymentPlanWithInstallments extends PaymentPlan {
  installments: Installment[];
  customer?: Tables<'customers'>;
  debtCase?: Tables<'debt_cases'>;
}

// =============================================================================
// PAYMENT PLANS
// =============================================================================

/**
 * Get all payment plans for the current company
 */
export async function getPaymentPlans(filters?: {
  status?: PaymentPlan['status'];
  customerId?: string;
  limit?: number;
}): Promise<ActionResult<PaymentPlanWithInstallments[]>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    let query = supabase
      .from('payment_plans')
      .select(`
        *,
        customers(id, name, email, phone),
        debt_cases(id, total_debt, status),
        installments(*)
      `)
      .eq('company_id', userData.company_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(filters?.limit ?? 50);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (error) {
    console.error('Error getting payment plans:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Get a single payment plan by ID
 */
export async function getPaymentPlan(
  planId: string
): Promise<ActionResult<PaymentPlanWithInstallments>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const { data, error } = await supabase
      .from('payment_plans')
      .select(`
        *,
        customers(id, name, email, phone, address, city),
        debt_cases(id, total_debt, status, invoice_id, invoices(number, total)),
        installments(*)
      `)
      .eq('id', planId)
      .eq('company_id', userData.company_id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!data) {
      return { success: false, error: 'Plan de pago no encontrado' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error getting payment plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Create a new payment plan with installments
 */
export async function createPaymentPlan(
  input: CreatePaymentPlanInput
): Promise<ActionResult<PaymentPlanWithInstallments>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Calculate installment amount
    const downPayment = input.downPayment ?? 0;
    const remainingAmount = input.totalAmount - downPayment;
    const installmentAmount = remainingAmount / input.numberOfInstallments;

    // Calculate end date based on frequency
    const startDate = new Date(input.startDate);
    const endDate = new Date(startDate);
    const frequencyDays = {
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    };
    endDate.setDate(
      endDate.getDate() +
        frequencyDays[input.frequency] * input.numberOfInstallments
    );

    // Create payment plan
    const planData: TablesInsert<'payment_plans'> = {
      company_id: userData.company_id,
      debt_case_id: input.debtCaseId,
      customer_id: input.customerId,
      status: 'proposed',
      total_amount: input.totalAmount.toFixed(2),
      down_payment: downPayment.toFixed(2),
      number_of_installments: input.numberOfInstallments,
      installment_amount: installmentAmount.toFixed(2),
      frequency: input.frequency,
      currency: 'EUR',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      paid_amount: '0',
      remaining_amount: input.totalAmount.toFixed(2),
      notes: input.notes ?? null,
      created_by_voice_call: input.createdByVoiceCall ?? null,
    };

    const { data: plan, error: planError } = await supabase
      .from('payment_plans')
      .insert(planData)
      .select()
      .single();

    if (planError) throw planError;

    // Create installments
    const installments: TablesInsert<'installments'>[] = [];
    let currentDate = new Date(startDate);

    for (let i = 1; i <= input.numberOfInstallments; i++) {
      installments.push({
        payment_plan_id: plan.id,
        installment_number: i,
        amount: installmentAmount.toFixed(2),
        due_date: currentDate.toISOString(),
        status: 'pending',
        paid_amount: '0',
      });

      // Move to next due date
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + frequencyDays[input.frequency]);
    }

    const { error: installmentsError } = await supabase
      .from('installments')
      .insert(installments);

    if (installmentsError) throw installmentsError;

    // Fetch complete plan with installments
    const result = await getPaymentPlan(plan.id);

    revalidatePath('/payment-plans');
    revalidatePath(`/debt-cases/${input.debtCaseId}`);
    return result;
  } catch (error) {
    console.error('Error creating payment plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Accept a proposed payment plan
 */
export async function acceptPaymentPlan(
  planId: string
): Promise<ActionResult<PaymentPlan>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const { data, error } = await supabase
      .from('payment_plans')
      .update({
        status: 'active',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .eq('company_id', userData.company_id)
      .eq('status', 'proposed')
      .select()
      .single();

    if (error) throw error;

    // Update debt case status
    if (data?.debt_case_id) {
      await supabase
        .from('debt_cases')
        .update({ status: 'payment_plan', updated_at: new Date().toISOString() })
        .eq('id', data.debt_case_id);
    }

    revalidatePath('/payment-plans');
    revalidatePath(`/payment-plans/${planId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error accepting payment plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Cancel a payment plan
 */
export async function cancelPaymentPlan(
  planId: string
): Promise<ActionResult<PaymentPlan>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const { data, error } = await supabase
      .from('payment_plans')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .eq('company_id', userData.company_id)
      .select()
      .single();

    if (error) throw error;

    // Cancel pending installments
    await supabase
      .from('installments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('payment_plan_id', planId)
      .eq('status', 'pending');

    revalidatePath('/payment-plans');
    revalidatePath(`/payment-plans/${planId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error cancelling payment plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =============================================================================
// INSTALLMENTS
// =============================================================================

/**
 * Record an installment payment
 */
export async function recordInstallmentPayment(
  installmentId: string,
  amount: number,
  paymentId?: string
): Promise<ActionResult<Installment>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    // Get installment and payment plan
    const { data: installment } = await supabase
      .from('installments')
      .select('*, payment_plans(id, company_id, paid_amount, remaining_amount, number_of_installments)')
      .eq('id', installmentId)
      .single();

    if (!installment) {
      return { success: false, error: 'Cuota no encontrada' };
    }

    const plan = installment.payment_plans as PaymentPlan;
    const installmentAmount = Number.parseFloat(installment.amount);
    const paidAmount = Number.parseFloat(installment.paid_amount) + amount;
    const isFullyPaid = paidAmount >= installmentAmount;

    // Update installment
    const { data, error } = await supabase
      .from('installments')
      .update({
        paid_amount: paidAmount.toFixed(2),
        status: isFullyPaid ? 'paid' : 'partial',
        paid_at: isFullyPaid ? new Date().toISOString() : null,
        payment_id: paymentId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', installmentId)
      .select()
      .single();

    if (error) throw error;

    // Update payment plan totals
    const planPaidAmount = Number.parseFloat(plan.paid_amount) + amount;
    const planRemainingAmount = Number.parseFloat(plan.remaining_amount) - amount;

    // Check if all installments are paid
    const { data: paidInstallments } = await supabase
      .from('installments')
      .select('id')
      .eq('payment_plan_id', plan.id)
      .eq('status', 'paid');

    const allPaid = (paidInstallments?.length ?? 0) + (isFullyPaid ? 1 : 0) >= plan.number_of_installments;

    await supabase
      .from('payment_plans')
      .update({
        paid_amount: planPaidAmount.toFixed(2),
        remaining_amount: Math.max(0, planRemainingAmount).toFixed(2),
        status: allPaid ? 'completed' : 'active',
        completed_at: allPaid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', plan.id);

    // If plan completed, update debt case
    if (allPaid) {
      const { data: fullPlan } = await supabase
        .from('payment_plans')
        .select('debt_case_id')
        .eq('id', plan.id)
        .single();

      if (fullPlan?.debt_case_id) {
        await supabase
          .from('debt_cases')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('id', fullPlan.debt_case_id);
      }
    }

    revalidatePath('/payment-plans');
    revalidatePath(`/payment-plans/${plan.id}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error recording installment payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Get overdue installments
 */
export async function getOverdueInstallments(): Promise<ActionResult<Installment[]>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const { data, error } = await supabase
      .from('installments')
      .select(`
        *,
        payment_plans!inner(
          id,
          company_id,
          customers(id, name, email, phone)
        )
      `)
      .eq('payment_plans.company_id', userData.company_id)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });

    if (error) throw error;

    // Update status to overdue
    if (data && data.length > 0) {
      const overdueIds = data.map((i) => i.id);
      await supabase
        .from('installments')
        .update({ status: 'overdue' })
        .in('id', overdueIds);
    }

    return { success: true, data: data ?? [] };
  } catch (error) {
    console.error('Error getting overdue installments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Check for defaulted payment plans
 * A plan is defaulted if 2+ consecutive installments are overdue
 */
export async function checkDefaultedPlans(): Promise<ActionResult<{ defaulted: number }>> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.user.id)
      .single();

    if (!userData) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Get active plans with overdue installments
    const { data: plans } = await supabase
      .from('payment_plans')
      .select(`
        id,
        installments(id, status, installment_number)
      `)
      .eq('company_id', userData.company_id)
      .eq('status', 'active');

    if (!plans) {
      return { success: true, data: { defaulted: 0 } };
    }

    let defaultedCount = 0;

    for (const plan of plans) {
      const installments = (plan.installments as Installment[]) ?? [];
      const sortedInstallments = installments.sort(
        (a, b) => a.installment_number - b.installment_number
      );

      // Check for 2+ consecutive overdue installments
      let consecutiveOverdue = 0;
      for (const inst of sortedInstallments) {
        if (inst.status === 'overdue') {
          consecutiveOverdue++;
          if (consecutiveOverdue >= 2) {
            // Mark plan as defaulted
            await supabase
              .from('payment_plans')
              .update({
                status: 'defaulted',
                defaulted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', plan.id);

            defaultedCount++;
            break;
          }
        } else if (inst.status === 'paid') {
          consecutiveOverdue = 0;
        }
      }
    }

    revalidatePath('/payment-plans');
    return { success: true, data: { defaulted: defaultedCount } };
  } catch (error) {
    console.error('Error checking defaulted plans:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
