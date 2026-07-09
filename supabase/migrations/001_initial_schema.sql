-- AgendaPsy — Migration initiale
-- Exécuter dans Supabase SQL Editor

-- PROFILES (thérapeutes)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  bio TEXT,
  specialty TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trialing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_own_profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- SERVICE ROLE peut lire tous les profils (pour le booking public)
CREATE POLICY "public_read_profile" ON public.profiles
  FOR SELECT USING (true);

-- SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_min INT NOT NULL DEFAULT 50,
  price_usd DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.services TO service_role;
GRANT SELECT ON TABLE public.services TO anon;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_own_services" ON public.services
  FOR ALL USING (auth.uid() = therapist_id);

CREATE POLICY "public_read_services" ON public.services
  FOR SELECT USING (is_active = TRUE);

-- AVAILABILITY_RULES
CREATE TABLE IF NOT EXISTS public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_duration_min INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.availability_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.availability_rules TO service_role;
GRANT SELECT ON TABLE public.availability_rules TO anon;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_own_availability" ON public.availability_rules
  FOR ALL USING (auth.uid() = therapist_id);

CREATE POLICY "public_read_availability" ON public.availability_rules
  FOR SELECT USING (true);

-- PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'waitlist')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_own_patients" ON public.patients
  FOR ALL USING (auth.uid() = therapist_id);

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_whatsapp TEXT,
  service_name TEXT NOT NULL,
  price_usd DECIMAL(10,2),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no_show', 'completed')),
  notes TEXT,
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_1h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_therapist_starts ON public.appointments(therapist_id, starts_at);
CREATE INDEX idx_appointments_reminders ON public.appointments(starts_at, reminder_24h_sent, reminder_1h_sent)
  WHERE status = 'confirmed';

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_own_appointments" ON public.appointments
  FOR ALL USING (auth.uid() = therapist_id);

-- SESSION_NOTES
CREATE TABLE IF NOT EXISTS public.session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES public.profiles(id),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.session_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.session_notes TO service_role;
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_own_notes" ON public.session_notes
  FOR ALL USING (auth.uid() = therapist_id);

-- Fonction auto-create profile à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, slug, full_name, email)
  VALUES (
    NEW.id,
    lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g')) || '-' || substr(NEW.id::text, 1, 6),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
