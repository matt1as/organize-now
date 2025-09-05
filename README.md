# OrganizeNow

A mobile-first solution for association and group management. Simplify administration, manage payments, and handle funding reporting for sports clubs, choirs, scouts, makerspaces, and community groups.

## 🎯 Purpose

Associations, groups, and communities all struggle with the same problems: administration eats time, payments are hard to manage, and reporting for funding is cumbersome. OrganizeNow provides a simple, comprehensive solution that handles **members, events, attendance, payments, and association funding** – all in one place.

## ✨ Key Features

- **Member Management**: Complete member registry with GDPR compliance
- **Event Planning**: Create activities, send invitations, manage RSVPs
- **Attendance Tracking**: Check-in participants (even offline), export funding-compliant reports
- **Payment Processing**: Handle membership fees and payments via Swish/credit card
- **Communication**: Send announcements with push and email notifications
- **Funding Reports**: Export compliant reports for municipalities and federations

## 🎯 Goals

- Reduce admin time for leaders by **50%**
- Achieve **90% recorded attendance** for reporting
- Reach **95% paid fees** within 30 days
- Provide **100% compliant attendance data** for funding programs

## 👥 Target Users

- **Association Administrators**: Treasurers, secretaries
- **Leaders/Organizers**: Coaches, choir leaders, scout leaders
- **Members**: Players, participants, community members
- **Guardians**: Parents/guardians of children under 18

## 🚀 Getting Started

This is a [Next.js](https://nextjs.org) project with TypeScript and Tailwind CSS.

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/matt1as/organize-now.git
cd organize-now
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📋 MVP Features

### Core Functionality
- **Authentication**: One-time code via email, guardian↔child linking
- **Member Registry**: Name, contact info, birth year, consents
- **Groups/Teams**: Rosters per season, multiple groups per association
- **Schedule/Events**: Create, invite, RSVP management
- **Attendance**: Check-in/out with offline support and export
- **Payments**: Swish/credit card integration with reminders and receipts
- **Reporting**: Funding exports, member lists, financial reports
- **Communication**: Announcements, push notifications, email, attachments

### Technical Requirements
- **GDPR Compliance**: Data minimization, export/deletion, consent logs
- **Security**: TLS encryption, UUID IDs, role-based access
- **Performance**: P95 API response time <300ms, offline cache for 7 days
- **Accessibility**: WCAG 2.1 AA compliance
- **Availability**: 99.9% uptime SLO with daily backups

## 🛣️ Roadmap

### Phase 1 (MVP)
- Member registry and group management
- Events, invitations, and attendance tracking
- Payment processing and funding reports

### Phase 2
- Integration with Fortnox/Visma
- Installment payments
- Multi-organization admin

### Phase 3
- Community module with digital interaction
- Online courses platform

## 📊 Success Metrics

- **Onboarding**: 95% of members complete registration in <3 minutes
- **RSVP Rate**: >80% response within 24 hours
- **Compliance**: 100% funding-compliant attendance reports
- **Payment Success**: 95% of fees paid within 30 days
- **Retention**: 90% of associations retained in year 2

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Development**: Turbopack, ESLint

## 📚 Documentation

- [Product Requirements Document](./docs/PRD.md) - Detailed product specification
- [Next.js Documentation](https://nextjs.org/docs) - Framework reference

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is private and proprietary. All rights reserved.

---

**Version**: 0.1.0 (MVP)  
**Last Updated**: September 2025
