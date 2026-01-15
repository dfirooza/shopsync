# Admin Dashboard Implementation

This document explains the admin approval system for managing business registration requests.

---

## IMPLEMENTATION APPROACH

### ✅ Role-Based Access Control with RLS

**Why this approach:**
- **Secure**: Database-level enforcement via Row Level Security (RLS)
- **Simple**: No service role keys or Edge Functions needed
- **Scalable**: Easy to add multiple admins
- **Clean**: Follows existing role-based pattern in the app

**How it works:**
1. Added `admin` role to `profiles.role` enum
2. Created RLS policies allowing admins to read/update `business_requests` and `profiles`
3. Server-side access control checks admin role before rendering page
4. Server actions validate admin role before processing requests

---

## FILES CREATED/MODIFIED

### New Files

1. **[supabase/migrations/005_add_admin_role.sql](supabase/migrations/005_add_admin_role.sql)** - Adds admin role and RLS policies
2. **[src/app/admin/page.tsx](src/app/admin/page.tsx)** - Admin dashboard (server component)
3. **[src/app/admin/actions.ts](src/app/admin/actions.ts)** - Server actions for approve/reject
4. **[src/app/admin/RequestRow.tsx](src/app/admin/RequestRow.tsx)** - Client component for request rows

### Modified Files

1. **[src/types/database.ts](src/types/database.ts)** - Added `'admin'` to profiles role type

---

## STEP-BY-STEP SETUP

### 1. Apply SQL Migration

Run this migration in your Supabase SQL Editor:

```sql
-- Add admin role to profiles role enum
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('user', 'business', 'admin'));

-- RLS Policy: Admins can read all business_requests
CREATE POLICY "Admins can read all business requests"
ON public.business_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- RLS Policy: Admins can update all business_requests
CREATE POLICY "Admins can update all business requests"
ON public.business_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- RLS Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- RLS Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_business_requests_status ON public.business_requests(status);
```

### 2. Set Your Admin User

Replace `your-admin-email@example.com` with your actual email:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

**Verify it worked:**
```sql
SELECT id, email, role FROM public.profiles WHERE role = 'admin';
```

### 3. Access Admin Dashboard

Navigate to: `/admin`

If you're logged in with an admin account, you'll see the dashboard.
If not, you'll see "Not Authorized".

---

## FEATURES

### Admin Dashboard (`/admin`)

#### Access Control
- ✅ Redirects to `/login` if not authenticated
- ✅ Shows "Not Authorized" if user is not admin
- ✅ Only accessible to users with `role = 'admin'`

#### Request Display
- **Pending Requests** (top section)
  - Sorted by newest first
  - Shows: Email, Business Name, Category, Address, Status, Created Date
  - Actions: Approve/Reject buttons

- **Processed Requests** (bottom section)
  - Shows approved/rejected requests
  - No action buttons (already processed)
  - Sorted by newest first

#### Request Information
- **Email**: Shows user's email (or user_id if email unavailable)
- **Business Name**: Name of requested business
- **Category**: Business category
- **Address**: Business address
- **Status**: Badge (yellow=pending, green=approved, red=rejected)
- **Created**: Date request was submitted

### Approve Action

**What it does:**
1. Validates admin role
2. Updates `business_requests.status = 'approved'`
3. Updates `profiles.role = 'business'`
4. Updates `profiles.business_approved = true`
5. Revalidates page to show updated data

**Result:** User can now create/manage their business in `/owner` dashboard

### Reject Action

**What it does:**
1. Validates admin role
2. Updates `business_requests.status = 'rejected'`
3. Does NOT modify user's profile
4. Revalidates page to show updated data

**Result:** Request is marked rejected, user remains as regular user

---

## SECURITY

### RLS Policies

All operations are protected by Row Level Security:

```typescript
// Admins can read all business_requests
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin'
))

// Admins can update all business_requests
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin'
))

// Admins can read/update all profiles
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin'
))
```

### Server-Side Validation

**Access Control (page.tsx):**
```typescript
// Check if user is logged in
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  redirect('/login');
}

// Check if user is admin
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (!profile || profile.role !== 'admin') {
  // Show "Not Authorized"
}
```

