-- =============================================================================
-- NETRISE · ESQUEMA MVP OPTIMIZADO
-- Supabase / PostgreSQL
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) EXTENSIONES
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- -----------------------------------------------------------------------------
-- 1) FUNCIONES UTILITARIAS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fuente de verdad: organization_members
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT om.organization_id
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
  ORDER BY om.joined_at ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_org(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner_or_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.member_role IN ('owner', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_participant_in_conversation(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conv_id
      AND cp.user_id = auth.uid()
  )
$$;

-- -----------------------------------------------------------------------------
-- 2) ENUMS
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_role') THEN
    CREATE TYPE public.profile_role AS ENUM ('agency', 'freelancer', 'closer');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_member_role') THEN
    CREATE TYPE public.organization_member_role AS ENUM ('owner', 'admin', 'manager', 'member');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE public.lead_status AS ENUM (
      'generated',
      'pending_contact',
      'contacted',
      'meeting_scheduled',
      'meeting_done',
      'closed',
      'lost'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_status') THEN
    CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_offer_type') THEN
    CREATE TYPE public.job_offer_type AS ENUM ('freelancer', 'closer', 'both');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_offer_status') THEN
    CREATE TYPE public.job_offer_status AS ENUM ('draft', 'active', 'closed', 'archived');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_recurrence') THEN
    CREATE TYPE public.slot_recurrence AS ENUM ('once', 'daily', 'weekly');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
    CREATE TYPE public.message_type AS ENUM ('text', 'system', 'file');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3) NÚCLEO
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.profile_role NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL, -- compatibilidad temporal
  display_name TEXT,
  email CITEXT,
  avatar_url TEXT,
  last_seen_at TIMESTAMPTZ,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- compatibilidad frontend
  field_order JSONB NOT NULL DEFAULT '[]'::jsonb, -- compatibilidad frontend
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role public.organization_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_role ON public.organization_members(organization_id, member_role);

-- -----------------------------------------------------------------------------
-- 4) TAXONOMÍAS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.languages_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.cities_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT,
  UNIQUE(name, country)
);

CREATE TABLE IF NOT EXISTS public.profile_services (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, service_id)
);

CREATE TABLE IF NOT EXISTS public.profile_niches (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  niche_id UUID NOT NULL REFERENCES public.niches(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, niche_id)
);

CREATE TABLE IF NOT EXISTS public.profile_languages (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES public.languages_catalog(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, language_id)
);

CREATE TABLE IF NOT EXISTS public.profile_industries (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, industry_id)
);

