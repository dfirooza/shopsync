import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConversationDetails, getConversationMessages } from "@/app/messages/actions";
import ChatInput from "./ChatInput";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { id: conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const detailsResult = await getConversationDetails(conversationId);

  if (detailsResult.error || !detailsResult.conversation) {
    return (
      <div className="min-h-screen bg-sf-gray-7 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sf-card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-sf-error-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sf-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-sf-gray-1 mb-2">Conversation Not Found</h2>
          <p className="text-sf-gray-3 mb-6">{detailsResult.error || "This conversation doesn't exist or you don't have access."}</p>
          <Link href="/" className="sf-link">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const { conversation, currentUserId, isBusinessOwner } = detailsResult;
  const messagesResult = await getConversationMessages(conversationId);
  const messages = messagesResult.messages || [];

  return (
    <div className="min-h-screen bg-sf-gray-7 flex flex-col">
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
            <div className="flex items-center gap-3">
              {isBusinessOwner ? (
                <Link
                  href="/owner/inbox"
                  className="text-sf-gray-2 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Inbox
                </Link>
              ) : (
                <Link
                  href={`/business/${conversation.businessId}`}
                  className="text-sf-gray-2 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Business
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Header */}
      <div className="bg-white border-b border-border-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-lg font-semibold text-sf-gray-1">
            {isBusinessOwner ? "Customer Conversation" : conversation.businessName}
          </h1>
          <p className="text-sm text-sf-gray-3">
            {isBusinessOwner
              ? "Respond to customer inquiries"
              : "Chat with this business"}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-sf-gray-6 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-sf-gray-1 mb-1">No messages yet</h3>
              <p className="text-sm text-sf-gray-3">Start the conversation by sending a message below.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: { id: string; sender_id: string; body: string; created_at: string }) => {
                const isOwn = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl px-4 py-3 ${
                        isOwn
                          ? "bg-sf-blue-primary text-white"
                          : "bg-white border border-border-light text-sf-gray-1"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? "text-sf-blue-lighter" : "text-sf-gray-3"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-border-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ChatInput conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}
