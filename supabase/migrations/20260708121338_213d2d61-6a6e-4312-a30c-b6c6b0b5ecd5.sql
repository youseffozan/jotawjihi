
-- 1. Subjects status: three-state control (available / locked / coming_soon)
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'coming_soon'
    CHECK (status IN ('available','locked','coming_soon'));

-- Backfill: subjects flagged available stay available; hardcoded set from app becomes available.
UPDATE public.subjects
   SET status = 'available'
 WHERE is_available = true
    OR id IN ('bus-eng','eng-math','lang-eng','med-eng','st-math');

-- 2. Announcements table (global banners)
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info','success','warning','danger')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements public read"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "announcements admin write"
  ON public.announcements FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Site settings (key/value store for banners, branding, contact info)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings public read"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "site_settings admin write"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('branding', '{"site_name_ar":"جو توجيهي","site_name_en":"Jo Tawjihi","tagline_ar":"منصّة امتحانات التوجيهي","contact_email":"","contact_phone":"","whatsapp":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Allow admins to delete user_attempts (needed for progress reset)
CREATE POLICY "attempts admin delete"
  ON public.user_attempts FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));