CREATE TABLE IF NOT EXISTS public.profile_cities (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities_catalog(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, city_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_services_service ON public.profile_services(service_id);
CREATE INDEX IF NOT EXISTS idx_profile_niches_niche ON public.profile_niches(niche_id);
CREATE INDEX IF NOT EXISTS idx_profile_languages_language ON public.profile_languages(language_id);
CREATE INDEX IF NOT EXISTS idx_profile_industries_industry ON public.profile_industries(industry_id);
CREATE INDEX IF NOT EXISTS idx_profile_cities_city ON public.profile_cities(city_id);

-- -----------------------------------------------------------------------------
-- 5) CRM / VENTAS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.lead_status NOT NULL DEFAULT 'pending_contact',
  source TEXT,
  company_name TEXT,
  contact_name TEXT,
  contact_email CITEXT,
  contact_phone TEXT,
  website_url TEXT,
  industry_id UUID REFERENCES public.industries(id) ON DELETE SET NULL,
  score SMALLINT CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  happened_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (happened_at IS NULL OR happened_at >= scheduled_at)
);

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (char_length(currency) = 3),
  CONSTRAINT deals_lead_org_fk
    FOREIGN KEY (lead_id, organization_id)
    REFERENCES public.leads(id, organization_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status public.commission_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (status = 'pending' AND approved_at IS NULL AND paid_at IS NULL)
    OR (status = 'approved' AND approved_at IS NOT NULL)
    OR (status = 'paid' AND paid_at IS NOT NULL)
    OR (status = 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_leads_org_status ON public.leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_org_status_created ON public.leads(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_lead ON public.meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON public.meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_deals_org_closed ON public.deals(organization_id, closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_closed_by ON public.deals(closed_by);
CREATE INDEX IF NOT EXISTS idx_commissions_org_status ON public.commissions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_to_user ON public.commissions(to_user_id);

-- -----------------------------------------------------------------------------
-- 6) COLABORACIÓN / PROYECTOS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.agency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contacted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_email CITEXT,
  contacted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  has_close BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    contacted_user_id IS NOT NULL
    OR contact_name IS NOT NULL
    OR contact_email IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.freelancer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  percent_completed SMALLINT NOT NULL DEFAULT 0 CHECK (percent_completed BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_contacts_org ON public.agency_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_contacts_by ON public.agency_contacts(contact_by);
CREATE INDEX IF NOT EXISTS idx_agency_contacts_contacted_user ON public.agency_contacts(contacted_user_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_projects_org ON public.freelancer_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_projects_freelancer ON public.freelancer_projects(freelancer_id);

-- -----------------------------------------------------------------------------
-- 7) TRABAJOS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  offer_type public.job_offer_type NOT NULL,
  status public.job_offer_status NOT NULL DEFAULT 'draft',
  location_remote BOOLEAN NOT NULL DEFAULT true,
  budget_min NUMERIC(12,2) CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max NUMERIC(12,2) CHECK (budget_max IS NULL OR budget_max >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min),
  CHECK (char_length(currency) = 3)
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_offer_id UUID NOT NULL REFERENCES public.job_offers(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  proposed_rate NUMERIC(12,2) CHECK (proposed_rate IS NULL OR proposed_rate >= 0),
  currency CHAR(3),
  status public.application_status NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_offer_id, applicant_id),
  CHECK (currency IS NULL OR char_length(currency) = 3)
);

CREATE INDEX IF NOT EXISTS idx_job_offers_org_status ON public.job_offers(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_job_offers_active ON public.job_offers(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_offer_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_status_created
  ON public.job_applications(job_offer_id, status, created_at DESC);

-- -----------------------------------------------------------------------------
-- 8) PERFIL SOCIAL / REPUTACIÓN
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  about_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_name TEXT,
  from_role public.profile_role,
  content TEXT NOT NULL,
  rating SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_user_id IS NULL OR from_user_id <> about_user_id)
);

CREATE INDEX IF NOT EXISTS idx_testimonials_about_public ON public.testimonials(about_user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_testimonials_about_created ON public.testimonials(about_user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 9) MENSAJERÍA
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type public.message_type NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON public.messages(sender_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 10) EXTRAS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email CITEXT,
  role public.profile_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (role IN ('freelancer', 'closer'))
);

CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  recurrence public.slot_recurrence,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES public.availability_slots(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at),
  CHECK (owner_id <> booker_id)
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_org_email ON public.invitations(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON public.invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_availability_slots_user_start ON public.availability_slots(user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_start ON public.bookings(owner_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_booker_start ON public.bookings(booker_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status_owner_start ON public.bookings(status, owner_id, start_at DESC);

-- -----------------------------------------------------------------------------
-- 11) TRIGGERS updated_at
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_meetings_updated_at ON public.meetings;
CREATE TRIGGER trg_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_commissions_updated_at ON public.commissions;
CREATE TRIGGER trg_commissions_updated_at
BEFORE UPDATE ON public.commissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_freelancer_projects_updated_at ON public.freelancer_projects;
CREATE TRIGGER trg_freelancer_projects_updated_at
BEFORE UPDATE ON public.freelancer_projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_job_offers_updated_at ON public.job_offers;
CREATE TRIGGER trg_job_offers_updated_at
BEFORE UPDATE ON public.job_offers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER trg_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER trg_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_availability_slots_updated_at ON public.availability_slots;
CREATE TRIGGER trg_availability_slots_updated_at
BEFORE UPDATE ON public.availability_slots
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 12) RLS
-- -----------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 13) DROP POLICIES PARA IDEMPOTENCIA
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

DROP POLICY IF EXISTS "organizations_select_members" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_admin" ON public.organizations;

DROP POLICY IF EXISTS "organization_members_select_same_org" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_insert_admin" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_update_admin" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_delete_admin" ON public.organization_members;

DROP POLICY IF EXISTS "taxonomy_read_authenticated_services" ON public.services;
DROP POLICY IF EXISTS "taxonomy_read_authenticated_niches" ON public.niches;
DROP POLICY IF EXISTS "taxonomy_read_authenticated_languages" ON public.languages_catalog;
DROP POLICY IF EXISTS "taxonomy_read_authenticated_industries" ON public.industries;
DROP POLICY IF EXISTS "taxonomy_read_authenticated_cities" ON public.cities_catalog;

DROP POLICY IF EXISTS "profile_services_select" ON public.profile_services;
DROP POLICY IF EXISTS "profile_services_write_own" ON public.profile_services;
DROP POLICY IF EXISTS "profile_niches_select" ON public.profile_niches;
DROP POLICY IF EXISTS "profile_niches_write_own" ON public.profile_niches;
DROP POLICY IF EXISTS "profile_languages_select" ON public.profile_languages;
DROP POLICY IF EXISTS "profile_languages_write_own" ON public.profile_languages;
DROP POLICY IF EXISTS "profile_industries_select" ON public.profile_industries;
DROP POLICY IF EXISTS "profile_industries_write_own" ON public.profile_industries;
DROP POLICY IF EXISTS "profile_cities_select" ON public.profile_cities;
DROP POLICY IF EXISTS "profile_cities_write_own" ON public.profile_cities;

DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;

DROP POLICY IF EXISTS "meetings_select" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update" ON public.meetings;
DROP POLICY IF EXISTS "meetings_delete" ON public.meetings;

DROP POLICY IF EXISTS "deals_select" ON public.deals;
DROP POLICY IF EXISTS "deals_insert" ON public.deals;
DROP POLICY IF EXISTS "deals_update" ON public.deals;
DROP POLICY IF EXISTS "deals_delete" ON public.deals;

DROP POLICY IF EXISTS "commissions_select" ON public.commissions;
DROP POLICY IF EXISTS "commissions_insert" ON public.commissions;
DROP POLICY IF EXISTS "commissions_update" ON public.commissions;
DROP POLICY IF EXISTS "commissions_delete" ON public.commissions;

DROP POLICY IF EXISTS "agency_contacts_select" ON public.agency_contacts;
DROP POLICY IF EXISTS "agency_contacts_insert" ON public.agency_contacts;
DROP POLICY IF EXISTS "agency_contacts_update" ON public.agency_contacts;
DROP POLICY IF EXISTS "agency_contacts_delete" ON public.agency_contacts;

DROP POLICY IF EXISTS "freelancer_projects_select" ON public.freelancer_projects;
DROP POLICY IF EXISTS "freelancer_projects_insert" ON public.freelancer_projects;
DROP POLICY IF EXISTS "freelancer_projects_update" ON public.freelancer_projects;
DROP POLICY IF EXISTS "freelancer_projects_delete" ON public.freelancer_projects;

DROP POLICY IF EXISTS "job_offers_select" ON public.job_offers;
DROP POLICY IF EXISTS "job_offers_insert" ON public.job_offers;
DROP POLICY IF EXISTS "job_offers_update" ON public.job_offers;
DROP POLICY IF EXISTS "job_offers_delete" ON public.job_offers;

DROP POLICY IF EXISTS "job_applications_select" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_insert" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_update" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_delete" ON public.job_applications;

DROP POLICY IF EXISTS "testimonials_select" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_insert" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_update" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_delete" ON public.testimonials;

DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;

DROP POLICY IF EXISTS "conversation_participants_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete" ON public.conversation_participants;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

DROP POLICY IF EXISTS "invitations_select" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update" ON public.invitations;
DROP POLICY IF EXISTS "invitations_delete" ON public.invitations;

DROP POLICY IF EXISTS "availability_slots_select" ON public.availability_slots;
DROP POLICY IF EXISTS "availability_slots_insert" ON public.availability_slots;
DROP POLICY IF EXISTS "availability_slots_update" ON public.availability_slots;
DROP POLICY IF EXISTS "availability_slots_delete" ON public.availability_slots;

DROP POLICY IF EXISTS "bookings_select" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update" ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete" ON public.bookings;

-- -----------------------------------------------------------------------------
-- 14) POLICIES
-- -----------------------------------------------------------------------------

-- Profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Organizations
CREATE POLICY "organizations_select_members" ON public.organizations
  FOR SELECT USING (public.is_member_of_org(id));

CREATE POLICY "organizations_update_admin" ON public.organizations
  FOR UPDATE USING (public.is_org_owner_or_admin(id))
  WITH CHECK (public.is_org_owner_or_admin(id));

-- Organization members
CREATE POLICY "organization_members_select_same_org" ON public.organization_members
  FOR SELECT USING (
    public.is_member_of_org(organization_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "organization_members_insert_admin" ON public.organization_members
  FOR INSERT WITH CHECK (public.is_org_owner_or_admin(organization_id));

CREATE POLICY "organization_members_update_admin" ON public.organization_members
  FOR UPDATE USING (public.is_org_owner_or_admin(organization_id))
  WITH CHECK (public.is_org_owner_or_admin(organization_id));

CREATE POLICY "organization_members_delete_admin" ON public.organization_members
  FOR DELETE USING (public.is_org_owner_or_admin(organization_id));

-- Taxonomy catalogs
CREATE POLICY "taxonomy_read_authenticated_services" ON public.services
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "taxonomy_read_authenticated_niches" ON public.niches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "taxonomy_read_authenticated_languages" ON public.languages_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "taxonomy_read_authenticated_industries" ON public.industries
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "taxonomy_read_authenticated_cities" ON public.cities_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Profile taxonomy bridges
CREATE POLICY "profile_services_select" ON public.profile_services
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profile_services_write_own" ON public.profile_services
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "profile_niches_select" ON public.profile_niches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profile_niches_write_own" ON public.profile_niches
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "profile_languages_select" ON public.profile_languages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profile_languages_write_own" ON public.profile_languages
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "profile_industries_select" ON public.profile_industries
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profile_industries_write_own" ON public.profile_industries
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "profile_cities_select" ON public.profile_cities
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profile_cities_write_own" ON public.profile_cities
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Leads
CREATE POLICY "leads_select" ON public.leads
  FOR SELECT USING (
    public.is_member_of_org(organization_id)
    OR assigned_to = auth.uid()
  );

CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "leads_update" ON public.leads
  FOR UPDATE USING (
    public.is_member_of_org(organization_id)
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    public.is_member_of_org(organization_id)
    OR assigned_to = auth.uid()
  );

CREATE POLICY "leads_delete" ON public.leads
  FOR DELETE USING (public.is_org_owner_or_admin(organization_id));

-- Meetings
CREATE POLICY "meetings_select" ON public.meetings
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = meetings.lead_id
        AND (public.is_member_of_org(l.organization_id) OR l.assigned_to = auth.uid())
    )
  );

CREATE POLICY "meetings_insert" ON public.meetings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = meetings.lead_id
        AND public.is_member_of_org(l.organization_id)
    )
  );

