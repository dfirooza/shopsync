import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RequestRow from "./RequestRow";
import type { Tables } from "@/types/database";

export default async function AdminPage() {
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  const userProfile = profile as Pick<Tables<'profiles'>, 'role' | 'email'> | null;

  // Debug logging
  console.log('User ID:', user.id);
  console.log('Profile data:', userProfile);
  console.log('Profile error:', profileError);

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600">Not Authorized</h1>
          <p className="mt-4 text-gray-700">
            You do not have permission to access this page.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Debug: Profile role = {userProfile?.role || 'null'}, Error = {profileError?.message || 'none'}
          </p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  // Fetch all business requests, ordered by status (pending first) and created_at (newest first)
  const { data: requestsData, error } = await supabase
    .from('business_requests')
    .select(`
      id,
      user_id,
      business_name,
      business_category,
      business_address,
      status,
      created_at,
      profiles!business_requests_user_id_fkey (
        email
      )
    `)
    .order('status', { ascending: true }) // pending < approved < rejected (alphabetically)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching business requests:', error);
    return (
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Requests</h1>
          <p className="mt-4 text-gray-700">{error.message}</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  type RequestWithProfile = Pick<Tables<'business_requests'>, 'id' | 'user_id' | 'business_name' | 'business_category' | 'business_address' | 'status' | 'created_at'> & {
    profiles: { email: string } | null;
  };

  const requests = requestsData as RequestWithProfile[] | null;

  // Transform data to include email
  const requestsWithEmail = requests?.map((req) => ({
    id: req.id,
    user_id: req.user_id,
    business_name: req.business_name,
    business_category: req.business_category,
    business_address: req.business_address,
    status: req.status,
    created_at: req.created_at,
    email: req.profiles?.email,
  })) || [];

  // Separate pending and non-pending requests
  const pendingRequests = requestsWithEmail.filter(r => r.status === 'pending');
  const processedRequests = requestsWithEmail.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-sf-gray-7">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-border-light sticky top-0 z-50 shadow-sf-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sf-blue-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-semibold text-sf-gray-1">
                ShopSync
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/owner"
                className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/"
                className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div className="bg-sf-blue-primary text-white border-b border-sf-blue-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2.5 mb-1">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-sf-blue-lighter">
            Manage business registration requests
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

          {/* Pending Requests */}
          <div className="bg-white rounded border border-border-light overflow-hidden">
            <div className="bg-sf-warning-light px-6 py-3 border-b border-sf-warning">
              <h2 className="text-lg font-semibold text-sf-gray-1">
                Pending Requests ({pendingRequests.length})
              </h2>
            </div>
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-sf-gray-6 rounded-full mb-3">
                  <svg className="w-6 h-6 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-sf-gray-3">No pending requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sf-gray-7 border-b border-border-light">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Email / User ID</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Business Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Address</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Created</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border-light">
                    {pendingRequests.map((request) => (
                      <RequestRow key={request.id} request={request} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Processed Requests */}
          <div className="bg-white rounded border border-border-light overflow-hidden">
            <div className="bg-sf-blue-pale px-6 py-3 border-b border-border-light">
              <h2 className="text-lg font-semibold text-sf-gray-1">
                Processed Requests ({processedRequests.length})
              </h2>
            </div>
            {processedRequests.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-sf-gray-6 rounded-full mb-3">
                  <svg className="w-6 h-6 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-sf-gray-3">No processed requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sf-gray-7 border-b border-border-light">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Email / User ID</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Business Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Address</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Created</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border-light">
                    {processedRequests.map((request) => (
                      <RequestRow key={request.id} request={request} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
