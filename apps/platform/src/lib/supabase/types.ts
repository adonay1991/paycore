/**
 * Supabase Database Types
 *
 * Types for the PayCore database schema.
 * This file follows the standard Supabase type generation format.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          tax_id: string;
          address: string;
          city: string;
          postal_code: string;
          country: string;
          email: string;
          phone: string | null;
          website: string | null;
          logo_url: string | null;
          currency: 'EUR' | 'USD' | 'GBP';
          settings: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          tax_id: string;
          address: string;
          city: string;
          postal_code: string;
          country: string;
          email: string;
          phone?: string | null;
          website?: string | null;
          logo_url?: string | null;
          currency?: 'EUR' | 'USD' | 'GBP';
          settings?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          tax_id?: string;
          address?: string;
          city?: string;
          postal_code?: string;
          country?: string;
          email?: string;
          phone?: string | null;
          website?: string | null;
          logo_url?: string | null;
          currency?: 'EUR' | 'USD' | 'GBP';
          settings?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'manager' | 'user' | 'readonly';
          company_id: string;
          avatar_url: string | null;
          phone: string | null;
          last_login_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'admin' | 'manager' | 'user' | 'readonly';
          company_id: string;
          avatar_url?: string | null;
          phone?: string | null;
          last_login_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'manager' | 'user' | 'readonly';
          company_id?: string;
          avatar_url?: string | null;
          phone?: string | null;
          last_login_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'users_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      customers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          email: string;
          tax_id: string | null;
          address: string;
          city: string;
          postal_code: string;
          country: string;
          phone: string | null;
          contact_person: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          email: string;
          tax_id?: string | null;
          address: string;
          city: string;
          postal_code: string;
          country: string;
          phone?: string | null;
          contact_person?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          email?: string;
          tax_id?: string | null;
          address?: string;
          city?: string;
          postal_code?: string;
          country?: string;
          phone?: string | null;
          contact_person?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      invoices: {
        Row: {
          id: string;
          number: string;
          company_id: string;
          customer_id: string;
          status: 'draft' | 'pending' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
          issue_date: string;
          due_date: string;
          subtotal: string;
          tax_rate: string;
          tax_amount: string;
          total: string;
          paid_amount: string;
          currency: 'EUR' | 'USD' | 'GBP';
          notes: string | null;
          terms_and_conditions: string | null;
          sent_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          number: string;
          company_id: string;
          customer_id: string;
          status?: 'draft' | 'pending' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
          issue_date: string;
          due_date: string;
          subtotal: string;
          tax_rate?: string;
          tax_amount?: string;
          total: string;
          paid_amount?: string;
          currency?: 'EUR' | 'USD' | 'GBP';
          notes?: string | null;
          terms_and_conditions?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          number?: string;
          company_id?: string;
          customer_id?: string;
          status?: 'draft' | 'pending' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
          issue_date?: string;
          due_date?: string;
          subtotal?: string;
          tax_rate?: string;
          tax_amount?: string;
          total?: string;
          paid_amount?: string;
          currency?: 'EUR' | 'USD' | 'GBP';
          notes?: string | null;
          terms_and_conditions?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      debt_cases: {
        Row: {
          id: string;
          invoice_id: string;
          company_id: string;
          customer_id: string;
          status: 'new' | 'contacted' | 'in_progress' | 'payment_plan' | 'resolved' | 'escalated' | 'legal' | 'closed' | 'written_off';
          priority: 'low' | 'medium' | 'high' | 'critical';
          assigned_to_id: string | null;
          total_debt: string;
          currency: 'EUR' | 'USD' | 'GBP';
          last_contact_at: string | null;
          next_action_at: string | null;
          next_action: string | null;
          escalated_at: string | null;
          resolved_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          company_id: string;
          customer_id: string;
          status?: 'new' | 'contacted' | 'in_progress' | 'payment_plan' | 'resolved' | 'escalated' | 'legal' | 'closed' | 'written_off';
          priority?: 'low' | 'medium' | 'high' | 'critical';
          assigned_to_id?: string | null;
          total_debt: string;
          currency?: 'EUR' | 'USD' | 'GBP';
          last_contact_at?: string | null;
          next_action_at?: string | null;
          next_action?: string | null;
          escalated_at?: string | null;
          resolved_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          company_id?: string;
          customer_id?: string;
          status?: 'new' | 'contacted' | 'in_progress' | 'payment_plan' | 'resolved' | 'escalated' | 'legal' | 'closed' | 'written_off';
          priority?: 'low' | 'medium' | 'high' | 'critical';
          assigned_to_id?: string | null;
          total_debt?: string;
          currency?: 'EUR' | 'USD' | 'GBP';
          last_contact_at?: string | null;
          next_action_at?: string | null;
          next_action?: string | null;
          escalated_at?: string | null;
          resolved_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'debt_cases_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'debt_cases_invoice_id_fkey';
            columns: ['invoice_id'];
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'debt_cases_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      voice_agents: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          elevenlabs_agent_id: string | null;
          voice_id: string;
          language: string;
          system_prompt: string;
          first_message: string;
          settings: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          elevenlabs_agent_id?: string | null;
          voice_id: string;
          language?: string;
          system_prompt: string;
          first_message: string;
          settings?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          elevenlabs_agent_id?: string | null;
          voice_id?: string;
          language?: string;
          system_prompt?: string;
          first_message?: string;
          settings?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'voice_agents_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      voice_calls: {
        Row: {
          id: string;
          company_id: string;
          debt_case_id: string | null;
          customer_id: string;
          voice_agent_id: string | null;
          campaign_id: string | null;
          elevenlabs_call_id: string | null;
          twilio_call_sid: string | null;
          phone_number: string;
          status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'voicemail' | 'busy' | 'cancelled';
          outcome: 'promise_to_pay' | 'payment_plan_agreed' | 'dispute' | 'callback_requested' | 'wrong_number' | 'not_interested' | 'escalate' | 'no_outcome' | null;
          direction: string;
          duration: number | null;
          recording_url: string | null;
          transcription: string | null;
          summary: string | null;
          sentiment: string | null;
          metadata: Json | null;
          started_at: string | null;
          ended_at: string | null;
          scheduled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          debt_case_id?: string | null;
          customer_id: string;
          voice_agent_id?: string | null;
          campaign_id?: string | null;
          elevenlabs_call_id?: string | null;
          twilio_call_sid?: string | null;
          phone_number: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'voicemail' | 'busy' | 'cancelled';
          outcome?: 'promise_to_pay' | 'payment_plan_agreed' | 'dispute' | 'callback_requested' | 'wrong_number' | 'not_interested' | 'escalate' | 'no_outcome' | null;
          direction?: string;
          duration?: number | null;
          recording_url?: string | null;
          transcription?: string | null;
          summary?: string | null;
          sentiment?: string | null;
          metadata?: Json | null;
          started_at?: string | null;
          ended_at?: string | null;
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          debt_case_id?: string | null;
          customer_id?: string;
          voice_agent_id?: string | null;
          campaign_id?: string | null;
          elevenlabs_call_id?: string | null;
          twilio_call_sid?: string | null;
          phone_number?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'voicemail' | 'busy' | 'cancelled';
          outcome?: 'promise_to_pay' | 'payment_plan_agreed' | 'dispute' | 'callback_requested' | 'wrong_number' | 'not_interested' | 'escalate' | 'no_outcome' | null;
          direction?: string;
          duration?: number | null;
          recording_url?: string | null;
          transcription?: string | null;
          summary?: string | null;
          sentiment?: string | null;
          metadata?: Json | null;
          started_at?: string | null;
          ended_at?: string | null;
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'voice_calls_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'voice_calls_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      collection_campaigns: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          type: 'voice' | 'email' | 'sms' | 'mixed';
          status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
          voice_agent_id: string | null;
          template_id: string | null;
          filters: Json;
          schedule: Json;
          stats: Json | null;
          started_at: string | null;
          completed_at: string | null;
          scheduled_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          type: 'voice' | 'email' | 'sms' | 'mixed';
          status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
          voice_agent_id?: string | null;
          template_id?: string | null;
          filters?: Json;
          schedule?: Json;
          stats?: Json | null;
          started_at?: string | null;
          completed_at?: string | null;
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          type?: 'voice' | 'email' | 'sms' | 'mixed';
          status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
          voice_agent_id?: string | null;
          template_id?: string | null;
          filters?: Json;
          schedule?: Json;
          stats?: Json | null;
          started_at?: string | null;
          completed_at?: string | null;
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_campaigns_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      communication_templates: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          type: 'voice_script' | 'email' | 'sms';
          subject: string | null;
          content: string;
          language: string;
          variables: string[];
          days_overdue: number | null;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          type: 'voice_script' | 'email' | 'sms';
          subject?: string | null;
          content: string;
          language?: string;
          variables?: string[];
          days_overdue?: number | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          type?: 'voice_script' | 'email' | 'sms';
          subject?: string | null;
          content?: string;
          language?: string;
          variables?: string[];
          days_overdue?: number | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'communication_templates_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      payment_plans: {
        Row: {
          id: string;
          company_id: string;
          debt_case_id: string;
          customer_id: string;
          status: 'proposed' | 'active' | 'completed' | 'defaulted' | 'cancelled';
          total_amount: string;
          down_payment: string;
          number_of_installments: number;
          installment_amount: string;
          frequency: string;
          currency: 'EUR' | 'USD' | 'GBP';
          start_date: string;
          end_date: string | null;
          paid_amount: string;
          remaining_amount: string;
          accepted_at: string | null;
          completed_at: string | null;
          defaulted_at: string | null;
          notes: string | null;
          created_by_voice_call: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          debt_case_id: string;
          customer_id: string;
          status?: 'proposed' | 'active' | 'completed' | 'defaulted' | 'cancelled';
          total_amount: string;
          down_payment?: string;
          number_of_installments: number;
          installment_amount: string;
          frequency?: string;
          currency?: 'EUR' | 'USD' | 'GBP';
          start_date: string;
          end_date?: string | null;
          paid_amount?: string;
          remaining_amount?: string;
          accepted_at?: string | null;
          completed_at?: string | null;
          defaulted_at?: string | null;
          notes?: string | null;
          created_by_voice_call?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          debt_case_id?: string;
          customer_id?: string;
          status?: 'proposed' | 'active' | 'completed' | 'defaulted' | 'cancelled';
          total_amount?: string;
          down_payment?: string;
          number_of_installments?: number;
          installment_amount?: string;
          frequency?: string;
          currency?: 'EUR' | 'USD' | 'GBP';
          start_date?: string;
          end_date?: string | null;
          paid_amount?: string;
          remaining_amount?: string;
          accepted_at?: string | null;
          completed_at?: string | null;
          defaulted_at?: string | null;
          notes?: string | null;
          created_by_voice_call?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_plans_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_plans_debt_case_id_fkey';
            columns: ['debt_case_id'];
            referencedRelation: 'debt_cases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_plans_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      installments: {
        Row: {
          id: string;
          payment_plan_id: string;
          installment_number: number;
          amount: string;
          due_date: string;
          status: 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';
          paid_amount: string;
          paid_at: string | null;
          payment_id: string | null;
          reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payment_plan_id: string;
          installment_number: number;
          amount: string;
          due_date: string;
          status?: 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';
          paid_amount?: string;
          paid_at?: string | null;
          payment_id?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payment_plan_id?: string;
          installment_number?: number;
          amount?: string;
          due_date?: string;
          status?: 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';
          paid_amount?: string;
          paid_at?: string | null;
          payment_id?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'installments_payment_plan_id_fkey';
            columns: ['payment_plan_id'];
            referencedRelation: 'payment_plans';
            referencedColumns: ['id'];
          }
        ];
      };
      escalation_rules: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          priority: number;
          is_active: boolean;
          conditions: Json;
          actions: Json;
          cooldown_hours: number;
          max_executions: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          priority?: number;
          is_active?: boolean;
          conditions?: Json;
          actions?: Json;
          cooldown_hours?: number;
          max_executions?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          priority?: number;
          is_active?: boolean;
          conditions?: Json;
          actions?: Json;
          cooldown_hours?: number;
          max_executions?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'escalation_rules_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      escalation_rule_executions: {
        Row: {
          id: string;
          rule_id: string;
          debt_case_id: string;
          actions_taken: Json;
          executed_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          debt_case_id: string;
          actions_taken?: Json;
          executed_at?: string;
        };
        Update: {
          id?: string;
          rule_id?: string;
          debt_case_id?: string;
          actions_taken?: Json;
          executed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'escalation_rule_executions_rule_id_fkey';
            columns: ['rule_id'];
            referencedRelation: 'escalation_rules';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'escalation_rule_executions_debt_case_id_fkey';
            columns: ['debt_case_id'];
            referencedRelation: 'debt_cases';
            referencedColumns: ['id'];
          }
        ];
      };
      campaign_contacts: {
        Row: {
          id: string;
          campaign_id: string;
          debt_case_id: string;
          customer_id: string;
          status: string;
          attempts: number;
          max_attempts: number;
          last_attempt_at: string | null;
          next_attempt_at: string | null;
          completed_at: string | null;
          outcome: 'promise_to_pay' | 'payment_plan_agreed' | 'dispute' | 'callback_requested' | 'wrong_number' | 'not_interested' | 'escalate' | 'no_outcome' | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          debt_case_id: string;
          customer_id: string;
          status?: string;
          attempts?: number;
          max_attempts?: number;
          last_attempt_at?: string | null;
          next_attempt_at?: string | null;
          completed_at?: string | null;
          outcome?: 'promise_to_pay' | 'payment_plan_agreed' | 'dispute' | 'callback_requested' | 'wrong_number' | 'not_interested' | 'escalate' | 'no_outcome' | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          debt_case_id?: string;
          customer_id?: string;
          status?: string;
          attempts?: number;
          max_attempts?: number;
          last_attempt_at?: string | null;
          next_attempt_at?: string | null;
          completed_at?: string | null;
          outcome?: 'promise_to_pay' | 'payment_plan_agreed' | 'dispute' | 'callback_requested' | 'wrong_number' | 'not_interested' | 'escalate' | 'no_outcome' | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'campaign_contacts_campaign_id_fkey';
            columns: ['campaign_id'];
            referencedRelation: 'collection_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campaign_contacts_debt_case_id_fkey';
            columns: ['debt_case_id'];
            referencedRelation: 'debt_cases';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campaign_contacts_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_company_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: 'admin' | 'manager' | 'user' | 'readonly';
      invoice_status: 'draft' | 'pending' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
      payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
      payment_method: 'bank_transfer' | 'card' | 'direct_debit' | 'cash' | 'other';
      debt_case_status: 'new' | 'contacted' | 'in_progress' | 'payment_plan' | 'resolved' | 'escalated' | 'legal' | 'closed' | 'written_off';
      debt_case_priority: 'low' | 'medium' | 'high' | 'critical';
      currency: 'EUR' | 'USD' | 'GBP';
      voice_call_status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'voicemail' | 'busy' | 'cancelled';
      voice_call_outcome: 'promise_to_pay' | 'payment_plan_agreed' | 'dispute' | 'callback_requested' | 'wrong_number' | 'not_interested' | 'escalate' | 'no_outcome';
      campaign_status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
      campaign_type: 'voice' | 'email' | 'sms' | 'mixed';
      template_type: 'voice_script' | 'email' | 'sms';
      payment_plan_status: 'proposed' | 'active' | 'completed' | 'defaulted' | 'cancelled';
      installment_status: 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// =============================================================================
// Helper Types
// =============================================================================

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

// Convenience aliases
export type InsertTables<T extends keyof PublicSchema['Tables']> = TablesInsert<T>;
export type UpdateTables<T extends keyof PublicSchema['Tables']> = TablesUpdate<T>;

// =============================================================================
// Specialized Types for Application Use
// =============================================================================

// Campaign filter type
export interface CampaignFilters {
  minDebtAmount?: number;
  maxDebtAmount?: number;
  daysOverdueMin?: number;
  daysOverdueMax?: number;
  priorities?: string[];
  statuses?: string[];
}

// Campaign schedule type
export interface CampaignSchedule {
  startTime: string;
  endTime: string;
  timezone: string;
  daysOfWeek: number[];
  maxCallsPerDay?: number;
  maxCallsPerHour?: number;
}

// Campaign stats type
export interface CampaignStats {
  totalContacts: number;
  contacted: number;
  successful: number;
  failed: number;
  pending: number;
}

// Company settings type
export interface CompanySettings {
  invoicePrefix: string;
  invoiceNextNumber: number;
  paymentTermsDays: number;
  reminderEnabled: boolean;
  reminderDays: number[];
  overdueGraceDays: number;
  defaultCurrency: 'EUR' | 'USD' | 'GBP';
}

// Voice agent settings type
export interface VoiceAgentSettings {
  maxCallDuration: number;
  temperature: number;
  stability: number;
  similarityBoost: number;
  enableTranscription: boolean;
  enableRecording: boolean;
}

// Escalation rule conditions type
export interface EscalationRuleConditions {
  daysOverdue?: { min?: number; max?: number };
  debtAmount?: { min?: number; max?: number };
  currentStatus?: string[];
  previousAttempts?: { min?: number; max?: number };
  lastContactDaysAgo?: { min?: number; max?: number };
}

// Escalation rule action type
export interface EscalationRuleAction {
  type: string;
  params: Record<string, unknown>;
}

// Escalation action taken type
export interface EscalationActionTaken {
  type: string;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}