CREATE POLICY "meetings_update" ON public.meetings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = meetings.lead_id
        AND (public.is_member_of_org(l.organization_id) OR l.assigned_to = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = meetings.lead_id
        AND (public.is_member_of_org(l.organization_id) OR l.assigned_to = auth.uid())
    )
  );

CREATE POLICY "meetings_delete" ON public.meetings
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = meetings.lead_id
        AND public.is_org_owner_or_admin(l.organization_id)
    )
  );

-- Deals
CREATE POLICY "deals_select" ON public.deals
  FOR SELECT USING (
    public.is_member_of_org(organization_id)
    OR closed_by = auth.uid()
  );

CREATE POLICY "deals_insert" ON public.deals
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "deals_update" ON public.deals
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "deals_delete" ON public.deals
  FOR DELETE USING (public.is_org_owner_or_admin(organization_id));

-- Commissions
CREATE POLICY "commissions_select" ON public.commissions
  FOR SELECT USING (
    public.is_member_of_org(organization_id)
    OR to_user_id = auth.uid()
  );

CREATE POLICY "commissions_insert" ON public.commissions
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "commissions_update" ON public.commissions
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "commissions_delete" ON public.commissions
  FOR DELETE USING (public.is_org_owner_or_admin(organization_id));

-- Agency contacts
CREATE POLICY "agency_contacts_select" ON public.agency_contacts
  FOR SELECT USING (
    public.is_member_of_org(organization_id)
    OR contact_by = auth.uid()
    OR contacted_user_id = auth.uid()
  );

