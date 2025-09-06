## Summary

This PR implements the member invitation feature, allowing association leaders and admins to invite new members by email. Invited users receive an email with a unique invitation link, which they can use to join the association. The feature includes invitation creation, email delivery, invitation acceptance, and appropriate role assignment upon joining.

### Changes in this PR

- Added member invitation functionality:
  - Leaders/admins can invite new members by entering their email address.
  - Generates a unique, time-limited invitation link for each invite.
  - Sends invitation emails to recipients with a secure join link.
  - Handles invitation acceptance and membership creation.
  - Prevents duplicate invitations and handles expired/invalid links gracefully.
- Updated members list to show pending invitations.
- Added UI for managing and resending/canceling invitations.
- Added backend API endpoints and database schema for invitations.
- Added tests for invitation flow (invite, accept, error cases).

### New & Updated Pages
- `/associations/[id]/members` (now shows pending invitations)
- `/associations/[id]/members/invite` (invite form)
- `/invite/[token]` (invitation acceptance page)

### Local Testing
1. Start services:
   - `npm run dev`
   - (If using email testing, ensure maildev or similar is running)
2. Go to an association's members page and click "Invite Member".
3. Enter an email address and send the invite.
4. Open the test email inbox, click the invitation link, and accept the invite.
5. Verify the new member appears in the members list.

### Migration Impact
- Database migrations add a new `invitations` table.
- No breaking changes to existing data.

If you have feedback or suggestions for the invitation flow, please let me know!
