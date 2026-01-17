import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessInboxConversations } from "@/app/messages/actions";

export default async function InboxPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has a business
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: business } = await (supabase as any)
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle() as { data: { id: string; name: string } | null };

  if (!business) {
    return (
      <div className="min-h-screen bg-sf-gray-7 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sf-card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-sf-warning-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sf-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-sf-gray-1 mb-2">No Business Found</h2>
          <p className="text-sf-gray-3 mb-6">You need to have an approved business to access the inbox.</p>
          <Link href="/owner" className="sf-link">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const result = await getBusinessInboxConversations();
  const conversations = (result.conversations || []) as Array<{
    id: string;
    customerId: string;
    customerEmail: string;
    createdAt: string;
  }>;

  return (
    <div className="min-h-screen bg-sf-gray-7">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-border-light sticky top-0 z-50 shadow-sf-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sf-blue-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-semibold text-sf-gray-1">ShopSync</span>
            </Link>
            <Link
              href="/owner"
              className="text-sf-gray-2 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-sf-blue-primary text-white border-b border-sf-blue-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-1">Inbox</h1>
          <p className="text-sf-blue-lighter">
            Customer messages for {business.name}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sf-card p-12 text-center">
            <div className="w-16 h-16 bg-sf-gray-6 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-sf-gray-1 mb-2">No messages yet</h3>
            <p className="text-sf-gray-3">
              When customers message your business, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sf-card overflow-hidden">
            <div className="divide-y divide-border-light">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="block px-6 py-4 hover:bg-sf-gray-7 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-sf-blue-lighter rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-sf-blue-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sf-gray-1">{conv.customerEmail}</p>
                        <p className="text-sm text-sf-gray-3">
                          Started {new Date(conv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