CREATE POLICY "agency_contacts_insert" ON public.agency_contacts
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "agency_contacts_update" ON public.agency_contacts
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "agency_contacts_delete" ON public.agency_contacts
  FOR DELETE USING (public.is_org_owner_or_admin(organization_id));

-- Freelancer projects
CREATE POLICY "freelancer_projects_select" ON public.freelancer_projects
  FOR SELECT USING (
    public.is_member_of_org(organization_id)
    OR freelancer_id = auth.uid()
  );

CREATE POLICY "freelancer_projects_insert" ON public.freelancer_projects
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "freelancer_projects_update" ON public.freelancer_projects
  FOR UPDATE USING (
    public.is_member_of_org(organization_id)
    OR freelancer_id = auth.uid()
  )
  WITH CHECK (
    public.is_member_of_org(organization_id)
    OR freelancer_id = auth.uid()
  );

CREATE POLICY "freelancer_projects_delete" ON public.freelancer_projects
  FOR DELETE USING (public.is_org_owner_or_admin(organization_id));

-- Job offers
CREATE POLICY "job_offers_select" ON public.job_offers
  FOR SELECT USING (
    public.is_member_of_org(organization_id)
    OR (status = 'active' AND published_at IS NOT NULL)
  );

CREATE POLICY "job_offers_insert" ON public.job_offers
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "job_offers_update" ON public.job_offers
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "job_offers_delete" ON public.job_offers
  FOR DELETE USING (public.is_org_owner_or_admin(organization_id));

