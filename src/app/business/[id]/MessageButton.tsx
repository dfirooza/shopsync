"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getOrCreateConversation } from "@/app/messages/actions";

interface MessageButtonProps {
  businessId: string;
  isLoggedIn: boolean;
}

export default function MessageButton({ businessId, isLoggedIn }: MessageButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const result = await getOrCreateConversation(businessId);
    setLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.conversationId) {
      router.push(`/messages/${result.conversationId}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-white text-sf-blue-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-sf-gray-7 transition-colors disabled:opacity-50"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {loading ? "Loading..." : "Message this business"}
    </button>
  );
}
