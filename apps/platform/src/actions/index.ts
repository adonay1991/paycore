/**
 * Server Actions Index
 *
 * Re-export all server actions for easy importing.
 */

// Voice Agents
export {
  getVoiceAgents,
  getVoiceAgent,
  createVoiceAgent,
  updateVoiceAgent,
  deleteVoiceAgent,
  initiateCall,
  initiateTestCall,
  getCallHistory,
  syncCallStatus,
  getElevenLabsVoices,
  listElevenLabsAgents,
  getCustomersForCalls,
  getDebtCasesForCustomer,
  syncAgentWithElevenLabs,
  linkElevenLabsAgent,
} from './voice-agents';

export type { DebtCaseForCall } from './voice-agents';

// Campaigns
export {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  populateCampaignContacts,
  startCampaign,
  pauseCampaign,
  completeCampaign,
  cancelCampaign,
} from './campaigns';

// Payment Plans
export {
  getPaymentPlans,
  getPaymentPlan,
  createPaymentPlan,
  acceptPaymentPlan,
  cancelPaymentPlan,
  recordInstallmentPayment,
  getOverdueInstallments,
  checkDefaultedPlans,
} from './payment-plans';

// Escalation Rules
export {
  getEscalationRules,
  getEscalationRule,
  createEscalationRule,
  updateEscalationRule,
  deleteEscalationRule,
  toggleRuleStatus,
  getRuleExecutions,
  evaluateRulesForDebtCase,
  runRulesEngine,
  getRulesStats,
} from './escalation-rules';
