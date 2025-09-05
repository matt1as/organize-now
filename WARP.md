# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Development server (with Turbopack)
npm run dev

# Production build (with Turbopack)
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type checking (no dedicated script - run manually)
npx tsc --noEmit
```

Development server runs on http://localhost:3000

## 📦 Project Overview

**OrganizeNow** is a mobile-first solution for association and group management. It simplifies administration, manages payments, and handles funding reporting for sports clubs, choirs, scouts, makerspaces, and community groups.

### Core Features (MVP)
- **Member Management**: GDPR-compliant member registry with parent-child linking
- **Event Planning**: Activities, invitations, RSVP management
- **Attendance Tracking**: Check-in/out with offline support, funding-compliant export
- **Payment Processing**: Swish/credit card integration with automated reminders
- **Communication**: Push notifications, email announcements
- **Reporting**: Funding reports for municipalities and federations

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **React**: Version 19 (with Server Components)
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS 4 (using @tailwindcss/postcss)
- **Bundler**: Turbopack (enabled in dev and build)
- **Fonts**: Geist Sans & Geist Mono (Google Fonts)

### Project Structure
```
organize-now/
├── src/
│   └── app/                 # Next.js App Router
│       ├── layout.tsx        # Root layout with fonts
│       ├── page.tsx          # Homepage (currently boilerplate)
│       └── globals.css       # Global styles with Tailwind directives
├── public/                   # Static assets
├── docs/                     # Product documentation
│   ├── PRD.md               # Product Requirements Document
│   └── UX.md                # UX specifications
└── [config files]           # next.config.ts, tsconfig.json, etc.
```

### TypeScript Configuration
- Path aliases: `@/*` → `./src/*`
- Target: ES2017
- Module resolution: bundler
- Strict mode: enabled
- JSX: preserve (for Next.js processing)

### Code Organization Patterns (Future)
When implementing features, organize code by domain:
```
src/
├── app/                      # Route handlers and pages
│   ├── (auth)/              # Authentication routes
│   ├── members/             # Member management
│   ├── events/              # Event & attendance
│   ├── payments/            # Payment processing
│   └── api/                 # API routes
├── components/              # Shared UI components
│   ├── ui/                  # Base components
│   └── features/            # Feature-specific components
├── lib/                     # Utilities and business logic
│   ├── actions/             # Server actions
│   ├── hooks/               # Custom React hooks
│   └── utils/               # Helper functions
└── types/                   # TypeScript type definitions
```

## 📋 Development Guidelines

### Data Fetching Strategy
- Use React Server Components for initial data loading
- Server Actions for mutations (form submissions, updates)
- Client components only when interactivity is required
- Consider offline-first patterns for attendance tracking

### Mobile-First Development
- All interfaces must work seamlessly on mobile devices
- Touch-friendly interaction targets (minimum 44x44px)
- Offline support for critical features (attendance check-in)
- Performance target: P95 API response <300ms

### Authentication & Security
- One-time codes via email (no passwords)
- Parent-child account linking for minors
- Role-based access control (admin, leader, member, guardian)
- UUID-based identifiers for all entities

## 📚 Essential Documentation

- **[Product Requirements Document](./docs/PRD.md)**: Complete feature specifications, success metrics, and roadmap
- **[UX Specifications](./docs/UX.md)**: User flows, wireframes, and design guidelines
- **[README](./README.md)**: Project overview and getting started guide

## 🎯 Current Development Focus

The project is in early MVP phase with boilerplate Next.js setup. Priority implementation areas:

1. **Authentication System**: Email-based OTP with guardian-child linking
2. **Member Registry**: CRUD operations with GDPR compliance
3. **Group Management**: Teams/groups with seasonal rosters
4. **Event & Attendance**: Create events, track RSVPs, offline check-in
5. **Payment Integration**: Swish/Stripe setup with fee tracking

When implementing features, refer to the PRD for detailed requirements and acceptance criteria. The UX.md file contains user journey maps and interface specifications.
