# PayCore - Estrategia de Pitch y Discovery

## Cliente: Concesionario de Coches

**Fecha:** Enero 2026
**Estado:** Pre-discovery
**Objetivo:** Entender necesidades antes de proponer precio

---

## Análisis de Costos Internos

### Costo Variable por Llamada

| Componente | Costo/minuto | Notas |
|------------|--------------|-------|
| ElevenLabs Conversational AI | $0.08 | Plan Business |
| Twilio (telefonía) | $0.02-0.04 | Outbound calls |
| Infraestructura | $0.01 | Supabase + Vercel |
| **Total** | **~$0.12/min** | |

### Costo por Llamada Completa

| Duración llamada | Costo real |
|------------------|------------|
| 2 minutos | $0.24 |
| 3 minutos | $0.36 |
| 4 minutos | $0.48 |
| **Promedio (3 min)** | **~$0.36** |

### Punto de Equilibrio

```
Para no perder dinero:
├── Precio mínimo por llamada: $0.50 (margen 28%)
├── Precio recomendado: $0.75-1.00 (margen 50-64%)
└── Precio premium: $1.50 (margen 76%)
```

---

## Contexto: Concesionarios de Coches

### Modelo de Negocio Típico

```
Concesionario vende coche → Cliente financia (interno o externo)
                                    ↓
                           Pagos mensuales (12-60 meses)
                                    ↓
                           Algunos clientes dejan de pagar
                                    ↓
                           PROBLEMA: ¿Cómo cobrar?
```

### Métricas Típicas del Sector

| Métrica | Rango típico |
|---------|--------------|
| Cartera de clientes financiados | 100-1,000+ |
| Tasa de morosidad mensual | 5-15% |
| Días promedio de mora antes de acción | 15-30 días |
| Tasa de recuperación con gestión | 40-70% |
| Tasa de recuperación sin gestión | 10-20% |
| Costo call center externo | $3-8 por llamada |

### Pain Points Comunes

1. **No tienen tiempo** - El personal de ventas no quiere llamar a cobrar
2. **No es su expertise** - No saben cómo tener conversaciones de cobro efectivas
3. **Inconsistencia** - Llaman cuando se acuerdan, no sistemáticamente
4. **Pierden clientes** - Llamadas agresivas queman la relación
5. **Pierden dinero** - Deudas que pasan a incobrable por no gestionar a tiempo

---

## Guión de Reunión Discovery

### Apertura (2 minutos)

> "Gracias por tu tiempo. Antes de contarte sobre PayCore, me gustaría entender mejor cómo funciona tu negocio. No vengo a venderte nada hoy, solo a escuchar y ver si tiene sentido trabajar juntos."

### Bloque 1: Entender la Operación (10 minutos)

**Pregunta 1: Volumen**
> "¿Cuántos clientes tienen actualmente con financiamiento activo?"

*Esperar respuesta. Anotar número exacto.*

**Pregunta 2: Morosidad**
> "De esos clientes, ¿qué porcentaje entra en mora cada mes, más o menos?"

*Si no sabe exacto:* "¿Dirías que es 1 de cada 10? ¿1 de cada 20?"

**Pregunta 3: Proceso actual**
> "Cuando un cliente se atrasa, ¿cómo lo manejan hoy? ¿Tienen a alguien que llame, o cómo funciona?"

*Escuchar atentamente. Posibles respuestas:*
- "Lo hace el vendedor que cerró la venta" → Conflicto de interés
- "Lo hace administración cuando puede" → No es prioridad
- "Tercerizamos a una empresa de cobranza" → Conocen el costo
- "Nadie, la verdad" → Gran oportunidad

**Pregunta 4: Volumen de llamadas**
> "¿Aproximadamente cuántas llamadas de cobranza hacen al mes?"

*Si no tercerizan:* "¿Cuántas deberían hacer vs cuántas realmente hacen?"

**Pregunta 5: Costos actuales**
> "Si tercerizan o tienen personal dedicado, ¿tienes idea de cuánto les cuesta cada llamada o gestión?"

### Bloque 2: Entender el Dolor (5 minutos)

**Pregunta 6: Impacto**
> "Cuando no llaman a tiempo, ¿qué pasa? ¿Pierden el dinero completamente o eventualmente pagan?"

**Pregunta 7: Frustración**
> "¿Qué es lo que más te frustra del proceso de cobranza hoy?"

*Dejar que hable. No interrumpir. Anotar palabras exactas.*

