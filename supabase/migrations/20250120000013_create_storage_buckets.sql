-- =====================================================
-- FLEXORAA STORAGE BUCKETS MIGRATION
-- =====================================================
-- Description: Creates storage buckets and policies
-- Created: 2025-01-20
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for company-logos bucket
DROP POLICY IF EXISTS "Company logos are publicly accessible" ON storage.objects;
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Users can upload company logos" ON storage.objects;
CREATE POLICY "Users can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update company logos" ON storage.objects;
CREATE POLICY "Users can update company logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete company logos" ON storage.objects;
CREATE POLICY "Users can delete company logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for invoices bucket
DROP POLICY IF EXISTS "Users can view own invoices" ON storage.objects;
CREATE POLICY "Users can view own invoices"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload own invoices" ON storage.objects;
CREATE POLICY "Users can upload own invoices"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for documents bucket
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verify the setup
SELECT 'Storage buckets and policies setup completed successfully' as status;