**Action Validation (actions.ts):**
```typescript
// Check if user is admin before processing
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (!profile || profile.role !== 'admin') {
  return { error: 'Unauthorized: Admin access required' };
}
```

### Safe Request Handling

**Uses request's user_id as source of truth:**
```typescript
// Get the request to find the user_id
const { data: request } = await supabase
  .from('business_requests')
  .select('user_id, business_name')
  .eq('id', requestId)
  .single();

// Update profile using the request's user_id (not client input)
await supabase
  .from('profiles')
  .update({ role: 'business', business_approved: true })
  .eq('id', request.user_id); // Safe: from database, not client
```

This prevents attacks where a malicious client tries to approve a different user's request.

---

## USER INTERFACE

### Admin Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│ Admin Dashboard                    ← Back to home   │
│ Manage business registration requests               │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Pending Requests (3)                                │
│ ┌──────────────────────────────────────────────────┐│
│ │ Email    │ Name │ Category │ Address │ Actions  ││
│ │──────────│──────│──────────│─────────│──────────││
│ │ user@... │ Cafe │ Coffee   │ 123 St  │ [Approve]││
│ │          │      │          │         │ [Reject] ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ Processed Requests (5)                              │
│ ┌──────────────────────────────────────────────────┐│
│ │ Email    │ Name │ Category │ Status  │ Date     ││
│ │──────────│──────│──────────│─────────│──────────││
│ │ old@...  │ Shop │ Retail   │ Approved│ 01/15/26 ││
│ └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Status Badges

- **Pending**: Yellow badge
- **Approved**: Green badge
- **Rejected**: Red badge

### Action Buttons

- **Approve**: Green button (only on pending requests)
- **Reject**: Red button (only on pending requests)
- **Confirmation**: Prompts for confirmation before action
- **Loading State**: Buttons disabled with "Processing..." text

### Success/Error Messages

After approve/reject:
- **Success**: Green banner with success message
- **Error**: Red banner with error message

---

## WORKFLOW

### Business Registration Flow

1. **User submits business request** (`/owner`)
   - Creates row in `business_requests` with `status='pending'`
   - User remains as `role='user'` in profiles

2. **Admin reviews request** (`/admin`)
   - Sees request in "Pending Requests" section
   - Reviews business details

3. **Admin approves request**
   - Clicks "Approve" button
   - Confirms action
   - Server action:
     - Updates `business_requests.status = 'approved'`
     - Updates `profiles.role = 'business'`
     - Updates `profiles.business_approved = true`
   - Page revalidates
   - Request moves to "Processed Requests" section

4. **User can now manage business** (`/owner`)
   - Has access to create/edit businesses
   - Can add products
   - Business owner functionality unlocked

### Rejection Flow

1. **Admin rejects request**
   - Clicks "Reject" button
   - Confirms action
   - Server action:
     - Updates `business_requests.status = 'rejected'`
     - Profile unchanged (remains `role='user'`)
   - Page revalidates
   - Request moves to "Processed Requests"

2. **User remains regular user**
   - Cannot create businesses
   - Can submit new business request if desired

---

## ADDING MORE ADMINS