**Pregunta 8: Intentos previos**
> "¿Han probado alguna solución antes? ¿Por qué no funcionó?"

### Bloque 3: Entender la Decisión (5 minutos)

**Pregunta 9: Decisor**
> "Si esto tuviera sentido, ¿eres tú quien decide o hay alguien más involucrado?"

**Pregunta 10: Presupuesto**
> "¿Tienen algún presupuesto asignado para mejorar la gestión de cobranzas, o es algo que evaluarían si ven valor?"

**Pregunta 11: Éxito**
> "Si hiciéramos un piloto, ¿qué resultado necesitarías ver para decir 'esto funciona'?"

*Buscar respuesta concreta: "Recuperar X%", "Reducir mora a Y días", etc.*

**Pregunta 12: Timeline**
> "¿Hay alguna urgencia? ¿O es algo que pueden evaluar con calma?"

### Cierre (3 minutos)

**Si hay fit:**
> "Con lo que me cuentas, creo que PayCore podría ayudarles. Dame unos días para preparar una propuesta específica basada en tus números. ¿Te parece si nos vemos la próxima semana?"

**Si no hay fit:**
> "Siendo honesto, con el volumen que manejan, no sé si PayCore sea la mejor opción ahora mismo. [Explicar por qué]. Si la situación cambia, aquí estoy."

**Si necesita más información:**
> "Entiendo que necesitas más información. ¿Qué te parece si te mando un resumen de cómo funciona PayCore y agendamos otra llamada para resolver dudas?"

---

## Calculadora de Propuesta

### Fórmula para Calcular Ahorro

```
SITUACIÓN ACTUAL:
├── Clientes en mora/mes: [A]
├── Llamadas necesarias por cliente: [B] (típico: 3-5)
├── Total llamadas necesarias: A × B = [C]
├── Costo actual por llamada: [D] (si tercerizan) o $0 (si no llaman)
├── Costo actual mensual: C × D = [E]

CON PAYCORE:
├── Costo por llamada PayCore: $0.75-1.00
├── Costo mensual PayCore: C × $0.75 = [F]

AHORRO:
├── Ahorro mensual: E - F = [G]
├── Ahorro anual: G × 12 = [H]

SI NO LLAMAN HOY:
├── Deuda promedio por cliente: [I]
├── Clientes que pasan a incobrable/mes: [J]
├── Pérdida mensual actual: I × J = [K]
├── Tasa recuperación con PayCore: ~50%
├── Recuperación adicional: K × 50% = [L]
├── ROI: L / F = [M]x
```

### Ejemplo con Números Hipotéticos

```
Concesionario con:
├── 500 clientes financiados
├── 10% mora mensual = 50 clientes morosos
├── 3 llamadas por cliente = 150 llamadas/mes
├── Deuda promedio: $500 USD
├── Hoy no llaman → 30% pasa a incobrable = 15 clientes
├── Pérdida mensual: 15 × $500 = $7,500

Con PayCore:
├── 150 llamadas × $0.75 = $112.50/mes
├── Recuperación 50% de los 15 = 7.5 clientes
├── Recuperado: 7.5 × $500 = $3,750
├── ROI: $3,750 / $112.50 = 33x
```

---

## Modelos de Piloto

### Opción A: Piloto Pagado Limitado (RECOMENDADO)

```
Propuesta:
├── Duración: 30 días
├── Llamadas incluidas: 200
├── Costo: $150 USD
├── Sin compromiso posterior

Tu economía:
├── Costo real: ~$100 (200 × $0.50)
├── Ingreso: $150
├── Margen: $50 + aprendizaje

Script:
"Te propongo un piloto de 30 días con 200 llamadas incluidas.
El costo es $150 USD, que cubre la infraestructura y las llamadas.
Si recuperas más de lo que pagas, seguimos. Si no, sin compromiso."
```

### Opción B: Success-Based

```
Propuesta:
├── Sin costo fijo
├── 10% de lo recuperado gracias a PayCore
├── Tracking de resultados conjunto

Tu economía:
├── Riesgo: Si no recuperan, trabajas gratis
├── Upside: Si funciona, puedes ganar más

Script:
"No te cobro por adelantado. Te cobro el 10% de lo que recuperes
gracias a las llamadas de PayCore durante el piloto.
Si no recuperas nada, no me debes nada."
```

### Opción C: Híbrido

