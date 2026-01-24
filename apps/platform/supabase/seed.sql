-- =============================================================================
-- PayCore Seed Data
-- =============================================================================

-- Demo Company
INSERT INTO companies (id, name, tax_id, address, city, postal_code, country, phone, email, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'PayCore Demo',
  'B12345678',
  'Calle Demo 123',
  'Madrid',
  '28001',
  'Spain',
  '+34 900 000 000',
  'demo@paycore.io',
  '{"language": "es"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Sample Customers
INSERT INTO customers (id, company_id, name, email, phone, address, city, postal_code, country, tax_id) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'María García López', 'maria.garcia@email.com', '+34 612 345 678', 'Calle Gran Vía 45', 'Madrid', '28013', 'Spain', '12345678A'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Carlos Rodríguez Martín', 'carlos.rodriguez@email.com', '+34 623 456 789', 'Avenida Diagonal 200', 'Barcelona', '08018', 'Spain', '23456789B'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Ana Fernández Ruiz', 'ana.fernandez@email.com', '+34 634 567 890', 'Plaza Mayor 10', 'Valencia', '46002', 'Spain', '34567890C'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Pedro Sánchez Gómez', 'pedro.sanchez@email.com', '+34 645 678 901', 'Calle Sierpes 78', 'Sevilla', '41004', 'Spain', '45678901D'),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Laura Martínez Díaz', 'laura.martinez@email.com', '+34 656 789 012', 'Paseo de Gracia 100', 'Barcelona', '08008', 'Spain', '56789012E')
ON CONFLICT (id) DO NOTHING;

-- Sample Invoices
INSERT INTO invoices (id, company_id, customer_id, number, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, currency, notes, line_items) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'INV-2024-001', 'overdue', '2024-11-01', '2024-11-30', 1500.00, 21.00, 315.00, 1815.00, 'EUR', 'Servicios de consultoría', '[{"description": "Consultoría IT", "quantity": 1, "price": 1500}]'::jsonb),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'INV-2024-002', 'overdue', '2024-10-15', '2024-11-15', 2500.00, 21.00, 525.00, 3025.00, 'EUR', 'Desarrollo de software', '[{"description": "Desarrollo web", "quantity": 1, "price": 2500}]'::jsonb),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'INV-2024-003', 'sent', '2024-12-01', '2025-01-01', 800.00, 21.00, 168.00, 968.00, 'EUR', 'Mantenimiento mensual', '[{"description": "Mantenimiento", "quantity": 1, "price": 800}]'::jsonb),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'INV-2024-004', 'overdue', '2024-09-01', '2024-10-01', 3200.00, 21.00, 672.00, 3872.00, 'EUR', 'Proyecto web completo', '[{"description": "Proyecto web", "quantity": 1, "price": 3200}]'::jsonb),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', 'INV-2024-005', 'paid', '2024-12-15', '2025-01-15', 450.00, 21.00, 94.50, 544.50, 'EUR', 'Soporte técnico', '[{"description": "Soporte", "quantity": 1, "price": 450}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Sample Debt Cases
-- Status values (from DB enum): 'pending' | 'in_progress' | 'payment_plan' | 'escalated' | 'legal' | 'resolved' | 'written_off'
INSERT INTO debt_cases (id, company_id, customer_id, invoice_id, status, priority, total_debt, currency, days_overdue, notes) VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'pending', 'medium', 1815.00, 'EUR', 54, 'Cliente habitual, primer impago'),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021', 'in_progress', 'high', 3025.00, 'EUR', 69, 'Prometió pagar la semana que viene'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000023', 'escalated', 'critical', 3872.00, 'EUR', 114, 'Sin respuesta tras múltiples intentos')
ON CONFLICT (id) DO NOTHING;

