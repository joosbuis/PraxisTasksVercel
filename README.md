# Praxis Tasks

Een moderne taakbeheer applicatie voor Praxis medewerkers, gebouwd met React, TypeScript, Tailwind CSS en Supabase.

## Features

- 🔐 **Veilige authenticatie** - Personeelsnummer-gebaseerde login
- 👥 **Gebruikersbeheer** - Manager kan medewerkers beheren
- 📋 **Taakbeheer** - Volledige CRUD operaties voor taken
- 🏢 **Afdelingen** - Voorwinkel en achterwinkel boards
- ⚡ **Real-time updates** - Live synchronisatie via Supabase
- 🎨 **Dark/Light theme** - Persoonlijke thema voorkeur
- 🌍 **Meertalig** - Nederlands en Engels
- 📱 **Responsive** - Werkt op alle apparaten

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Setup

1. **Supabase Project Setup**
   - Klik op "Connect to Supabase" in de top-right van Bolt
   - Of maak handmatig een Supabase project aan
   - Kopieer je project URL en anon key

2. **Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Vul je Supabase credentials in:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_VERSION=1.0.0
   ```

3. **Database Setup**
   - De migraties in `supabase/migrations/` worden automatisch uitgevoerd
   - Default manager account: personeelsnummer `1001`, wachtwoord `manager123`

4. **Development**
   ```bash
   npm install
   npm run dev
   ```

## Deployment

Deze app is klaar voor deployment op elke moderne hosting provider:

- **Vercel/Netlify**: Automatische deployment via Git
- **Bolt Hosting**: Direct deployen vanuit Bolt
- **Eigen server**: Build met `npm run build`

## Default Accounts

- **Manager**: Personeelsnummer `1001`, Wachtwoord `manager123`
  - Volledige toegang tot alle functies
  - Kan gebruikers beheren
  - Toegang tot beide afdelingen

## Gebruikersbeheer

Managers kunnen:
- Nieuwe medewerkers aanmaken
- Tijdelijke inlogcodes genereren
- Rollen en afdelingen toewijzen
- Gebruikers bewerken en verwijderen

## Taakbeheer

- **Te Doen**: Nieuwe taken
- **Taak Oppakken**: Taken die opgepakt moeten worden
- **Mee Bezig**: Actieve taken
- **Afgerond**: Voltooide taken

Elke taak heeft:
- Titel en beschrijving
- Prioriteit (Laag/Gemiddeld/Hoog)
- Toewijzing aan medewerker
- Deadline
- Activiteitenlog
- Afdeling (Voorwinkel/Achterwinkel)

## Instellingen

- **Persoonlijk**: Thema, taal, auto-logout
- **Systeem** (Manager): Gebruikersbeheer, rapporten, statistieken

## Security

- Row Level Security (RLS) op alle tabellen
- Rol-gebaseerde toegangscontrole
- Veilige wachtwoord opslag via Supabase Auth
- Real-time updates alleen voor geautoriseerde gebruikers