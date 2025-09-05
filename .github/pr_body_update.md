## Summary

This PR sets up Supabase with Next.js, implements authentication and the initial database schema, and adds several fixes and improvements discovered during end-to-end testing.

### Changes since initial PR creation

- Authentication & PKCE
  - Set `auth.site_url` to `http://localhost:3000` and added explicit redirect allow-list for both `localhost` and `127.0.0.1`
  - Simplified callback handling: redirect `/?code=...` to `/auth/callback` and exchange code there
  - Allowed access to `/login` even when authenticated to prevent sign-out redirect loops
- RLS Policies (Supabase)
  - Added: "Creators can view their associations" (SELECT on `associations`)
  - Added: "Creator can add self as admin" (INSERT on `association_members`)
  - Removed recursive/broad policies that caused `infinite recursion detected in policy` errors on INSERT
  - Replaced `association_members` SELECT policy with a non-recursive version to avoid insert-time recursion
- Association creation flow
  - Pre-generate `associationId` client-side and insert with `returning: 'minimal'` to avoid RLS-blocked SELECT
  - Insert initial admin membership for creator
- Next.js params cleanup
  - Server components now unwrap params with `React.use()`
  - Client components use `useParams()` from `next/navigation`
  - Removes the Next.js 15 warnings regarding params being a Promise
- Members
  - Members list supports search with `?q=` across name/email/phone using `ilike`
  - Add Member page with role checks (leader/admin), improved validation states
- UI/UX
  - Improved input contrast/readability in light/dark: `bg-white text-gray-900 placeholder-gray-500` + stronger focus rings
  - Swedish copy for login, dashboard, and association screens
- Tests
  - Playwright full-flow test (Login → Create förening → Add member) added and passing locally

### New & Updated Pages
- `/login`, `/auth/callback`, `/auth/signout`
- `/dashboard`
- `/associations/new`
- `/associations/[id]`
- `/associations/[id]/members`
- `/associations/[id]/members/add`

### Local Testing
1. Start services:
   - `supabase start`
   - `npm run dev`
2. Go to `http://localhost:3000/login` and enter any email
3. Open Inbucket `http://localhost:54324`, open the email, click magic link
4. Create a förening at `/associations/new`
5. Add a member at `/associations/{id}/members/add`

### Migration Impact
- Local `supabase db reset` was run to apply new RLS/migrations; this resets local data
- Developers will need to re-login via magic link after pulling

If you’d like, I can follow up with the Activities feature (events table + pages) next.

