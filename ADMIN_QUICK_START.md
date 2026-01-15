# Admin Dashboard - Quick Start Guide

Follow these 3 steps to set up the admin dashboard.

---

## STEP 1: Apply SQL Migration

Go to your Supabase Dashboard → SQL Editor and run:

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

---

## STEP 2: Set Yourself as Admin

Replace `your-email@example.com` with your actual email:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

**Verify it worked:**
```sql
SELECT id, email, role FROM public.profiles WHERE role = 'admin';
```

You should see your account with `role = 'admin'`.

---

## STEP 3: Access Admin Dashboard

1. Make sure you're logged in with your admin account
2. Navigate to: `/admin`
3. You should see the admin dashboard with pending business requests

---

## What You Can Do Now

### Approve Business Requests

1. Go to `/admin`
2. View pending requests in the "Pending Requests" section
3. Click **Approve** on a request
4. Confirm the action
5. User is now upgraded to business owner and can create businesses

### Reject Business Requests

1. Go to `/admin`
2. View pending requests
3. Click **Reject** on a request
4. Confirm the action
5. Request is marked rejected, user remains regular user

---

## Troubleshooting

### "Not Authorized" when visiting `/admin`

Your user is not set as admin. Run:

```sql
SELECT id, email, role FROM public.profiles WHERE email = 'your-email@example.com';
```

If `role` is not `'admin'`, run:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Can't see any requests

Create a test business request:
1. Log in as a regular (non-admin) user
2. Go to `/owner`
3. Submit a business request
4. Log back in as admin
5. Go to `/admin`
6. You should see the request

---

## Security Notes

- **Admin role is database-enforced**: RLS policies prevent non-admins from accessing requests
- **Server-side validation**: All actions verify admin role on the server
- **No hardcoded emails**: Admin status is stored in database, not code
- **Safe request handling**: Uses request's user_id from database, not client input

---

## For Full Documentation

See [ADMIN_IMPLEMENTATION.md](ADMIN_IMPLEMENTATION.md) for complete details including:
- Security architecture
- RLS policy explanations
- UI/UX details
- Testing checklist
- Troubleshooting guide
- Future enhancement ideas

---

That's it! Your admin dashboard is ready. 🎉
