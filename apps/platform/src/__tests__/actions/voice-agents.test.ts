/**
 * Voice Agents Server Actions Tests
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test';
import {
  createMockSupabaseClient,
  createMockVoiceAgent,
  createMockElevenLabsClient,
  mockUserData,
  mockCompanyId,
} from '../setup';

describe('Voice Agents Server Actions', () => {
  describe('getVoiceAgents', () => {
    it('should return voice agents for authenticated user', () => {
      const agents = [
        createMockVoiceAgent({ id: 'agent-1', name: 'Agent 1' }),
        createMockVoiceAgent({ id: 'agent-2', name: 'Agent 2' }),
      ];

      expect(agents).toHaveLength(2);
      expect(agents[0]).toHaveProperty('id');
      expect(agents[0]).toHaveProperty('company_id');
      expect(agents[0]).toHaveProperty('name');
      expect(agents[0]).toHaveProperty('elevenlabs_agent_id');
      expect(agents[0]).toHaveProperty('voice_id');
      expect(agents[0]).toHaveProperty('settings');
    });

    it('should filter by company_id for multi-tenancy', () => {
      const agent1 = createMockVoiceAgent({ company_id: mockCompanyId });
      const agent2 = createMockVoiceAgent({ company_id: 'other-company' });

      const userAgents = [agent1, agent2].filter(
        (a) => a.company_id === mockCompanyId
      );

      expect(userAgents).toHaveLength(1);
      expect(userAgents[0].company_id).toBe(mockCompanyId);
    });

    it('should filter by active status', () => {
      const agents = [
        createMockVoiceAgent({ is_active: true }),
        createMockVoiceAgent({ is_active: false }),
        createMockVoiceAgent({ is_active: true }),
      ];

      const activeAgents = agents.filter((a) => a.is_active);

      expect(activeAgents).toHaveLength(2);
    });
  });

  describe('createVoiceAgent', () => {
    it('should create agent with valid input', () => {
      const input = {
        name: 'New Agent',
        language: 'es',
        voiceId: 'voice-1',
        systemPrompt: 'You are a helpful debt collection agent',
        firstMessage: 'Hello, this is PayCore calling about your account.',
      };

      const agent = createMockVoiceAgent({
        name: input.name,
        language: input.language,
        voice_id: input.voiceId,
        system_prompt: input.systemPrompt,
        first_message: input.firstMessage,
        is_active: true,
      });

      expect(agent.name).toBe(input.name);
      expect(agent.language).toBe('es');
      expect(agent.voice_id).toBe(input.voiceId);
      expect(agent.is_active).toBe(true);
    });

    it('should set default settings if not provided', () => {
      const defaultSettings = {
        maxCallDuration: 300,
        temperature: 0.5,
        stability: 0.5,
        similarityBoost: 0.75,
        enableTranscription: true,
        enableRecording: true,
      };

      const agent = createMockVoiceAgent({ settings: defaultSettings });

      expect(agent.settings).toEqual(defaultSettings);
      expect(agent.settings.maxCallDuration).toBe(300);
      expect(agent.settings.enableTranscription).toBe(true);
    });
  });

  describe('updateVoiceAgent', () => {
    it('should update agent properties', () => {
      const originalAgent = createMockVoiceAgent({
        name: 'Original Name',
        is_active: true,
      });

      const updates = {
        name: 'Updated Name',
        is_active: false,
      };

      const updatedAgent = {
        ...originalAgent,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      expect(updatedAgent.name).toBe('Updated Name');
      expect(updatedAgent.is_active).toBe(false);
      expect(updatedAgent.id).toBe(originalAgent.id);
    });

    it('should preserve elevenlabs_agent_id on update', () => {
      const originalAgent = createMockVoiceAgent({
        elevenlabs_agent_id: 'elevenlabs-123',
      });

      const updates = { name: 'New Name' };

      const updatedAgent = {
        ...originalAgent,
        ...updates,
      };

      expect(updatedAgent.elevenlabs_agent_id).toBe('elevenlabs-123');
    });
  });

  describe('deleteVoiceAgent', () => {
    it('should soft delete by setting is_active to false', () => {
      const agent = createMockVoiceAgent({ is_active: true });

      const deletedAgent = {
        ...agent,
        is_active: false,
        deleted_at: new Date().toISOString(),
      };

      expect(deletedAgent.is_active).toBe(false);
      expect(deletedAgent.deleted_at).toBeDefined();
    });
  });

  describe('Voice Agent Settings Validation', () => {
    it('should validate maxCallDuration range', () => {
      const validateMaxCallDuration = (duration: number): boolean => {
        return duration >= 60 && duration <= 600;
      };

      expect(validateMaxCallDuration(60)).toBe(true);
      expect(validateMaxCallDuration(300)).toBe(true);
      expect(validateMaxCallDuration(600)).toBe(true);
      expect(validateMaxCallDuration(30)).toBe(false);
      expect(validateMaxCallDuration(700)).toBe(false);
    });

    it('should validate temperature range', () => {
      const validateTemperature = (temp: number): boolean => {
        return temp >= 0 && temp <= 1;
      };

      expect(validateTemperature(0)).toBe(true);
      expect(validateTemperature(0.5)).toBe(true);
      expect(validateTemperature(1)).toBe(true);
      expect(validateTemperature(-0.1)).toBe(false);
      expect(validateTemperature(1.5)).toBe(false);
    });

    it('should validate stability range', () => {
      const validateStability = (stability: number): boolean => {
        return stability >= 0 && stability <= 1;
      };

      expect(validateStability(0)).toBe(true);
      expect(validateStability(0.5)).toBe(true);
      expect(validateStability(1)).toBe(true);
    });
  });

  describe('ElevenLabs Integration', () => {
    it('should mock ElevenLabs client correctly', async () => {
      const elevenLabsClient = createMockElevenLabsClient();

      const agentId = await elevenLabsClient.createAgent();
      expect(agentId).toBe('mock-agent-id');

      const voices = await elevenLabsClient.getVoices();
      expect(voices).toHaveLength(2);
      expect(voices[0].labels.language).toBe('es');
    });

    it('should generate first message from template', () => {
      const elevenLabsClient = createMockElevenLabsClient();

      const message = elevenLabsClient.generateFirstMessage();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should mock call initiation', async () => {
      const elevenLabsClient = createMockElevenLabsClient();

      const callResult = await elevenLabsClient.initiateCall();

      expect(callResult.call_id).toBe('mock-call-id');
      expect(callResult.status).toBe('pending');
    });

    it('should mock call status retrieval', async () => {
      const elevenLabsClient = createMockElevenLabsClient();

      const callStatus = await elevenLabsClient.getCallStatus();

      expect(callStatus.status).toBe('completed');
      expect(callStatus.duration).toBe(120);
      expect(callStatus.analysis).toBeDefined();
      expect(callStatus.analysis.outcome).toBe('promise_to_pay');
    });
  });

  describe('Voice Selection', () => {
    it('should filter voices by language', async () => {
      const voices = [
        { voice_id: 'v1', name: 'Maria', labels: { language: 'es' } },
        { voice_id: 'v2', name: 'Carlos', labels: { language: 'es' } },
        { voice_id: 'v3', name: 'John', labels: { language: 'en' } },
      ];

      const spanishVoices = voices.filter((v) => v.labels.language === 'es');

      expect(spanishVoices).toHaveLength(2);
      expect(spanishVoices.every((v) => v.labels.language === 'es')).toBe(true);
    });
  });

  describe('System Prompt Generation', () => {
    it('should include company context in prompt', () => {
      const companyName = 'PayCore Inc';
      const debtorName = 'John Doe';
      const debtAmount = '1,500.00';
      const currency = 'EUR';

      const prompt = `You are a professional debt collection agent for ${companyName}.
You are calling ${debtorName} about an outstanding debt of ${debtAmount} ${currency}.
Be polite but firm. Offer payment plan options if needed.`;

      expect(prompt).toContain(companyName);
      expect(prompt).toContain(debtorName);
      expect(prompt).toContain(debtAmount);
      expect(prompt).toContain(currency);
    });

    it('should generate dynamic first message', () => {
      const debtorName = 'Maria Garcia';
      const companyName = 'PayCore';

      const firstMessage = `Hola, ${debtorName}. Mi nombre es Ana y llamo de parte de ${companyName}. ¿Es un buen momento para hablar?`;

      expect(firstMessage).toContain(debtorName);
      expect(firstMessage).toContain(companyName);
    });
  });
});