-- Job applications
CREATE POLICY "job_applications_select" ON public.job_applications
  FOR SELECT USING (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.job_offers jo
      WHERE jo.id = job_applications.job_offer_id
        AND public.is_member_of_org(jo.organization_id)
    )
  );

CREATE POLICY "job_applications_insert" ON public.job_applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "job_applications_update" ON public.job_applications
  FOR UPDATE USING (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.job_offers jo
      WHERE jo.id = job_applications.job_offer_id
        AND public.is_member_of_org(jo.organization_id)
    )
  )
  WITH CHECK (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.job_offers jo
      WHERE jo.id = job_applications.job_offer_id
        AND public.is_member_of_org(jo.organization_id)
    )
  );

CREATE POLICY "job_applications_delete" ON public.job_applications
  FOR DELETE USING (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.job_offers jo
      WHERE jo.id = job_applications.job_offer_id
        AND public.is_org_owner_or_admin(jo.organization_id)
    )
  );

-- Testimonials
CREATE POLICY "testimonials_select" ON public.testimonials
  FOR SELECT USING (
    about_user_id = auth.uid()
    OR from_user_id = auth.uid()
    OR is_public = true
  );

CREATE POLICY "testimonials_insert" ON public.testimonials
  FOR INSERT WITH CHECK (from_user_id = auth.uid() OR from_user_id IS NULL);

CREATE POLICY "testimonials_update" ON public.testimonials
  FOR UPDATE USING (from_user_id = auth.uid())
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "testimonials_delete" ON public.testimonials
  FOR DELETE USING (
    from_user_id = auth.uid()
    OR about_user_id = auth.uid()
  );

-- Conversations
CREATE POLICY "conversations_select" ON public.conversations
  FOR SELECT USING (public.is_participant_in_conversation(id));

CREATE POLICY "conversations_insert" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "conversations_update" ON public.conversations
  FOR UPDATE USING (public.is_participant_in_conversation(id))
  WITH CHECK (public.is_participant_in_conversation(id));

-- Conversation participants
CREATE POLICY "conversation_participants_select" ON public.conversation_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_participant_in_conversation(conversation_id)
  );

CREATE POLICY "conversation_participants_insert" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR public.is_participant_in_conversation(conversation_id)
  );

CREATE POLICY "conversation_participants_delete" ON public.conversation_participants
  FOR DELETE USING (
    user_id = auth.uid()
    OR public.is_participant_in_conversation(conversation_id)
  );

-- Messages
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (public.is_participant_in_conversation(conversation_id));

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND public.is_participant_in_conversation(conversation_id)
  );

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE USING (sender_id = auth.uid());

-- Invitations
CREATE POLICY "invitations_select" ON public.invitations
  FOR SELECT USING (
    public.is_member_of_org(organization_id)
    OR email = (SELECT u.email::citext FROM auth.users u WHERE u.id = auth.uid())
  );

