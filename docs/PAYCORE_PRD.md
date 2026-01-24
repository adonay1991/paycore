# Product Requirements Document (PRD)
## PayCore Prototype - Agentic Debt Recovery Module

**Versión:** 1.0
**Fecha:** 21 de Enero, 2026
**Autor:** Generado automáticamente
**Estado:** Demo/MVP

---

## 1. Resumen Ejecutivo

### 1.1 Visión del Producto

PayCore Prototype es un módulo de demostración de un sistema de **recuperación de deudas B2B potenciado por IA agéntica**. El sistema utiliza múltiples agentes de IA especializados, orquestados por un coordinador inteligente central, para optimizar y automatizar el proceso de cobro de deudas entre empresas.

### 1.2 Propuesta de Valor

- **Automatización Inteligente**: Reducción del esfuerzo manual mediante agentes de IA especializados
- **Cobertura del Ciclo Completo**: Desde la emisión de facturas hasta fases post-vencimiento
- **Multi-canal**: Comunicación por Email, SMS, WhatsApp, llamadas automatizadas, correo certificado
- **Multi-idioma**: Soporte nativo para Español, Inglés y Portugués
- **Multi-divisa**: Operaciones B2B globales con conversión en tiempo real

### 1.3 Público Objetivo

| Segmento | Descripción |
|----------|-------------|
| **Empresas B2B** | Compañías con cartera de clientes empresariales y facturas pendientes |
| **Departamentos de Cobranza** | Equipos de gestión de cobros que buscan automatización |
| **CFOs y Controllers** | Ejecutivos financieros que necesitan visibilidad de KPIs de cobro |
| **Gestores de Cuenta** | Profesionales que gestionan relaciones con clientes morosos |

---

## 2. Objetivos del Producto

### 2.1 Objetivos de Negocio

| Objetivo | Métrica | Target |
|----------|---------|--------|
| Reducir DSO (Days Sales Outstanding) | Días promedio de cobro | -20% |
| Aumentar tasa de recuperación | % de deuda recuperada | +15% |
| Reducir carga operativa | Horas/semana por agente | -40% |
| Mejorar experiencia del deudor | NPS de contacto | >7.0 |

### 2.2 Objetivos del MVP/Demo

1. Demostrar el concepto de orquestación de agentes de IA
2. Validar flujos de trabajo de cobranza automatizada
3. Probar integración con servicios de voz (ElevenLabs)
4. Establecer arquitectura base para escalabilidad

---

## 3. Funcionalidades Principales

### 3.1 Orquestador Inteligente de Flujos de Cobranza

**Descripción**: Agente central de IA que coordina agentes especializados y decide acciones óptimas en cada etapa.

**Capacidades**:
- Machine Learning con aprendizaje por refuerzo
- Orquestación basada en LLM
- Toma de decisiones dinámica según comportamiento del deudor
- Adaptación de estrategias basada en datos históricos

### 3.2 Agentes de IA Especializados

| Agente | Función | Estado |
|--------|---------|--------|
| **Análisis de Riesgo** | Evalúa probabilidad de impago | Conceptual |
| **Comunicación** | Gestiona interacciones automatizadas multi-canal | Implementado |
| **Negociación** | Conduce negociaciones automatizadas de deuda | Conceptual |
| **Gestión de Promesas** | Monitorea compromisos de pago | Implementado |
| **Escalamiento Legal** | Prepara casos para procedimientos legales | Conceptual |

### 3.3 Gestión de Tareas de Cobranza

**Funcionalidades**:
- Búsqueda y filtrado de deudores por múltiples criterios
- Gestión de documentos de cobranza
- Seguimiento de contactos del deudor
- Asignación y tracking de tareas de cobranza
- Estados de tarea: Pendiente, Completada

**Tipos de Tarea**:
- Llamada telefónica (manual o IA)
- Email automatizado
- Propuesta de acuerdo

**Sentimientos Detectados**:
- Disputa
- Negociación
- Extensión del crédito
- Quita de la deuda
- Plan de pagos
- Compromiso
- Empresa en concurso
- Y más...

### 3.4 Integración de Voz con ElevenLabs

**Descripción**: Llamadas automatizadas con agentes de voz IA.

**Capacidades**:
- Configuración de voz y velocidad de habla
- Variables dinámicas personalizadas por llamada
- Análisis de conversación post-llamada
- Múltiples voces y tonos configurables

