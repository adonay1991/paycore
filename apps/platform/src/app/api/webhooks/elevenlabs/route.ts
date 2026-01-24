/**
 * ElevenLabs Webhooks Handler
 *
 * This endpoint receives real-time events from ElevenLabs Conversational AI
 * for voice call status updates, transcripts, and analysis.
 *
 * Events handled:
 * - call.started: Call initiated and ringing
 * - call.connected: Customer answered
 * - call.ended: Call completed or failed
 * - transcript.ready: Full transcript available
 * - analysis.ready: AI analysis of the call
 *
 * NOTE: Some features require migration 00002_webhook_events.sql to be applied.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

interface ElevenLabsWebhookPayload {
  event_type: string;
  event_id: string;
  timestamp: string;
  data: WebhookEventData;
}

interface WebhookEventData {
  call_id?: string;
  agent_id?: string;
  phone_number?: string;
  status?: string;
  duration?: number;
  recording_url?: string;
  transcript?: string;
  analysis?: CallAnalysis;
  error?: {
    code: string;
    message: string;
  };
}

interface CallAnalysis {
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  outcome?: string;
  key_points?: string[];
  next_steps?: string[];
  payment_commitment?: {
    amount?: number;
    date?: string;
    method?: string;
  };
}

type VoiceCallStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'voicemail' | 'busy' | 'cancelled';

// =============================================================================
// WEBHOOK VERIFICATION
// =============================================================================

function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    // In development, skip verification if no secret is configured
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Webhook] Skipping signature verification in development');
      return true;
    }
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

async function handleCallStarted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: WebhookEventData
): Promise<void> {
  console.log(`[Webhook] Call started: ${data.call_id}`);

  if (!data.call_id) return;

  await supabase
    .from('voice_calls')
    .update({
      status: 'pending' as VoiceCallStatus,
      started_at: new Date().toISOString(),
    })
    .eq('elevenlabs_call_id', data.call_id);
}

async function handleCallConnected(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: WebhookEventData
): Promise<void> {
  console.log(`[Webhook] Call connected: ${data.call_id}`);

  if (!data.call_id) return;

  await supabase
    .from('voice_calls')
    .update({
      status: 'in_progress' as VoiceCallStatus,
    })
    .eq('elevenlabs_call_id', data.call_id);
}

async function handleCallEnded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: WebhookEventData
): Promise<void> {
  console.log(`[Webhook] Call ended: ${data.call_id}, duration: ${data.duration}s`);

  if (!data.call_id) return;

  const status: VoiceCallStatus = data.error ? 'failed' : 'completed';

  await supabase
    .from('voice_calls')
    .update({
      status,
      ended_at: new Date().toISOString(),
      duration: data.duration ?? 0,
      recording_url: data.recording_url,
    })
    .eq('elevenlabs_call_id', data.call_id);
}

async function handleTranscriptReady(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: WebhookEventData
): Promise<void> {
  console.log(`[Webhook] Transcript ready: ${data.call_id}`);

  if (!data.call_id || !data.transcript) return;

  await supabase
    .from('voice_calls')
    .update({
      transcription: data.transcript,
    })
    .eq('elevenlabs_call_id', data.call_id);
}

async function handleAnalysisReady(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: WebhookEventData
): Promise<void> {
  console.log(`[Webhook] Analysis ready: ${data.call_id}`);

  if (!data.call_id || !data.analysis) return;

  // Get the call to find associated debt case
  const { data: call } = await supabase
    .from('voice_calls')
    .select('id, debt_case_id')
    .eq('elevenlabs_call_id', data.call_id)
    .maybeSingle();

  if (!call) return;

  // Map outcome to valid enum values
  type VoiceCallOutcome = 'promise_to_pay' | 'payment_plan_agreed' | 'dispute' | 'callback_requested' | 'wrong_number' | 'not_interested' | 'escalate' | 'no_outcome';
  const validOutcomes: VoiceCallOutcome[] = ['promise_to_pay', 'payment_plan_agreed', 'dispute', 'callback_requested', 'wrong_number', 'not_interested', 'escalate', 'no_outcome'];

  const outcome = validOutcomes.includes(data.analysis.outcome as VoiceCallOutcome)
    ? (data.analysis.outcome as VoiceCallOutcome)
    : 'no_outcome';

  // Update call with analysis data
  await supabase
    .from('voice_calls')
    .update({
      analysis: data.analysis,
      sentiment: data.analysis.sentiment,
      outcome,
    })
    .eq('id', call.id);

  // Update debt case if there's an outcome
  if (call.debt_case_id && data.analysis.outcome) {
    type DebtCaseStatus = 'new' | 'contacted' | 'in_progress' | 'payment_plan' | 'escalated' | 'legal' | 'resolved' | 'closed' | 'written_off';

    const outcomeStatusMap: Record<string, DebtCaseStatus> = {
      promise_to_pay: 'in_progress',
      payment_plan_agreed: 'payment_plan',
      payment_plan_accepted: 'payment_plan',
      dispute: 'escalated',
      not_interested: 'contacted',
      callback_requested: 'contacted',
    };

    const newStatus = outcomeStatusMap[data.analysis.outcome];
    if (newStatus) {
      await supabase
        .from('debt_cases')
        .update({ status: newStatus })
        .eq('id', call.debt_case_id);
    }
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-elevenlabs-signature');
    const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;

    // Verify webhook signature
    if (
      webhookSecret &&
      !verifyWebhookSignature(body, signature, webhookSecret)
    ) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload: ElevenLabsWebhookPayload = JSON.parse(body);

    console.log(
      `[Webhook] Received event: ${payload.event_type} (${payload.event_id})`
    );

    const supabase = await createClient();

    // Route to appropriate handler
    switch (payload.event_type) {
      case 'call.started':
        await handleCallStarted(supabase, payload.data);
        break;

      case 'call.connected':
        await handleCallConnected(supabase, payload.data);
        break;

      case 'call.ended':
        await handleCallEnded(supabase, payload.data);
        break;

      case 'transcript.ready':
        await handleTranscriptReady(supabase, payload.data);
        break;

      case 'analysis.ready':
        await handleAnalysisReady(supabase, payload.data);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${payload.event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    service: 'elevenlabs-webhooks',
    timestamp: new Date().toISOString(),
  });
}
