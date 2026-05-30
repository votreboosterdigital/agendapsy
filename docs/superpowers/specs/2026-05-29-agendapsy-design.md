# AgendaPsy — Design Spec

**Date:** 2026-05-29
**Auteur:** Mehdi Belkacem (solo dev) · Claude Code
**Statut:** APPROVED — implémentation en cours

---

## Contexte

Niche validée après analyse 29 niches Brésil + 4 niches Mexique GO INCONDITIONNEL.
Cible : psicólogos y terapeutas online au Mexique (50-70k professionnels, +35% croissance).
Problème : 30-40% no-shows = CA direct perdu, zéro outil admin dédié en espagnol mexicain.

**Entrepreneur :** Français (Montréal), solo dev, Next.js/Supabase/Claude API, espagnol basique assisté IA.
**Distribution :** Google Ads México, Meta, SEO espagnol — 100% digitale, 0 présence physique.
**Éthique :** Halal-compatible (santé mentale, pas de beauté mixte, alcool, jeux, riba).

---

## Produit

**Nom :** AgendaPsy
**Tagline :** "Tu agenda inteligente para psicólogos"
**Prix :** $29 USD/mois · 14 jours gratuits · pas de CB requise à l'inscription

---

## MVP v1 — Features (Semaine 1)

### Auth & Onboarding
- Signup email + magic link via Supabase Auth
- Onboarding 4 étapes : profil professionnel → services/tarifs → disponibilités → Stripe connect
- Middleware Next.js pour protéger les routes `/dashboard/*`

### Agenda (Dashboard)
- Vue calendrier semaine — RDV du thérapeute
- Créer, modifier, annuler un RDV
- Flag no-show manuel
- Indicateurs : taux de remplissage, no-shows du mois

### CRM Patients
- Liste patients (nom, email, WhatsApp optionnel)
- Historique RDV par patient
- Statut : actif / inactif / liste d'attente

### Notes de Session
- Notes SOAP par RDV (Subjectif, Objectif, Analyse, Plan)
- Chiffrement côté serveur via Supabase RLS
- Accessible uniquement au thérapeute propriétaire

### Page de Réservation Publique
- URL : `agendapsy.com/book/[slug]`
- Patients choisissent : service → date dispo → confirment sans login
- Email de confirmation auto (Resend)
- Thérapeute reçoit notification de nouvelle réservation

### Rappels Automatiques
- Email J-1 avant RDV (via Resend)
- Email 1h avant RDV
- Cron job via Vercel Cron (toutes les heures)

### Facturation SaaS
- Stripe Checkout pour l'abonnement thérapeute ($29/mois)
- Webhooks : `customer.subscription.created`, `invoice.payment_failed`, `customer.subscription.deleted`
- Portail client Stripe pour gérer la facturation

---

## Landing Page (Semaine 2)

**URL :** agendapsy.com
**Langue :** Espagnol mexicain (traduit + validé IA)
**SEO cible :** "software para psicólogos México", "agenda para psicólogos", "app para terapeutas"

### Sections
1. **Hero** — LampEffect + SparklesCore (Aceternity) · headline + CTA "Empieza gratis"
2. **Problem** — chiffres no-shows, perte CA
3. **Features** — BentoGrid 5 features clés
4. **How it works** — Timeline 3 étapes
5. **Social proof** — InfiniteMovingCards témoignages
6. **Pricing** — 1 plan $29 · CTA MovingBorder
7. **FAQ** — 6 questions fréquentes
8. **CTA final** — "14 días gratis, cancela cuando quieras"

**Design system :** Linear (dark #0F0F11 · accent violet #635BFF · radius 6px · Geist font)

---

## Architecture Technique

### Répertoires
```
app/
├── (marketing)/              # Landing, /pricing, /blog
├── (auth)/                   # /login, /signup, /onboarding
├── (dashboard)/              # /agenda, /pacientes, /notas, /configuracion
└── (booking)/[slug]/         # Page publique patient
api/
├── stripe/webhook/           # POST — Stripe events
├── reminders/send/           # POST — Cron reminders
└── booking/confirm/          # POST — Confirmer réservation
lib/
├── supabase/                 # client.ts, server.ts, middleware
├── stripe/                   # client.ts, webhooks.ts
└── resend/                   # emails.ts
supabase/
└── migrations/               # SQL migrations
```

### DB Schema (Supabase PostgreSQL)

```sql
-- profiles (thérapeutes)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  slug TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  bio TEXT,
  specialty TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- availability_rules (disponibilités récurrentes)
CREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0=Lun ... 6=Dim
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_duration_min INT DEFAULT 50
);

-- appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_whatsapp TEXT,
  service_name TEXT NOT NULL,
  price_usd DECIMAL(10,2),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, no_show, completed
  notes TEXT,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- session_notes (SOAP)
CREATE TABLE session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES profiles(id),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- services (tarifs par thérapeute)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_min INT DEFAULT 50,
  price_usd DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
```

### Stack
| Couche | Choix |
|---|---|
| Framework | Next.js 14 App Router (TypeScript strict) |
| DB + Auth | Supabase |
| Paiements | Stripe (abonnement thérapeute) |
| Emails | Resend |
| UI | shadcn/ui + Aceternity UI + Tailwind |
| Deploy | Vercel |
| Cron | Vercel Cron Jobs (plan Hobby inclus) |
| Domaine | agendapsy.com (à enregistrer) |

### Variables d'environnement
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=https://agendapsy.com
```

---

## Roadmap

| Semaine | Focus | Résultat |
|---|---|---|
| S1 | MVP complet | Auth + agenda + booking + reminders + Stripe |
| S2 | Landing page + SEO | agendapsy.com live en espagnol |
| S3 | GTM | 50 DMs Instagram psys mexicains · Google Ads |
| S4-5 | Premier paiement | Objectif : 3-5 clients payants |
| S6 | WhatsApp v1.1 | Meta Cloud API (après validation Business) |

---

## Critères de succès MVP

- [ ] Thérapeute peut s'inscrire et configurer son agenda en < 5 minutes
- [ ] Patient peut réserver un RDV sans créer de compte
- [ ] Rappels email envoyés automatiquement (testé)
- [ ] Stripe abonnement fonctionne (test + prod)
- [ ] Lighthouse score landing page > 85
- [ ] Build TypeScript 0 erreurs