```
Propuesta:
├── Setup inicial: $100 (incluye 50 llamadas)
├── Llamadas adicionales: $0.75 cada una
├── Sin compromiso mínimo

Tu economía:
├── Cubres costos desde día 1
├── Escala con su uso

Script:
"El setup inicial es $100, que incluye la configuración de tu agente
de voz personalizado y las primeras 50 llamadas. Después, cada
llamada adicional son $0.75. Sin contratos, sin mínimos."
```

---

## Objeciones Comunes y Respuestas

### "Es muy caro"

> "Entiendo. ¿Puedo preguntarte cuánto les cuesta hoy cada deuda que pasa a incobrable?
> Si la deuda promedio es $500 y PayCore te ayuda a recuperar aunque sea una deuda
> adicional al mes, ya pagaste el servicio 4 veces."

### "No sé si funciona con nuestros clientes"

> "Es una duda válida. Por eso propongo empezar con un piloto pequeño.
> 200 llamadas, 30 días, $150. Si no funciona, pierdes $150.
> Si funciona, encontraste una solución que te ahorra miles al año."

### "Ya tenemos a alguien que llama"

> "Perfecto. ¿Cuántas llamadas puede hacer esa persona al día?
> PayCore puede hacer 100 llamadas simultáneas, 24/7, sin cansarse,
> con la misma calidad en la llamada 1 y en la 100.
> No reemplaza a tu persona, la complementa."

### "Necesito consultarlo"

> "Por supuesto. ¿Con quién lo consultas? ¿Te ayudaría si preparo
> un resumen de una página con los números para que lo compartan?"

### "Los clientes van a notar que es un robot"

> "Te entiendo, era mi preocupación también. Pero la tecnología de voz
> ha avanzado mucho. Te propongo algo: hagamos una llamada de prueba
> ahora mismo, y tú me dices si suena a robot o a persona."

---

## Materiales de Apoyo Necesarios

### Para la reunión de discovery
- [ ] Este documento impreso o en tablet
- [ ] Libreta para anotar respuestas
- [ ] Calculadora (o este doc abierto)

### Para la propuesta post-discovery
- [ ] One-pager con propuesta específica
- [ ] Demo de llamada grabada (ejemplo)
- [ ] Comparativa de costos personalizada

### Para el piloto
- [ ] Contrato simple (1 página)
- [ ] Acceso a dashboard de seguimiento
- [ ] Número de WhatsApp/email para soporte

---

## Checklist Pre-Reunión

- [ ] Investigar el concesionario (web, redes, reseñas)
- [ ] Saber qué marcas venden
- [ ] Entender si financian internamente o con banco
- [ ] Preparar 2-3 preguntas específicas sobre su negocio
- [ ] Tener este guión accesible pero no leerlo
- [ ] Llevar forma de anotar
- [ ] Tener demo lista por si la piden

---

## Después de la Reunión

### Inmediatamente (mismo día)
1. Enviar email de agradecimiento
2. Resumir lo que entendiste (confirmar)
3. Indicar próximos pasos

### En 24-48 horas
1. Preparar propuesta personalizada con SUS números
2. Crear one-pager específico
3. Enviar y agendar siguiente llamada

### Template email post-reunión

```
Asunto: Gracias por la conversación - PayCore

Hola [Nombre],

Gracias por tu tiempo hoy. Me quedó claro que:
- Tienen aproximadamente [X] clientes financiados
- La morosidad ronda el [Y]%
- Hoy [cómo lo manejan]
- El principal dolor es [lo que dijeron]

Basado en esto, estoy preparando una propuesta específica
para ustedes. Te la envío en los próximos días.

¿Tienes disponibilidad [fecha] para revisarla juntos?

Saludos,
[Tu nombre]
```

---

## Métricas de Éxito del Piloto

### Para el cliente
| Métrica | Cómo medir | Meta |
|---------|------------|------|
| Tasa de contacto | Llamadas contestadas / Total | >40% |
| Promesas de pago | Compromisos obtenidos / Contactos | >30% |
| Tasa de recuperación | Pagos recibidos / Promesas | >50% |
| Satisfacción | Encuesta post-llamada | >3.5/5 |

### Para PayCore (interno)
| Métrica | Cómo medir | Meta |
|---------|------------|------|
| Costo real por llamada | Total gastado / Llamadas | <$0.50 |
| Duración promedio | Minutos totales / Llamadas | <4 min |
| Margen bruto | (Ingreso - Costo) / Ingreso | >40% |
| NPS cliente | Encuesta al cliente | >7 |

---

*Documento creado: Enero 2026*
*Próxima revisión: Después de reunión discovery*
