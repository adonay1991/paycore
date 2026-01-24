/**
 * Call Detail Sheet Component
 *
 * Shows detailed information about a voice call including
 * transcription, recording, summary, and sentiment analysis.
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Clock,
  Calendar,
  User,
  Play,
  Pause,
  MessageText,
  CheckCircle,
  WarningCircle,
  InfoCircle,
  Copy,
  Download,
  Xmark,
} from 'iconoir-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@paycore/ui/components';
import { cn } from '@paycore/ui/lib/utils';
import type { VoiceCall } from '@/actions/voice-agents';

interface CallDetailSheetProps {
  call: VoiceCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Completada' },
  in_progress: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Phone, label: 'En progreso' },
  failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: WarningCircle, label: 'Fallida' },
  no_answer: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: Phone, label: 'Sin respuesta' },
  pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'Pendiente' },
  voicemail: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: MessageText, label: 'Buzón de voz' },
  busy: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: Phone, label: 'Ocupado' },
  cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: WarningCircle, label: 'Cancelada' },
};

const outcomeConfig: Record<string, { color: string; label: string; description: string }> = {
  promise_to_pay: { color: 'bg-green-500', label: 'Promesa de pago', description: 'El cliente se comprometió a pagar' },
  payment_plan_agreed: { color: 'bg-blue-500', label: 'Plan de pagos acordado', description: 'Se acordó un plan de pagos' },
  dispute: { color: 'bg-red-500', label: 'Disputa', description: 'El cliente disputa la deuda' },
  callback_requested: { color: 'bg-yellow-500', label: 'Callback solicitado', description: 'El cliente pidió que le llamen después' },
  wrong_number: { color: 'bg-gray-500', label: 'Número incorrecto', description: 'El número no corresponde al cliente' },
  not_interested: { color: 'bg-orange-500', label: 'No interesado', description: 'El cliente no quiere hablar' },
  escalate: { color: 'bg-purple-500', label: 'Escalar', description: 'Requiere escalado a supervisor' },
  no_outcome: { color: 'bg-gray-400', label: 'Sin resultado', description: 'No se determinó resultado' },
};

const sentimentConfig: Record<string, { color: string; emoji: string; label: string }> = {
  positive: { color: 'text-green-600', emoji: '😊', label: 'Positivo' },
  neutral: { color: 'text-gray-600', emoji: '😐', label: 'Neutral' },
  negative: { color: 'text-red-600', emoji: '😠', label: 'Negativo' },
  frustrated: { color: 'text-orange-600', emoji: '😤', label: 'Frustrado' },
  cooperative: { color: 'text-blue-600', emoji: '🤝', label: 'Cooperativo' },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDateTime(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CallDetailSheet({ call, open, onOpenChange }: CallDetailSheetProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!call) return null;

  const status = statusConfig[call.status] ?? statusConfig.pending;
  const outcome = call.outcome ? outcomeConfig[call.outcome] : null;
  const sentiment = call.sentiment ? sentimentConfig[call.sentiment] : null;

  const handleCopyTranscription = () => {
    if (call.transcription) {
      navigator.clipboard.writeText(call.transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlayRecording = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, this would control an audio player
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-start justify-between pr-8">
            <div>
              <DialogTitle className="text-xl">Detalle de Llamada</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{call.phone_number}</p>
            </div>
            <Badge className={cn('capitalize', status.color)}>
              <status.icon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-semibold">{formatDuration(call.duration)}</p>
              <p className="text-xs text-muted-foreground">Duración</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{formatDateTime(call.started_at)}</p>
              <p className="text-xs text-muted-foreground">Inicio</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              {sentiment ? (
                <>
                  <span className="text-2xl">{sentiment.emoji}</span>
                  <p className={cn('text-sm font-medium', sentiment.color)}>{sentiment.label}</p>
                  <p className="text-xs text-muted-foreground">Sentimiento</p>
                </>
              ) : (
                <>
                  <InfoCircle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">-</p>
                  <p className="text-xs text-muted-foreground">Sentimiento</p>
                </>
              )}
            </div>
          </div>

          {/* Outcome */}
          {outcome && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className={cn('h-3 w-3 rounded-full', outcome.color)} />
                <div>
                  <p className="font-medium">{outcome.label}</p>
                  <p className="text-sm text-muted-foreground">{outcome.description}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recording */}
          {call.recording_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Grabación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayRecording}
                    className="flex-shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isPlaying ? 'Pausar' : 'Reproducir'}
                  </Button>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ width: isPlaying ? '100%' : '0%' }}
                      transition={{ duration: call.duration ?? 60, ease: 'linear' }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    {formatDuration(call.duration)}
                  </span>
                </div>
                <audio src={call.recording_url} className="hidden" />
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {call.summary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <InfoCircle className="h-4 w-4" />
                  Resumen de la Llamada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{call.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Transcription */}
          {call.transcription && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageText className="h-4 w-4" />
                    Transcripción
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyTranscription}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TranscriptionViewer transcription={call.transcription} />
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {call.metadata && Object.keys(call.metadata).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Datos Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(call.metadata as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                      <dd className="font-medium">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Call IDs (for debugging) */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p><span className="font-medium">Call ID:</span> {call.id}</p>
            {call.elevenlabs_call_id && (
              <p><span className="font-medium">ElevenLabs ID:</span> {call.elevenlabs_call_id}</p>
            )}
            {call.twilio_call_sid && (
              <p><span className="font-medium">Twilio SID:</span> {call.twilio_call_sid}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// TRANSCRIPTION VIEWER
// =============================================================================

interface TranscriptionViewerProps {
  transcription: string;
}

function TranscriptionViewer({ transcription }: TranscriptionViewerProps) {
  // Parse transcription - expecting format like:
  // "[Agent]: Hello...\n[Customer]: Hi...\n"
  // Or JSON format with messages array

  let messages: Array<{ role: 'agent' | 'customer'; text: string; timestamp?: string }> = [];

  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(transcription);
    if (Array.isArray(parsed)) {
      messages = parsed;
    }
  } catch {
    // Parse as text format
    const lines = transcription.split('\n').filter(Boolean);
    messages = lines.map((line) => {
      const agentMatch = line.match(/^\[(?:Agent|Agente)\]:\s*(.+)$/i);
      const customerMatch = line.match(/^\[(?:Customer|Cliente)\]:\s*(.+)$/i);
      const timestampMatch = line.match(/^\[(\d{2}:\d{2})\]/);

      if (agentMatch) {
        return { role: 'agent' as const, text: agentMatch[1], timestamp: timestampMatch?.[1] };
      }
      if (customerMatch) {
        return { role: 'customer' as const, text: customerMatch[1], timestamp: timestampMatch?.[1] };
      }
      // Default to agent if no prefix
      return { role: 'agent' as const, text: line };
    });
  }

  if (messages.length === 0) {
    // Fallback: just show raw text
    return (
      <div className="text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded-lg max-h-96 overflow-y-auto">
        {transcription}
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'flex gap-3',
              message.role === 'customer' && 'flex-row-reverse'
            )}
          >
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium',
                message.role === 'agent'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {message.role === 'agent' ? 'AI' : 'C'}
            </div>
            <div
              className={cn(
                'flex-1 p-3 rounded-lg text-sm',
                message.role === 'agent'
                  ? 'bg-primary/5 border border-primary/10'
                  : 'bg-muted'
              )}
            >
              <p className="leading-relaxed">{message.text}</p>
              {message.timestamp && (
                <p className="text-xs text-muted-foreground mt-1">{message.timestamp}</p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