-- Sample Voice Agent
INSERT INTO voice_agents (id, company_id, name, elevenlabs_agent_id, voice_id, language, system_prompt, first_message, settings, is_active) VALUES
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Agente Demo Español', NULL, 'EXAVITQu4vr4xnSDxMaL', 'es',
   'Eres un agente de cobros profesional y empático que representa a PayCore Demo. Tu objetivo es ayudar a los clientes a resolver sus facturas pendientes de manera amable y constructiva.',
   'Hola, le llamo de PayCore Demo. Estamos contactando con usted en relación a una factura pendiente. ¿Con quién tengo el gusto de hablar?',
   '{"maxCallDuration": 300, "temperature": 0.5, "stability": 0.7, "similarityBoost": 0.75, "enableTranscription": true, "enableRecording": true}'::jsonb,
   true
  )
ON CONFLICT (id) DO NOTHING;

-- Sample Voice Calls (history) with full transcriptions, summaries, and sentiment
-- Call 1: Successful - Promise to Pay (Carlos Rodríguez)
INSERT INTO voice_calls (
  id, company_id, voice_agent_id, customer_id, debt_case_id, phone_number,
  status, direction, duration, outcome, sentiment, started_at, ended_at,
  recording_url, summary, transcription
) VALUES (
  '00000000-0000-0000-0000-000000000050',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000031',
  '+34 623 456 789',
  'completed',
  'outbound',
  245,
  'promise_to_pay',
  'cooperative',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days' + INTERVAL '4 minutes 5 seconds',
  'https://storage.paycore.io/recordings/call-050-demo.mp3',
  'El cliente Carlos Rodríguez reconoce la deuda de 3.025€ correspondiente a la factura INV-2024-002 por servicios de desarrollo web. Explica que el retraso se debe a problemas de liquidez temporales en su empresa. Se compromete a realizar el pago completo el próximo viernes 31 de enero. El tono de la conversación fue cooperativo y el cliente mostró buena disposición.',
  '[Agente]: Hola, buenos días. Le llamo de PayCore Demo en relación a la factura INV-2024-002. ¿Hablo con Carlos Rodríguez?
[Cliente]: Sí, soy yo. Buenos días.
[Agente]: Perfecto, señor Rodríguez. Le contactamos porque tenemos registrada una factura pendiente de pago por importe de 3.025 euros, correspondiente a servicios de desarrollo web. La fecha de vencimiento era el 15 de noviembre. ¿Tiene conocimiento de esta factura?
[Cliente]: Sí, sí, la tengo pendiente. Mire, hemos tenido algunos problemas de liquidez estos meses con unos clientes que nos han pagado tarde a nosotros.
[Agente]: Entiendo perfectamente, señor Rodríguez. Estas situaciones pueden ser complicadas. ¿Tiene previsto cuándo podría regularizar este pago?
[Cliente]: Pues mire, esta semana ya me han confirmado que me pagan un proyecto grande. Podría hacer la transferencia el viernes que viene sin problema.
[Agente]: Perfecto, entonces anotamos el compromiso de pago para el viernes 31 de enero por el importe total de 3.025 euros. ¿Le parece correcto?
[Cliente]: Sí, correcto. Les haré la transferencia ese día por la mañana.
[Agente]: Excelente. Le enviaré un recordatorio por email con los datos bancarios. ¿La dirección carlos.rodriguez@email.com sigue siendo correcta?
[Cliente]: Sí, esa misma.
[Agente]: Perfecto. Muchas gracias por su tiempo y colaboración, señor Rodríguez. Que tenga un buen día.
[Cliente]: Igualmente, gracias.'
) ON CONFLICT (id) DO NOTHING;

