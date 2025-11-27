-- Demo/Seed Data for Testing
-- Flexoraa Backend - Phase 1
-- Version: 1.0.0

-- Insert demo tenant
INSERT INTO users (id, email, role, tenant_id, status, api_key_hash) VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@flexoraa.com', 'admin', '00000000-0000-0000-0000-000000000001', 'active', '$2b$10$demo.api.key.hash'),
  ('00000000-0000-0000-0000-000000000002', 'sdr1@flexoraa.com', 'sdr', '00000000-0000-0000-0000-000000000001', 'active', NULL),
  ('00000000-0000-0000-0000-000000000003', 'sdr2@flexoraa.com', 'sdr', '00000000-0000-0000-0000-000000000001', 'active', NULL);

-- Insert demo campaigns
INSERT INTO campaigns (id, user_id, tenant_id, name, description, status, initial_prompt, whatsapp_template_name, whatsapp_template_language) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
   'Research Analyst Services', 
   'Turn insights into income! Discover how our research analysts convert data into profit and give you a competitive edge.',
   'active',
   'You are a marketing agent for a Research Analyst company. Create engaging messages that attract customers.',
   'offer_for_manual',
   'de'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
   'Product Launch Campaign', 
   'New product launch with special offers for early adopters.',
   'draft',
   'You are a marketing agent for a new product launch. Create excitement and urgency.',
   'offer_for_manual',
   'de');

-- Insert demo leads
INSERT INTO leads (id, user_id, campaign_id, tenant_id, phone_number, name, status, lead_score, lead_score_ai, lead_temperature, phone_verified, consent_status) VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 
   '00000000-0000-0000-0000-000000000001', '+918927665759', 'Demo Lead 1', 'contacted', 75, 82, 'HOT', TRUE, 'opted_in'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 
   '00000000-0000-0000-0000-000000000001', '+916295707839', 'Demo Lead 2', 'qualified', 65, 70, 'WARM', FALSE, 'opted_in'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 
   '00000000-0000-0000-0000-000000000001', '+916290624068', 'Demo Lead 3', 'new', 45, 50, 'COLD', FALSE, 'pending');

-- Insert demo consent records (append-only)
INSERT INTO consent_log (tenant_id, phone_number, email, consent_type, consent_status, consent_method, ip_address) VALUES
  ('00000000-0000-0000-0000-000000000001', '+918927665759', 'lead1@example.com', 'whatsapp_optin', 'granted', 'webhook', '192.168.1.100'),
  ('00000000-0000-0000-0000-000000000001', '+916295707839', 'lead2@example.com', 'whatsapp_optin', 'granted', 'api', '192.168.1.101');

-- Insert demo chat history
INSERT INTO chat_memory (tenant_id, session_id, role, content, token_count) VALUES
  ('00000000-0000-0000-0000-000000000001', '+918927665759', 'user', 'Hi, tell me about your research services', 15),
  ('00000000-0000-0000-0000-000000000001', '+918927665759', 'assistant', 'Hello! I''d be happy to help you learn about our research analyst services. We specialize in converting data into actionable insights that drive profit and competitive advantage. What specific area interests you?', 45),
  ('00000000-0000-0000-0000-000000000001', '+918927665759', 'user', 'Pricing information?', 5),
  ('00000000-0000-0000-0000-000000000001', '+918927665759', 'assistant', 'Our pricing is customized based on your specific needs. We offer flexible packages starting from basic analysis to comprehensive strategic insights. Would you like to schedule a quick call to discuss your requirements?', 42);

-- Insert demo assignment queue
INSERT INTO assignment_queue (tenant_id, lead_id, campaign_id, status, priority, assigned_to) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000011', 'assigned', 10, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000012', 'pending', 5, NULL);

-- Insert demo webhook records
INSERT INTO webhook_raw (tenant_id, source, request_id, signature_verified, headers, body, processed) VALUES
  ('00000000-0000-0000-0000-000000000001', 'whatsapp', 'demo-request-001', TRUE, 
   '{"x-request-id": "demo-request-001", "x-hub-signature": "sha256=demo"}'::jsonb,
   '{"messages": [{"from": "+918927665759", "text": {"body": "Hello"}}]}'::jsonb,
   TRUE),
  ('00000000-0000-0000-0000-000000000001', 'klicktipp', 'demo-request-002', TRUE, 
   '{"x-request-id": "demo-request-002"}'::jsonb,
   '{"PhoneNumber": "00918927665759", "CustomFieldFirstName": "Demo"}'::jsonb,
   TRUE);

-- Set actor for audit trail testing
SET SESSION app.current_user_id = '00000000-0000-0000-0000-000000000001';
SET SESSION app.current_actor_type = 'system';

COMMIT;

-- Display summary
DO $$
BEGIN
  RAISE NOTICE '✅ Demo data seeded successfully!';
  RAISE NOTICE '   - 3 users (1 admin, 2 SDRs)';
  RAISE NOTICE '   - 2 campaigns';
  RAISE NOTICE '   - 3 leads';
  RAISE NOTICE '   - 2 consent records';
  RAISE NOTICE '   - 4 chat messages';
  RAISE NOTICE '   - 2 assignment queue items';
  RAISE NOTICE '   - 2 webhook records';
END$$;