**Variables Dinámicas**:
- `agente_nombre`: Nombre del agente
- `empresa_nombre`: Nombre de la empresa
- `factura_numero`: Número de factura
- `factura_importe`: Monto de la factura
- `factura_vencimiento`: Fecha de vencimiento
- `contacto_nombre`: Nombre del contacto
- `deudor_nombre`: Nombre del deudor

### 3.5 Calendario y Dashboard

**Vistas Disponibles**:
- Tareas semanales por estado
- Distribución de tareas por gestor
- Distribución de deuda por gestor
- Tareas por canal de comunicación
- Tareas por grupo de clientes
- Tareas por origen (IA vs Manual)
- Estadísticas de tareas
- Monto total gestionado

### 3.6 Búsqueda Avanzada

**Criterios de Búsqueda**:
- Búsqueda global
- Código de deudor
- NIF/CIF
- Razón social
- Número de documento

**Ámbitos de Búsqueda**:
- Deudores
- Documentos
- Contactos

### 3.7 Internacionalización (i18n)

**Idiomas Soportados**:
- Español (es)
- Inglés (en)
- Portugués (pt)

**Elementos Internacionalizados**:
- UI completa
- Mensajes de sistema
- Templates de comunicación
- Formatos de fecha/moneda

---

## 4. Arquitectura de Flujos de Cobranza

### 4.1 Fases del Ciclo de Cobranza

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CICLO DE COBRANZA AUTOMATIZADO                        │
└─────────────────────────────────────────────────────────────────────────┘

  PRE-VENCIMIENTO        VENCIMIENTO         MOROSIDAD TEMPRANA
       │                     │                      │
       ▼                     ▼                      ▼
  ┌─────────┐          ┌─────────┐           ┌─────────────┐
  │Recordato│          │Notifica-│           │ Comunica-   │
  │rios     │ ───────▶ │ción     │ ────────▶ │ ciones      │
  │amigables│          │formal   │           │ escaladas   │
  └─────────┘          └─────────┘           └─────────────┘
                                                    │
                                                    ▼
                            MOROSIDAD AVANZADA     FASE LEGAL
                                   │                   │
                                   ▼                   ▼
                            ┌─────────────┐    ┌─────────────┐
                            │ Acciones    │    │ Preparación │
                            │ intensivas  │───▶│ legal       │
                            │ de cobro    │    │ automática  │
                            └─────────────┘    └─────────────┘