-- Call 2: No Answer (Pedro Sánchez)
INSERT INTO voice_calls (
  id, company_id, voice_agent_id, customer_id, debt_case_id, phone_number,
  status, direction, duration, outcome, sentiment, started_at, ended_at,
  recording_url, summary, transcription
) VALUES (
  '00000000-0000-0000-0000-000000000051',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000032',
  '+34 645 678 901',
  'no_answer',
  'outbound',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '1 day',
  NULL,
  NULL,
  'Llamada sin respuesta. El teléfono sonó hasta saltar el buzón de voz. No se dejó mensaje. Este es el tercer intento de contacto sin éxito.',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Call 3: Callback Requested (María García)
INSERT INTO voice_calls (
  id, company_id, voice_agent_id, customer_id, debt_case_id, phone_number,
  status, direction, duration, outcome, sentiment, started_at, ended_at,
  recording_url, summary, transcription
) VALUES (
  '00000000-0000-0000-0000-000000000052',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000030',
  '+34 612 345 678',
  'completed',
  'outbound',
  180,
  'callback_requested',
  'neutral',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours' + INTERVAL '3 minutes',
  'https://storage.paycore.io/recordings/call-052-demo.mp3',
  'La cliente María García atendió la llamada pero indicó que no era buen momento para hablar ya que estaba en una reunión de trabajo. Solicitó que la llamáramos mañana por la tarde, después de las 17:00. Mostró una actitud neutral, ni hostil ni especialmente colaborativa.',
  '[Agente]: Buenos días, ¿hablo con María García López?
[Cliente]: Sí, soy yo, pero ahora mismo no puedo hablar, estoy en medio de una reunión.
[Agente]: Entiendo, disculpe la interrupción. Le llamo de PayCore Demo respecto a una factura pendiente. ¿Cuándo sería un buen momento para volver a contactarla?
[Cliente]: Mire, mañana por la tarde estaré más tranquila. ¿Pueden llamarme después de las cinco?
[Agente]: Por supuesto, agendamos la llamada para mañana después de las 17:00. ¿Este mismo número está bien?
[Cliente]: Sí, este mismo. Ahora tengo que colgar.
[Agente]: Perfecto, mañana la contactamos. Que tenga buen día.
[Cliente]: Adiós.'
) ON CONFLICT (id) DO NOTHING;

-- Call 4: Payment Plan Agreed (Ana Fernández) - Older call
INSERT INTO voice_calls (
  id, company_id, voice_agent_id, customer_id, debt_case_id, phone_number,
  status, direction, duration, outcome, sentiment, started_at, ended_at,
  recording_url, summary, transcription
) VALUES (
  '00000000-0000-0000-0000-000000000053',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000012',
  NULL,
  '+34 634 567 890',
  'completed',
  'outbound',
  420,
  'payment_plan_agreed',
  'cooperative',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days' + INTERVAL '7 minutes',
  'https://storage.paycore.io/recordings/call-053-demo.mp3',
  'La cliente Ana Fernández expresó dificultades económicas para pagar la totalidad de la factura de 968€. Tras negociación, se acordó un plan de pagos en 3 cuotas mensuales de 322,67€ cada una. Primera cuota el 1 de febrero, segunda el 1 de marzo, y tercera el 1 de abril. Cliente mostró agradecimiento por la flexibilidad ofrecida.',
  '[Agente]: Buenos días, ¿hablo con Ana Fernández Ruiz?
[Cliente]: Sí, soy yo.
[Agente]: Buenos días, señora Fernández. Le llamo de PayCore Demo en relación a la factura INV-2024-003 por importe de 968 euros, correspondiente a servicios de mantenimiento. El vencimiento era el 1 de enero.
[Cliente]: Sí, mire, soy consciente de que la tengo pendiente. El problema es que ahora mismo no puedo hacer frente al pago completo. He tenido gastos imprevistos y la situación está complicada.
[Agente]: Entiendo su situación, señora Fernández. ¿Podría indicarme qué cantidad podría abonar mensualmente? Podemos estudiar la posibilidad de fraccionar el pago.
[Cliente]: Pues si pudiera pagarlo en tres veces, unos 320 euros al mes, sí que podría asumirlo.
[Agente]: Perfecto. Podemos establecer un plan de tres pagos de 322,67 euros cada uno. ¿Le vendría bien empezar el 1 de febrero?
[Cliente]: Sí, eso me viene bien. El uno de cada mes puedo hacerlo.
[Agente]: Entonces quedaría así: 322,67€ el 1 de febrero, 322,67€ el 1 de marzo, y 322,67€ el 1 de abril. ¿Está de acuerdo?
[Cliente]: Sí, perfecto. Muchas gracias por la facilidad.
[Agente]: No hay de qué. Le enviaremos la confirmación del plan por email junto con las instrucciones de pago. ¿Alguna pregunta?
[Cliente]: No, todo claro. Muchas gracias.
[Agente]: Gracias a usted. Que tenga buen día.'
) ON CONFLICT (id) DO NOTHING;

-- Call 5: Dispute (call from a week ago)
INSERT INTO voice_calls (
  id, company_id, voice_agent_id, customer_id, debt_case_id, phone_number,
  status, direction, duration, outcome, sentiment, started_at, ended_at,
  recording_url, summary, transcription
) VALUES (
  '00000000-0000-0000-0000-000000000054',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000032',
  '+34 645 678 901',
  'completed',
  'outbound',
  310,
  'dispute',
  'frustrated',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days' + INTERVAL '5 minutes 10 seconds',
  'https://storage.paycore.io/recordings/call-054-demo.mp3',
  'El cliente Pedro Sánchez mostró frustración y disputó la factura INV-2024-004 de 3.872€. Alega que el proyecto web no se completó según lo acordado y que faltan funcionalidades críticas. Solicita una revisión del trabajo antes de proceder al pago. Se ha escalado el caso al departamento comercial para revisión. Sentimiento negativo durante la llamada.',
  '[Agente]: Buenos días, ¿hablo con Pedro Sánchez Gómez?
[Cliente]: Sí, ¿qué desea?
[Agente]: Buenos días, señor Sánchez. Le llamo de PayCore Demo respecto a la factura INV-2024-004 por importe de 3.872 euros. Llevamos varios intentos de contacto...
[Cliente]: Mire, ya sé por qué llaman. Y no voy a pagar esa factura.
[Agente]: Entiendo. ¿Podría indicarme el motivo? Quizás podamos ayudarle a resolver cualquier incidencia.
[Cliente]: El motivo es que el trabajo no está terminado. Me prometieron una web completa con tienda online y sistema de reservas, y lo que me entregaron no funciona bien. El carrito de compra da errores constantemente.
[Agente]: Lamento escuchar eso, señor Sánchez. Entiendo su frustración. ¿Ha contactado con nuestro departamento técnico para reportar estos problemas?
[Cliente]: Sí, hace dos meses, y me dijeron que lo arreglarían, pero aquí sigo esperando. No pienso pagar por algo que no funciona.
[Agente]: Comprendo perfectamente su posición. Voy a escalar este caso a nuestro departamento comercial para que revisen la situación y se pongan en contacto con usted para resolver las incidencias técnicas. ¿Le parece bien?
[Cliente]: Sí, pero que sea pronto porque llevo meses así.
[Agente]: Por supuesto. En las próximas 48 horas recibirá una llamada de nuestro equipo comercial. ¿Este número de teléfono es el mejor para contactarle?
[Cliente]: Sí, este mismo.
[Agente]: Perfecto. Disculpe las molestias ocasionadas y gracias por su paciencia.'
) ON CONFLICT (id) DO NOTHING;

-- Call 6: Voicemail left
INSERT INTO voice_calls (
  id, company_id, voice_agent_id, customer_id, debt_case_id, phone_number,
  status, direction, duration, outcome, sentiment, started_at, ended_at,
  recording_url, summary, transcription
) VALUES (
  '00000000-0000-0000-0000-000000000055',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000014',
  NULL,
  '+34 656 789 012',
  'voicemail',
  'outbound',
  45,
  NULL,
  NULL,
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days' + INTERVAL '45 seconds',
  'https://storage.paycore.io/recordings/call-055-demo.mp3',
  'Llamada derivada a buzón de voz. Se dejó mensaje solicitando que la cliente Laura Martínez devuelva la llamada al número de atención al cliente para tratar el estado de su cuenta.',
  '[Agente]: Buenos días, este es un mensaje para Laura Martínez Díaz. Le llamamos de PayCore Demo en relación a su cuenta de cliente. Por favor, devuelva la llamada al 900 000 000 en horario de oficina para poder atenderle. Muchas gracias.'
) ON CONFLICT (id) DO NOTHING;

-- Call 7: Recent call - In Progress simulation (for testing)
INSERT INTO voice_calls (
  id, company_id, voice_agent_id, customer_id, debt_case_id, phone_number,
  status, direction, duration, outcome, sentiment, started_at, ended_at,
  recording_url, summary, transcription
) VALUES (
  '00000000-0000-0000-0000-000000000056',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000030',
  '+34 612 345 678',
  'completed',
  'outbound',
  195,
  'promise_to_pay',
  'positive',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '27 minutes',
  'https://storage.paycore.io/recordings/call-056-demo.mp3',
  'Llamada de seguimiento con María García tras su solicitud de callback. La cliente confirmó que puede realizar el pago de 1.815€ correspondiente a la factura INV-2024-001 el próximo lunes. Actitud muy positiva y agradecida por la flexibilidad mostrada.',
  '[Agente]: Buenas tardes, ¿hablo con María García López?
[Cliente]: Sí, soy yo. Ah, son ustedes, ya me habían dicho que llamarían.
[Agente]: Exacto, señora García. Como acordamos, la contactamos para hablar sobre la factura INV-2024-001 de 1.815 euros.
[Cliente]: Sí, mire, he estado revisando mis cuentas y puedo hacer el pago el lunes sin problema.
[Agente]: Perfecto, eso es una excelente noticia. Entonces registramos el compromiso de pago para el lunes por el importe total.
[Cliente]: Sí, el lunes a primera hora les hago la transferencia. Ya tengo sus datos bancarios del email que me mandaron.
[Agente]: Estupendo. ¿Necesita que le reenvíe la información?
[Cliente]: No, no, lo tengo todo guardado. Disculpen el retraso, este mes ha sido complicado.
[Agente]: No se preocupe, lo importante es que lo resolvemos. Muchas gracias por su colaboración, señora García.
[Cliente]: Gracias a ustedes por la paciencia. Hasta luego.
[Agente]: Hasta luego, que tenga buena tarde.'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Create auth user for demo
-- Email: admin@paycore.io / Password: demo123456
-- =============================================================================

DO $$
DECLARE
  demo_user_id uuid := '00000000-0000-0000-0000-000000000002';
BEGIN
  -- Insert into auth.users with all required columns
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    -- Token columns must be empty strings, not NULL
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change,
    phone,
    phone_change,
    phone_change_token,
    reauthentication_token,
    is_sso_user,
    is_anonymous
  )
  VALUES (
    demo_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@paycore.io',
    crypt('demo123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Admin Demo"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    -- Empty strings for token columns
    '',
    '',
    '',
    '',
    '',
    NULL,
    '',
    '',
    '',
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert identity
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at
  )
  VALUES (
    demo_user_id,
    demo_user_id,
    jsonb_build_object('sub', demo_user_id::text, 'email', 'admin@paycore.io'),
    'email',
    demo_user_id::text,
    NOW(),
    NOW()
  )
  ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Insert into public.users
  INSERT INTO users (id, company_id, email, full_name, role, is_active)
  VALUES (
    demo_user_id,
    '00000000-0000-0000-0000-000000000001',
    'admin@paycore.io',
    'Admin Demo',
    'admin',
    true
  )
  ON CONFLICT (id) DO NOTHING;
END $$;
