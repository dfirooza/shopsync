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
    <main className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage business registration requests
            </p>
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:underline"
          >
            ← Back to home
          </Link>
        </div>

        {/* Pending Requests */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Pending Requests ({pendingRequests.length})
          </h2>
          {pendingRequests.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-gray-500">
              No pending requests
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email / User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Business Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {pendingRequests.map((request) => (
                    <RequestRow key={request.id} request={request} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Processed Requests */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Processed Requests ({processedRequests.length})
          </h2>
          {processedRequests.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-gray-500">
              No processed requests
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email / User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Business Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
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
  );
}
