# Product Requirements Document (PRD)  
**Product name (working name):** OrganizeNow  
**Version:** 0.1 (MVP)  
**Date:** September 2025  

---

## 1. Background & Purpose
Associations, groups, and communities all struggle with the same problems: administration eats time, payments are hard to manage, and reporting for funding is cumbersome. Sportadmin solves some of this for sports clubs, but it is heavy and sports-locked. Community platforms (Mighty Networks, Slack, etc.) solve digital interaction but not payments or funding reporting.  

**The purpose** is to build a simple, mobile-first solution for all types of groups – from football teams to choirs, scouts, and makerspaces – with the ability to handle **members, events, attendance, payments, and association funding**.  

---

## 2. Goals
- **Reduce admin time** for leaders/admins by 50%.  
- **90% recorded attendance** for reporting.  
- **95% paid fees** within 30 days.  
- **100% compliant attendance data** for funding (e.g. LOK support in Sweden).  

---

## 3. Target Users
- **Association admin**: treasurer, secretary.  
- **Leaders/Organizers**: coaches, choir leaders, scout leaders.  
- **Members**: players, course participants, community members.  
- **Guardians**: for children under 18.  

---

## 4. Key Use Cases

1. **Onboarding**  
   Admin imports members (CSV), creates groups/teams, sends invites via link.  

2. **Events & Invitations**  
   Leader creates an activity (training, rehearsal, course, meeting) → invitation sent → members RSVP Yes/No/Maybe.  

3. **Attendance Tracking**  
   Leader checks in participants (even offline) → data syncs → export in funding-approved format.  

4. **Payments**  
   Admin creates a fee (membership, course) → members pay via Swish/credit card → system auto-marks as paid.  

5. **Communication**  
   Admin/leader posts an announcement → push + email notifications.  

6. **Reporting**  
   Admin exports reports (funding, member statistics, unpaid fees) for municipalities or federations.  

---

## 5. Functional Requirements (MVP)

- **Login**: one-time code via email, guardian↔child linking.  
- **Member registry**: name, contact info, birth year, consents.  
- **Groups/Teams**: rosters per season, multiple groups per association.  
- **Schedule/Events**: create, invite, RSVP.  
- **Attendance**: check-in/out, offline support, export.  
- **Payments**: Swish/credit card, reminders, receipts.  
- **Reporting**: funding export, member lists, financial reports.  
- **Communication**: announcements, push, email, attachments.  
- **Notifications**: push + email, user preferences per group.  

---

## 6. Non-functional Requirements

- **GDPR compliance**: data minimization, export/deletion, consent logs.  
- **Security**: TLS, encryption, UUID IDs, role-based access.  
- **Performance**: P95 API <300 ms, offline cache for next 7 days.  
- **Accessibility**: WCAG 2.1 AA.  
- **Availability**: 99.9% uptime SLO, daily backups.  

---

## 7. Out of Scope (MVP)

- Full chat/forum module.  
- Direct debit/complex discount engine.  
- Advanced statistics (individual performance).  
- Public websites.  

---

## 8. Success Metrics (KPIs)

- **Onboarding completion**: 95% of members complete account creation <3 min.  
- **RSVP response rate**: >80% within 24 h.  
- **Attendance reports**: 100% compliant for funding programs.  
- **Payment rate**: 95% within 30 days.  
- **Retention**: 90% of associations retained year 2.  

---

## 9. Roadmap (short)

- **MVP**: Member registry, events/invitations, attendance, payments, funding report.  
- **Phase 2**: Integration with Fortnox/Visma, installment payments, multi-org admin.  
- **Phase 3**: Community module (digital interaction, online courses).  
