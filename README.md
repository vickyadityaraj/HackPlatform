# HackPlatform - Production-Ready Hackathon & Event Management Platform

EventCraft is a complete, enterprise-grade, high-performance web platform built to manage large-scale hackathons, technical conferences, and engineering events. It provides comprehensive workspaces tailored for Organizers, Participants, Judges, and Super Administrators.

---

## 🚀 Key Features

### 1. Authentication & Role-Based Access Control (RBAC)
- **NextAuth.js v5 (Auth.js)**: Configured with edge-compatible callbacks and middleware to prevent runtime overheads on routing.
- **Strict Guarding**: Server Actions protected by permission middleware checking roles (`SUPER_ADMIN`, `ORGANIZER`, `JUDGE`, `PARTICIPANT`) and account status (`ACTIVE`, `SUSPENDED`).
- **Cryptographic Invites**: Multi-factor verification maps invitations and memberships securely.

### 2. Organizer Control Workspace
- **Hackathon Life Cycle**: Create, edit, draft, publish, and logical soft-deletes of hackathon event timelines.
- **Dynamic Question Builder**: Drag-and-drop simulated component interface allowing organizers to construct custom registration questions (text, select dropdowns, checkboxes).
- **Administrative Widgets**: Match judges to hackathons by email address and broadcast announcements.

### 3. Participant Workspace & Team Engine
- **Roster & Management**: View rosters, transfer team ownership, remove members, or leave groups.
- **Secure Invitations**: Generate expirable, cryptographic invitation tokens to add teammates.
- **Profile Configurations**: Log skills tags, bio descriptions, university affiliations, countries, and portfolio URLs.

### 4. Developer Matchmaking Hub
- **Global Discovery**: Search other developer profiles.
- **Advanced Filters**: Query listings by skills, country, and experience metrics.
- **Invites Dispatch**: Directly invite developers to workspaces.

### 5. Judges Evaluation Center
- **Rubrics Matrix**: Grade projects based on custom organizer criteria (Design, Feasibility, Code Quality, Innovation).
- **Transactional Aggregates**: Average scores and project rankings updated inside transactional database boundaries to prevent race conditions.

### 6. Super Admin Control Console
- **Platform Settings**: Configure global commission fees and toggle maintenance overrides.
- **User Locks**: Suspend/unsuspend user profiles and adjust access clearances.
- **Chronological Audits**: Full audit logging mapping administrative actions.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15.0.0-rc (App Router)
- **Core**: React 19.0.0-rc, TypeScript
- **Styling**: Tailwind CSS, PostCSS, Lucide Icons, Framer Motion
- **ORM & Database**: Prisma 6.4.0, PostgreSQL (compatible with Supabase, Neon, etc.)
- **Authentication**: NextAuth.js v5
- **Form Validation**: React Hook Form, Zod

---

## 📂 Project Architecture

```
d:/Registration
├── prisma/
│   ├── schema.prisma   # PostgreSQL architecture mapping relations and indices
│   └── seed.js         # Seeding script populating setup variables and test profiles
├── src/
│   ├── actions/        # Type-safe Server Actions (API mutations)
│   │   ├── admin.ts
│   │   ├── evaluation.ts
│   │   ├── events.ts
│   │   ├── organizer.ts
│   │   ├── profile.ts
│   │   ├── registration.ts
│   │   └── teams.ts
│   ├── app/            # Next.js App Router (Layouts and Pages)
│   ├── components/     # UI Component Libraries & Form Modals
│   │   ├── dashboard/  # Interactive client widgets
│   │   └── ui/         # Primitives (shadcn/ui style sheets)
│   ├── lib/            # Configuration wrappers (Prisma, guards, utils)
│   ├── types/          # Extended TypeScript declarations
│   └── utils/          # Token and cryptographic helpers
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm` (packaged default)
- **Database**: PostgreSQL connection URI

### 2. Environment Variables Configuration
Copy [.env.example](file:///d:/Registration/.env.example) to `.env` and fill in your connection credentials:
```bash
# PostgreSQL Connection
DATABASE_URL="postgresql://username:password@localhost:5432/eventcraft?schema=public"

# NextAuth Settings
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-character-cryptographic-secret-here"
```

### 3. Install Dependencies
Restore workspace packages aligning with React 19:
```bash
npm install --legacy-peer-deps
```

### 4. Database Setup & Seeding
Push the database schema structures and run the seed script to populate default settings and test accounts:
```bash
# Push schema structure to database
npx prisma db push

# Generate client typings
npx prisma generate

# Populate database with seeds
npx prisma db seed
```

### 5. Running locally
Launch the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to inspect.

---

## 🔑 Seeding Credentials (Password: `password123`)

The seeding script generates four distinct role accounts to easily inspect workspaces:

| Role | Username | Password |
|---|---|---|
| **Super Admin** | `admin@hackathon.com` | `password123` |
| **Organizer** | `organizer@hackathon.com` | `password123` |
| **Judge** | `judge@hackathon.com` | `password123` |
| **Participant** | `participant@hackathon.com` | `password123` |
