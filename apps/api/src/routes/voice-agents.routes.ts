/**
 * Voice Agents API Routes
 *
 * Endpoints for managing voice agents and initiating calls.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import {
  getVoiceAgentService,
  VoiceAgentService,
} from '../services/voice/voice-agent.service';
import { getElevenLabsService } from '../services/voice/elevenlabs.service';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  voiceId: z.string().min(1),
  language: z.string().default('es'),
  systemPrompt: z.string().min(1),
  firstMessage: z.string().min(1),
  settings: z
    .object({
      maxCallDuration: z.number().optional(),
      temperature: z.number().min(0).max(1).optional(),
      stability: z.number().min(0).max(1).optional(),
      similarityBoost: z.number().min(0).max(1).optional(),
      enableTranscription: z.boolean().optional(),
      enableRecording: z.boolean().optional(),
    })
    .optional(),
});

const updateAgentSchema = createAgentSchema.partial();

const initiateCallSchema = z.object({
  voiceAgentId: z.string().uuid(),
  customerId: z.string().uuid(),
  debtCaseId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  phoneNumber: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  customFirstMessage: z.string().optional(),
});

const callHistoryQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  debtCaseId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// =============================================================================
// ROUTES
// =============================================================================

export const voiceAgentsRoutes = new Hono();

// ---------------------------------------------------------------------------
// GET /api/voice-agents/elevenlabs-agents
// Get agents created in ElevenLabs platform (not in local DB)
// ---------------------------------------------------------------------------
voiceAgentsRoutes.get('/elevenlabs-agents', async (c) => {
  try {
    const elevenLabs = getElevenLabsService();
    const search = c.req.query('search');
    const pageSize = c.req.query('pageSize');
    const cursor = c.req.query('cursor');

    const response = await elevenLabs.listAgents({
      search: search ?? undefined,
      pageSize: pageSize ? Number.parseInt(pageSize, 10) : undefined,
      cursor: cursor ?? undefined,
    });

    return c.json({
      success: true,
      data: response.agents,
      pagination: {
        cursor: response.cursor,
        hasMore: response.has_more,
      },
    });
  } catch (error) {
    console.error('Failed to list ElevenLabs agents:', error);
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to list ElevenLabs agents',
      },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// GET /api/voice-agents/voices
// Get available voices from ElevenLabs
// ---------------------------------------------------------------------------
voiceAgentsRoutes.get('/voices', async (c) => {
  try {
    const elevenLabs = getElevenLabsService();
    const voices = await elevenLabs.getVoices();

    return c.json({
      success: true,
      data: voices,
    });
  } catch (error) {
    console.error('Failed to get voices:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get voices from ElevenLabs',
      },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// GET /api/voice-agents/voices/spanish
// Get Spanish-speaking voices
// ---------------------------------------------------------------------------
voiceAgentsRoutes.get('/voices/spanish', async (c) => {
  try {
    const elevenLabs = getElevenLabsService();
    const voices = await elevenLabs.getSpanishVoices();

    return c.json({
      success: true,
      data: voices,
    });
  } catch (error) {
    console.error('Failed to get Spanish voices:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get Spanish voices',
      },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// GET /api/voice-agents
// Get all voice agents for the company
// ---------------------------------------------------------------------------
voiceAgentsRoutes.get('/', async (c) => {
  try {
    // TODO: Get companyId from authenticated user
    const companyId = c.req.header('x-company-id');
    if (!companyId) {
      return c.json({ success: false, error: 'Company ID required' }, 400);
    }

    const service = getVoiceAgentService();
    const agents = await service.getVoiceAgents(companyId);

    return c.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    console.error('Failed to get voice agents:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get voice agents',
      },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// POST /api/voice-agents
// Create a new voice agent
// ---------------------------------------------------------------------------
voiceAgentsRoutes.post(
  '/',
  zValidator('json', createAgentSchema),
  async (c) => {
    try {
      const companyId = c.req.header('x-company-id');
      if (!companyId) {
        return c.json({ success: false, error: 'Company ID required' }, 400);
      }

      const body = c.req.valid('json');
      const service = getVoiceAgentService();

      const agent = await service.createVoiceAgent({
        companyId,
        ...body,
      });

      return c.json(
        {
          success: true,
          data: agent,
        },
        201
      );
    } catch (error) {
      console.error('Failed to create voice agent:', error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create voice agent',
        },
        500
      );
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/voice-agents/:id
// Get a specific voice agent
// ---------------------------------------------------------------------------
voiceAgentsRoutes.get('/:id', async (c) => {
  try {
    const companyId = c.req.header('x-company-id');
    if (!companyId) {
      return c.json({ success: false, error: 'Company ID required' }, 400);
    }

    const agentId = c.req.param('id');
    const service = getVoiceAgentService();
    const agent = await service.getVoiceAgent(agentId, companyId);

    if (!agent) {
      return c.json(
        {
          success: false,
          error: 'Voice agent not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error('Failed to get voice agent:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get voice agent',
      },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/voice-agents/:id
// Update a voice agent
// ---------------------------------------------------------------------------
voiceAgentsRoutes.patch(
  '/:id',
  zValidator('json', updateAgentSchema),
  async (c) => {
    try {
      const companyId = c.req.header('x-company-id');
      if (!companyId) {
        return c.json({ success: false, error: 'Company ID required' }, 400);
      }

      const agentId = c.req.param('id');
      const body = c.req.valid('json');
      const service = getVoiceAgentService();

      const agent = await service.updateVoiceAgent(agentId, companyId, body);

      if (!agent) {
        return c.json(
          {
            success: false,
            error: 'Voice agent not found',
          },
          404
        );
      }

      return c.json({
        success: true,
        data: agent,
      });
    } catch (error) {
      console.error('Failed to update voice agent:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to update voice agent',
        },
        500
      );
    }
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/voice-agents/:id
// Delete a voice agent
// ---------------------------------------------------------------------------
voiceAgentsRoutes.delete('/:id', async (c) => {
  try {
    const companyId = c.req.header('x-company-id');
    if (!companyId) {
      return c.json({ success: false, error: 'Company ID required' }, 400);
    }

    const agentId = c.req.param('id');
    const service = getVoiceAgentService();
    const deleted = await service.deleteVoiceAgent(agentId, companyId);

    if (!deleted) {
      return c.json(
        {
          success: false,
          error: 'Voice agent not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      message: 'Voice agent deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete voice agent:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete voice agent',
      },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// POST /api/voice-agents/calls
// Initiate an outbound call
// ---------------------------------------------------------------------------
voiceAgentsRoutes.post(
  '/calls',
  zValidator('json', initiateCallSchema),
  async (c) => {
    try {
      const companyId = c.req.header('x-company-id');
      if (!companyId) {
        return c.json({ success: false, error: 'Company ID required' }, 400);
      }

      const body = c.req.valid('json');
      const service = getVoiceAgentService();

      const call = await service.initiateCall({
        companyId,
        ...body,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      });

      return c.json(
        {
          success: true,
          data: call,
        },
        201
      );
    } catch (error) {
      console.error('Failed to initiate call:', error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to initiate call',
        },
        500
      );
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/voice-agents/calls
// Get call history
// ---------------------------------------------------------------------------
voiceAgentsRoutes.get(
  '/calls',
  zValidator('query', callHistoryQuerySchema),
  async (c) => {
    try {
      const companyId = c.req.header('x-company-id');
      if (!companyId) {
        return c.json({ success: false, error: 'Company ID required' }, 400);
      }

      const query = c.req.valid('query');
      const service = getVoiceAgentService();
      const calls = await service.getCallHistory(companyId, query);

      return c.json({
        success: true,
        data: calls,
      });
    } catch (error) {
      console.error('Failed to get call history:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to get call history',
        },
        500
      );
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/voice-agents/calls/:id
// Get call details
// ---------------------------------------------------------------------------
voiceAgentsRoutes.get('/calls/:id', async (c) => {
  try {
    const companyId = c.req.header('x-company-id');
    if (!companyId) {
      return c.json({ success: false, error: 'Company ID required' }, 400);
    }

    const callId = c.req.param('id');
    const service = getVoiceAgentService();
    const call = await service.getCallDetails(callId, companyId);

    if (!call) {
      return c.json(
        {
          success: false,
          error: 'Call not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: call,
    });
  } catch (error) {
    console.error('Failed to get call details:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get call details',
      },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// POST /api/voice-agents/calls/:id/sync
// Sync call status from ElevenLabs
// ---------------------------------------------------------------------------
voiceAgentsRoutes.post('/calls/:id/sync', async (c) => {
  try {
    const companyId = c.req.header('x-company-id');
    if (!companyId) {
      return c.json({ success: false, error: 'Company ID required' }, 400);
    }

    const callId = c.req.param('id');
    const service = getVoiceAgentService();
    const call = await service.syncCallStatus(callId);

    if (!call) {
      return c.json(
        {
          success: false,
          error: 'Call not found or no ElevenLabs call ID',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: call,
    });
  } catch (error) {
    console.error('Failed to sync call status:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to sync call status',
      },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// POST /api/voice-agents/webhooks/elevenlabs
// Webhook endpoint for ElevenLabs call events
// ---------------------------------------------------------------------------
voiceAgentsRoutes.post('/webhooks/elevenlabs', async (c) => {
  try {
    const body = await c.req.json();

    // Validate webhook signature (implement based on ElevenLabs docs)
    // const signature = c.req.header('x-elevenlabs-signature');
    // if (!validateSignature(signature, body)) {
    //   return c.json({ error: 'Invalid signature' }, 401);
    // }

    const { call_id, status, duration, recording_url, transcript, analysis } =
      body;

    const service = getVoiceAgentService();
    await service.updateCallStatus(call_id, {
      call_id,
      status,
      duration,
      recording_url,
      transcript,
      analysis,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ success: false, error: 'Webhook processing failed' }, 500);
  }
});
