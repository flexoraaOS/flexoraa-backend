-- =====================================================
-- FLEXORAA INITIAL SETUP MIGRATION
-- =====================================================
-- Description: Creates the handle_updated_at function and base schema
-- Created: 2025-01-20
-- =====================================================

-- ============================================================
-- STEP 1: Create Updated_at Handler Function
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the setup
SELECT 'Initial setup function created successfully' as status;