### Option 1: SQL Query (Recommended)

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'new-admin@example.com';
```

### Option 2: Via Admin Dashboard (Future Enhancement)

Could add an "Admin Management" section to promote users to admin.

---

## TESTING CHECKLIST

### Setup Tests

- [ ] Apply SQL migration successfully
- [ ] Set your user as admin
- [ ] Verify admin role in database
- [ ] Access `/admin` while logged in as admin
- [ ] Verify non-admin users see "Not Authorized"

### Approval Tests

- [ ] Create test business request (as regular user)
- [ ] View request in admin dashboard
- [ ] Approve request
- [ ] Verify user's profile updated to `role='business'`
- [ ] Verify user can now access `/owner` dashboard
- [ ] Verify request status changed to "approved"
- [ ] Verify request moved to "Processed Requests"

### Rejection Tests

- [ ] Create test business request
- [ ] Reject request
- [ ] Verify request status changed to "rejected"
- [ ] Verify user's profile unchanged
- [ ] Verify user cannot create businesses
- [ ] Verify request moved to "Processed Requests"

### Security Tests

- [ ] Try accessing `/admin` while logged out (should redirect to login)
- [ ] Try accessing `/admin` as regular user (should show "Not Authorized")
- [ ] Verify RLS prevents non-admins from viewing all requests
- [ ] Verify RLS prevents non-admins from updating requests

### UI Tests

- [ ] Pending requests show at top
- [ ] Processed requests show at bottom
- [ ] Status badges display correctly
- [ ] Approve/Reject buttons only on pending requests
- [ ] Confirmation prompts work
- [ ] Loading states display during processing
- [ ] Success/error messages display correctly
- [ ] Page revalidates after actions

---

## PERFORMANCE

### Indexes

Added for faster queries:

```sql
-- Faster admin role checks
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Faster status filtering
CREATE INDEX idx_business_requests_status ON public.business_requests(status);
```

### Query Optimization

- Uses `.single()` for profile checks (faster than `.maybeSingle()` when expecting one result)
- Joins profiles table to get email in one query (no N+1 problem)
- Orders by status then created_at (uses composite sort)

---

## TROUBLESHOOTING

### "Not Authorized" when accessing `/admin`

**Cause:** Your user is not set as admin.

**Fix:**
```sql
-- Check your current role
SELECT id, email, role FROM public.profiles WHERE email = 'your-email@example.com';

-- Set as admin
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### RLS policy errors when approving/rejecting

**Cause:** RLS policies not applied or incorrect.

**Fix:** Re-run the migration SQL from step 1.

### "Business request not found" error

**Cause:** Request was deleted or doesn't exist.

**Fix:** Refresh page and verify request exists.

### User still can't create business after approval

**Cause:** Profile not updated correctly.

**Fix:**
```sql
-- Check user's profile
SELECT id, email, role, business_approved FROM public.profiles WHERE email = 'user-email@example.com';

-- Manually update if needed
UPDATE public.profiles
SET role = 'business', business_approved = true
WHERE email = 'user-email@example.com';
```

### Emails not showing in admin dashboard

**Cause:** Email not in profiles table (can happen with manual user creation).

**Fix:** User ID will display instead (first 8 characters). This is acceptable.

---

## FUTURE ENHANCEMENTS (Not in MVP)

If you want to improve this later:

- [ ] Add admin notes field to business_requests
- [ ] Add email notifications when request is approved/rejected
- [ ] Add "Revert" action to undo approval
- [ ] Add admin audit log (who approved/rejected what and when)
- [ ] Add admin user management page (promote users to admin)
- [ ] Add search/filter for requests
- [ ] Add pagination for large lists
- [ ] Add bulk approve/reject actions
- [ ] Add request comments/messaging system
- [ ] Add statistics dashboard (approval rates, pending count, etc.)

---

## SECURITY BEST PRACTICES

### ✅ What We Did

1. **Database-level enforcement**: RLS policies prevent unauthorized access
2. **Server-side validation**: All actions validate admin role on server
3. **No client trust**: Never trust client input for user IDs
4. **Principle of least privilege**: Admins can only read/update what they need
5. **Audit trail**: `updated_at` timestamps track changes

### ❌ What to Avoid

1. **Don't hardcode admin emails in code**: Use database role instead
2. **Don't skip RLS**: Always enforce at database level
3. **Don't trust client input**: Always get user_id from database
4. **Don't use service role key in client**: Keep it server-side only
5. **Don't expose admin endpoints publicly**: Always check auth

---

## QUICK REFERENCE

### Set Admin User

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

### Check Admin Users

```sql
SELECT id, email, role FROM public.profiles WHERE role = 'admin';
```

### View Pending Requests

```sql
SELECT * FROM public.business_requests WHERE status = 'pending' ORDER BY created_at DESC;
```

### Manual Approval (if needed)

```sql
-- Update request
UPDATE public.business_requests SET status = 'approved' WHERE id = 'request-uuid';

-- Update profile
UPDATE public.profiles
SET role = 'business', business_approved = true
WHERE id = 'user-uuid';
```

---

## Summary

The admin dashboard is now live at `/admin`. Set your user as admin using SQL, then you can approve/reject business requests with a secure, database-enforced permission system. No hardcoded emails, no service role keys - just clean, secure RLS policies. 🎉