```

### 4.2 Etapas de Tarea

| ID | Etapa | Descripción |
|----|-------|-------------|
| 1 | Pre-vencimiento | Recordatorios preventivos |
| 2 | Vencimiento | Notificación de vencimiento |
| 3 | 1-15 días | Primera fase de morosidad |
| 4 | 16-30 días | Segunda fase de morosidad |
| 5 | 31-60 días | Morosidad moderada |
| 6 | 61-90 días | Morosidad avanzada |
| 7 | >90 días | Morosidad severa |
| 10 | Manual | Tareas creadas manualmente |

---

## 5. Casos de Uso Principales

### 5.1 CU-01: Búsqueda de Deudor

**Actor**: Gestor de Cobranza

**Flujo Principal**:
1. Usuario accede al módulo de búsqueda
2. Ingresa criterios de búsqueda (código, NIF, razón social)
3. Sistema muestra resultados en pestañas (Deudores, Documentos, Contactos)
4. Usuario selecciona deudor para ver detalles

### 5.2 CU-02: Gestión de Tarea de Cobranza

**Actor**: Gestor de Cobranza

**Flujo Principal**:
1. Usuario visualiza lista de tareas pendientes
2. Filtra por tipo, canal, estado, fecha
3. Selecciona tarea para ver detalle
4. Revisa facturas asociadas, comunicaciones previas, contactos
5. Ejecuta acción (llamar, enviar email, marcar completa)

### 5.3 CU-03: Llamada Automatizada con IA

**Actor**: Sistema (Agente de Voz IA)

**Flujo Principal**:
1. Sistema identifica tarea con canal "Llamada" y agente IA activado
2. Construye payload con variables dinámicas
3. Inicia llamada vía ElevenLabs API
4. Agente de voz ejecuta script con datos del deudor
5. Sistema analiza conversación y extrae resultados
6. Actualiza tarea con sentimiento detectado

### 5.4 CU-04: Visualización de Dashboard de Cobranza

**Actor**: Supervisor / CFO

**Flujo Principal**:
1. Usuario accede al calendario/dashboard
2. Visualiza KPIs de la semana actual
3. Analiza distribución de tareas por gestor
4. Revisa distribución de deuda por canal
5. Exporta reportes según necesidad

---

## 6. Requisitos No Funcionales

### 6.1 Rendimiento

| Métrica | Requisito |
|---------|-----------|
| Tiempo de carga de página | < 2 segundos |
| Tiempo de búsqueda | < 1 segundo |
| Latencia de llamada IA | < 3 segundos para iniciar |
| Usuarios concurrentes | 100+ |

### 6.2 Seguridad

- Autenticación mediante Supabase Auth
- Soporte para Azure AD (SSO empresarial)
- Row-Level Security (RLS) en base de datos
- Variables de entorno para credenciales sensibles
- HTTPS obligatorio

### 6.3 Escalabilidad

- Arquitectura multi-tenant con aislamiento por workspace
- Base de datos PostgreSQL optimizada
- Despliegue en Vercel con edge functions

### 6.4 Disponibilidad

- Target: 99.9% uptime
- Recuperación ante fallos en < 5 minutos

---

## 7. Integraciones

### 7.1 Integraciones Actuales

| Sistema | Propósito | Estado |
|---------|-----------|--------|
| **Supabase** | Base de datos, Auth, Storage | Implementado |
| **ElevenLabs** | Agentes de voz IA | Implementado |
| **Vercel** | Hosting y despliegue | Implementado |

### 7.2 Integraciones Futuras (Roadmap)

| Sistema | Propósito | Prioridad |
|---------|-----------|-----------|
| ERPs (SAP, Oracle) | Sincronización de facturas | Alta |
| CRMs (Salesforce, HubSpot) | Gestión de contactos | Media |
| Pasarelas de Pago | Procesamiento de cobros | Alta |
| Email (SendGrid, AWS SES) | Comunicaciones automatizadas | Alta |
| SMS (Twilio) | Notificaciones SMS | Media |
| WhatsApp Business | Canal de comunicación | Media |

---

## 8. Análisis de Competencia (Argentina y LATAM)

### 8.1 Panorama del Mercado

El mercado de software de cobranza con IA en Argentina y Latinoamérica está experimentando un crecimiento acelerado. Según datos de 2025-2026:

- **76%** de las empresas argentinas ya está adoptando IA en todos los niveles de la organización
- **52%** de los líderes planea usar IA para desarrollar nuevos productos en los próximos 3 años
- 2026 se perfila como el año en que la IA se instalará definitivamente en el ADN de las empresas

### 8.2 Competidores Principales

#### 8.2.1 **Colektia** - Líder Regional
| Aspecto | Detalle |
|---------|---------|
| **Posicionamiento** | "Primera infraestructura de cobranza AI en Latam" |
| **Países** | México, Chile, Colombia, Perú, República Dominicana, Guatemala, Costa Rica, El Salvador, Panamá, Venezuela, Ecuador (11+ países) |
| **Propuesta de Valor** | +25% recupero en mora temprana, -30% costos en <8 semanas |
| **Tecnología** | Machine Learning, análisis conductual predictivo, agente virtual "Colly" |
| **Canales** | Omnicanal: WhatsApp, Email, IVR, SMS |
| **Resultados Case Studies** | 15%→24% recupero (utilities), 18-23% adicional (BNPL), 24-29% mejora (fintech) |
| **Precio** | No público (modelo enterprise) |

**Fuente:** [Colektia](https://colektia.com/)

#### 8.2.2 **Moonflow** - Especialista SMB
| Aspecto | Detalle |
|---------|---------|
| **Posicionamiento** | Software de cobranzas en la nube para PyMEs |
| **Países** | 25+ países en LATAM (Argentina, España, Perú, México, Colombia, Chile, Brasil, Costa Rica, Panamá, Ecuador) |
| **Propuesta de Valor** | -90% costos operativos, +10-15% efectividad de cobro |
| **Tecnología** | Agentes autónomos: Lorena (WhatsApp), Diego (Email/Llamadas), Antonio (Llamadas entrantes) |
| **Capacidades** | ML para recomendación de estrategias, segmentación por nivel de morosidad, 24/7 |
| **Resultados** | +19% tasa de contacto, 200+ empresas clientes |
| **Precio** | Desde **$149 USD/mes**, sin fees de implementación |

**Fuente:** [Moonflow](https://www.moonflow.ai/es)

#### 8.2.3 **Debitia** - Veterano del Mercado
| Aspecto | Detalle |
|---------|---------|
| **Posicionamiento** | Software especializado exclusivamente en gestión de cartera |
| **Países** | 15 países, 200+ empresas, bancos y fintechs |
| **Tecnología** | Automatización de procesos, comunicación omnicanal inteligente |
| **Capacidades** | Mora preventiva, mora temprana, segmentación, integración pagos online |
| **Precio** | No público |

**Fuente:** [Debitia](https://debitia.com.ar/)

#### 8.2.4 **Intiza** - Analítica Avanzada
| Aspecto | Detalle |
|---------|---------|
| **Posicionamiento** | Automatización y segmentación de cartera morosa |
| **Tecnología** | Automatización de procesos, reportes detallados de morosidad |
| **Capacidades** | Segmentación de deudores, informes de efectividad |
| **Precio** | No público |

#### 8.2.5 **Otros Competidores**
| Empresa | Enfoque | Diferenciador |
|---------|---------|---------------|
| **Softland Argentina** | ERP integrado | CRM + Cobranza en solución completa |
| **Loan Software** | Automatización | Robocalls, chatbots, collectors móviles |
| **Giitic** | Escalabilidad | Plataforma flexible multi-sector |

### 8.3 Rangos de Precios del Mercado

Basado en el análisis de mercado argentino:

| Nivel | Precio USD/usuario/mes | Funcionalidades |
|-------|------------------------|-----------------|
| **Básico** | $50 | Monitoreo de pagos, recordatorios automáticos |
| **Estándar** | $150 - $300 | Funcionalidades avanzadas, integraciones |
| **Enterprise** | $500+ | Automatización completa, IA avanzada, integraciones ERP |

**Fuente:** [ComparaSoftware Argentina](https://www.comparasoftware.com.ar/gestion-de-cobranzas)

### 8.4 Análisis Competitivo - PayCore vs Mercado

| Característica | PayCore | Colektia | Moonflow | Debitia |
|----------------|--------|----------|----------|---------|
| **Agentes de Voz IA** | ✅ ElevenLabs | ✅ Propio | ❌ | ❌ |
| **Orquestador LLM** | ✅ | ❌ | Parcial | ❌ |
| **Multi-idioma** | ES/EN/PT | LATAM | LATAM | ES |
| **WhatsApp** | Roadmap | ✅ | ✅ | ✅ |
| **Análisis Sentimiento** | ✅ | ✅ | Parcial | ❌ |
| **Precio Entrada** | TBD | Enterprise | $149/mes | Enterprise |

### 8.5 Oportunidades de Diferenciación

1. **Voice AI de última generación**: Integración con ElevenLabs vs soluciones propietarias básicas
2. **Orquestación LLM**: Toma de decisiones inteligente que la competencia no ofrece
3. **Modelo de precios flexible**: Competir con Moonflow en SMB o diferenciarse en enterprise
4. **Multi-idioma real**: Soporte ES/EN/PT vs solo español de competidores locales

---

## 9. Análisis de Costos - Infraestructura ElevenLabs

### 9.1 Estructura de Precios ElevenLabs (Enero 2026)

ElevenLabs ofrece **Conversational AI / Voice Agents** con la siguiente estructura:

#### 9.1.1 Planes Disponibles

| Plan | Precio Mensual | Créditos | Minutos Agente IA | Costo/Minuto | Uso Comercial |
|------|----------------|----------|-------------------|--------------|---------------|
| **Free** | $0 | 10,000 | ~15 min | N/A | ❌ Solo personal |
| **Starter** | $5 | 30,000 | ~45 min | ~$0.11 | ✅ Con licencia |
| **Creator** | $22 | 100,000 | ~150 min | ~$0.15 | ✅ |
| **Pro** | $99 | 500,000 | ~750 min | ~$0.13 | ✅ |
| **Scale** | $330 | 2,000,000 | ~3,000 min | ~$0.11 | ✅ |
| **Business** | $1,320 | 11,000,000 | ~16,500 min | **$0.08** | ✅ |
| **Enterprise** | Custom | Negociable | Ilimitado | <$0.08 | ✅ |

> **💡 Programa de Grants para Startups:** ElevenLabs ofrece **33 millones de créditos gratis** (valor ~$4,000 USD) válidos por 1 año para startups elegibles. Ideal para fase de validación de PayCore.

**Fuente:** [ElevenLabs Pricing](https://elevenlabs.io/pricing)

#### 9.1.2 Costo por Tipo de Agente

| Tipo de Agente | Costo por Minuto |
|----------------|------------------|
| **Voice Only** | $0.10 (estándar) |
| **Multimodal** | $0.12+ |
| **Text Only** | $0.05 |

**Nota:** Precios reducidos ~50% desde febrero 2025.

**Fuente:** [ElevenLabs Blog - Price Cut](https://elevenlabs.io/blog/we-cut-our-pricing-for-conversational-ai)

#### 9.1.3 Costos Adicionales a Considerar

| Concepto | Detalle |
|----------|---------|
| **Costos LLM** | 10-30% adicional (actualmente absorbido por ElevenLabs) |
| **Voces Premium/Stock** | Fees de licencia adicionales |
| **HIPAA Compliance** | Costo adicional para salud |
| **Overage Minutes** | Tarifa mayor fuera del plan |
| **Custom Voices** | Cargo único por clonación |

**Fuente:** [ElevenLabs Pricing Guide](https://www.eesel.ai/blog/elevenlabs-pricing)

### 9.2 Proyección de Costos para PayCore

#### 9.2.1 Escenario de Uso - Estimaciones

| Escenario | Llamadas/Mes | Duración Promedio | Minutos Totales | Costo Mensual |
|-----------|--------------|-------------------|-----------------|---------------|
| **Piloto** | 100 | 3 min | 300 min | $30 - $45 |
| **SMB** | 500 | 3 min | 1,500 min | $120 - $150 |
| **Mid-Market** | 2,000 | 3 min | 6,000 min | $480 - $600 |
| **Enterprise** | 10,000 | 3 min | 30,000 min | $2,400 - $3,000 |

#### 9.2.2 Comparativa con Alternativas

| Proveedor | Costo/Minuto | Latencia | Idiomas | Calidad |
|-----------|--------------|----------|---------|---------|
| **ElevenLabs** | $0.08-$0.10 | 75ms | 31 | Excelente |
| **OpenAI Realtime** | $0.06-$0.24 | Variable | 50+ | Muy buena |
| **Bland AI** | $0.09 | 100ms | 20+ | Buena |
| **Retell AI** | $0.08-$0.12 | 80ms | 10+ | Buena |

#### 9.2.3 Recomendación de Plan por Fase

| Fase PayCore | Plan Recomendado | Costo Mensual | Justificación |
|-------------|------------------|---------------|---------------|
| **MVP/Demo** | Creator | $22 | 150 min suficientes para pruebas |
| **Piloto Clientes** | Pro | $99 | 750 min, escala moderada |
| **Producción SMB** | Scale | $330 | 3,000 min, mejor unit economics |
| **Producción Enterprise** | Business | $1,320 | 16,500 min, $0.08/min |

### 9.3 ROI Estimado de Voice Agents

#### Costo de Agente Humano vs IA

| Concepto | Agente Humano | Agente IA (ElevenLabs) |
|----------|---------------|------------------------|
| **Costo por llamada (3 min)** | $2.50 - $5.00 | $0.24 - $0.30 |
| **Disponibilidad** | 8h/día | 24/7 |
| **Escalabilidad** | Lineal (más personal) | Instant (más llamadas) |
| **Consistencia** | Variable | 100% |
| **Capacitación** | Continua | Una vez |

**Ahorro potencial**: 85-95% en costo por llamada

### 9.4 Consideraciones Técnicas

1. **Latencia**: ElevenLabs Flash model ofrece 75ms, ideal para conversaciones naturales
2. **Concurrencia**: Business plan soporta ~30 sesiones simultáneas
3. **Idiomas**: 31 idiomas nativos, incluyendo ES, EN, PT
4. **Transcripción**: $0.22/hora adicional si se requiere STT separado
5. **Knowledge Base**: Incluido, permite personalización por cliente

### 9.5 Estrategia de Precios Sugerida para PayCore

Basado en análisis competitivo y costos de infraestructura:

| Tier PayCore | Precio/Mes | Minutos Voz Incluidos | Margen sobre Costo |
|-------------|------------|----------------------|-------------------|
| **Starter** | $199 | 200 min | ~70% |
| **Professional** | $499 | 1,000 min | ~65% |
| **Enterprise** | $1,499+ | 5,000+ min | ~60% |

---

## 10. Roadmap del Producto

### 10.1 Fase 1: MVP/Demo (Actual)

- [x] Búsqueda y gestión de deudores
- [x] Gestión de tareas de cobranza
- [x] Integración básica con ElevenLabs
- [x] Dashboard de calendario semanal
- [x] Autenticación con Supabase
- [x] Internacionalización (ES/EN/PT)

### 10.2 Fase 2: Expansión de Agentes (Próxima)

- [ ] Dashboard de BI completo
- [ ] Simulación avanzada de agentes de IA
- [ ] Sistema de tracking de promesas de pago
- [ ] Workflow de escalamiento legal
- [ ] Integración con sistemas ERP

### 10.3 Fase 3: Producción

- [ ] Multi-tenancy completo
- [ ] Facturación y planes de suscripción
- [ ] API pública para integraciones
- [ ] Reporting avanzado y exportación
- [ ] Mobile app (iOS/Android)

---

## 11. Métricas de Éxito

### 11.1 KPIs del Producto

| KPI | Definición | Frecuencia |
|-----|------------|------------|
| DSO | Días promedio de cobro | Mensual |
| Tasa de Recuperación | % de deuda cobrada | Mensual |
| Tasa de Contacto | % de deudores contactados | Semanal |
| Resolución por IA | % tareas resueltas por IA | Semanal |
| NPS de Cobranza | Satisfacción del deudor | Trimestral |

### 11.2 Métricas Técnicas

| Métrica | Target |
|---------|--------|
| Tiempo de respuesta API | p95 < 500ms |
| Error rate | < 0.1% |
| Cobertura de tests | > 80% |
| Lighthouse score | > 90 |

---

## 12. Anexos

### 12.1 Glosario

| Término | Definición |
|---------|------------|
| **DSO** | Days Sales Outstanding - Días promedio de cobro |
| **Agente Agéntico** | IA autónoma que puede tomar decisiones y ejecutar acciones |
| **RLS** | Row-Level Security - Políticas de seguridad a nivel de fila |
| **Multi-tenant** | Arquitectura donde múltiples clientes comparten la misma infraestructura |
| **TTS** | Text-to-Speech - Conversión de texto a voz |

### 12.2 Referencias

**Documentación Técnica:**
- [ElevenLabs Conversational AI API](https://elevenlabs.io/docs)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [ElevenLabs Pricing Blog](https://elevenlabs.io/blog/we-cut-our-pricing-for-conversational-ai)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

**Análisis de Competencia:**
- [Colektia - Infraestructura AI de Cobranza Digital](https://colektia.com/)
- [Moonflow - Software de Cobranzas con IA](https://www.moonflow.ai/es)
- [Debitia - Software de Cobranzas](https://debitia.com.ar/)
- [ComparaSoftware Argentina - Gestión de Cobranzas](https://www.comparasoftware.com.ar/gestion-de-cobranzas)
- [Mejores Software de Cobranza en Argentina](https://colektia.com/blog/mejores-software-cobranza-argentina)

**Mercado e Industria:**
- [Empresas de IA en Argentina - InvGate](https://blog.invgate.com/es/empresas-de-inteligencia-artificial-en-argentina)
- [IA en Argentina 2026 - El Siglo Web](https://elsigloweb.com/2025/11/03/tendencia-l-inteligencia-artificial-en-2026-empresas-argentinas-se-suben-a-la-revolucion-que-cambio-todo/)
- [Sortlist - Top 10 empresas de IA en Argentina](https://www.sortlist.com/es/s/inteligencia-artificial/argentina-ar)

**Pricing Guides:**
- [ElevenLabs Pricing Breakdown - Flexprice](https://flexprice.io/blog/elevenlabs-pricing-breakdown)
- [ElevenLabs Pricing Guide - eesel.ai](https://www.eesel.ai/blog/elevenlabs-pricing)
- [AI Voice Agent Calculator - Softcery](https://softcery.com/ai-voice-agents-calculator)

---

**Documento generado el 21 de Enero de 2026**
**Última actualización:** Research de competencia y costos de infraestructura