CREATE POLICY "invitations_insert" ON public.invitations
  FOR INSERT WITH CHECK (public.is_org_owner_or_admin(organization_id));

CREATE POLICY "invitations_update" ON public.invitations
  FOR UPDATE USING (public.is_org_owner_or_admin(organization_id))
  WITH CHECK (public.is_org_owner_or_admin(organization_id));

CREATE POLICY "invitations_delete" ON public.invitations
  FOR DELETE USING (public.is_org_owner_or_admin(organization_id));

-- Availability slots
CREATE POLICY "availability_slots_select" ON public.availability_slots
  FOR SELECT USING (user_id = auth.uid() OR is_available = true);

CREATE POLICY "availability_slots_insert" ON public.availability_slots
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "availability_slots_update" ON public.availability_slots
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "availability_slots_delete" ON public.availability_slots
  FOR DELETE USING (user_id = auth.uid());

-- Bookings
CREATE POLICY "bookings_select" ON public.bookings
  FOR SELECT USING (owner_id = auth.uid() OR booker_id = auth.uid());

CREATE POLICY "bookings_insert" ON public.bookings
  FOR INSERT WITH CHECK (
    booker_id = auth.uid()
    AND owner_id <> auth.uid()
    AND slot_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.availability_slots s
      WHERE s.id = bookings.slot_id
        AND s.user_id = bookings.owner_id
        AND s.is_available = true
        AND bookings.start_at >= s.start_at
        AND bookings.end_at <= s.end_at
    )
  );

-- ---------------------------------------------------------------------------
-- 17) COMPATIBILIDAD TEMPORAL profiles.organization_id
-- ---------------------------------------------------------------------------
-- Mientras el frontend use profiles.organization_id, lo sincronizamos desde
-- organization_members (fuente de verdad). A medio plazo, eliminar la columna.
CREATE OR REPLACE FUNCTION public.sync_profile_org_id_from_members()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  UPDATE public.profiles p
  SET organization_id = sub.organization_id
  FROM (
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = v_user_id
    ORDER BY om.joined_at ASC
    LIMIT 1
  ) sub
  WHERE p.id = v_user_id;

  -- Si ya no tiene membresías, dejamos organization_id en NULL
  UPDATE public.profiles p
  SET organization_id = NULL
  WHERE p.id = v_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.user_id = v_user_id
    );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_org_id_from_members_insert ON public.organization_members;
CREATE TRIGGER trg_sync_profile_org_id_from_members_insert
AFTER INSERT ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_org_id_from_members();

DROP TRIGGER IF EXISTS trg_sync_profile_org_id_from_members_update ON public.organization_members;
CREATE TRIGGER trg_sync_profile_org_id_from_members_update
AFTER UPDATE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_org_id_from_members();

DROP TRIGGER IF EXISTS trg_sync_profile_org_id_from_members_delete ON public.organization_members;
CREATE TRIGGER trg_sync_profile_org_id_from_members_delete
AFTER DELETE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_org_id_from_members();

CREATE POLICY "bookings_update" ON public.bookings
  FOR UPDATE USING (owner_id = auth.uid() OR booker_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() OR booker_id = auth.uid());

CREATE POLICY "bookings_delete" ON public.bookings
  FOR DELETE USING (owner_id = auth.uid() OR booker_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 15) VISTAS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.revenue_by_day AS
SELECT
  date_trunc('day', d.closed_at) AS day,
  d.organization_id,
  SUM(d.amount) AS total
FROM public.deals d
WHERE d.closed_at IS NOT NULL
GROUP BY date_trunc('day', d.closed_at), d.organization_id;

-- -----------------------------------------------------------------------------
-- 16) COMENTARIOS
-- -----------------------------------------------------------------------------

COMMENT ON TABLE public.profiles IS 'Perfil de usuario. profile_data y field_order se mantienen por compatibilidad con frontend actual.';
COMMENT ON TABLE public.organization_members IS 'Membresía real normalizada de usuarios en organizaciones.';
COMMENT ON TABLE public.agency_contacts IS 'Contactos entre organización y usuario/contacto externo; ahora incluye sujeto contactado.';
COMMENT ON TABLE public.freelancer_projects IS 'Tabla MVP. A futuro conviene migrarla a projects + project_members.';