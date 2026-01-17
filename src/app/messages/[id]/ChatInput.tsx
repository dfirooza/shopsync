"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/messages/actions";

interface ChatInputProps {
  conversationId: string;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    const result = await sendMessage(conversationId, message);
    setSending(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    setMessage("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 px-4 py-3 text-sm text-sf-gray-1 bg-white border border-sf-gray-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sf-blue-light focus:border-sf-blue-primary placeholder:text-sf-gray-4"
        disabled={sending}
      />
      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="px-6 py-3 bg-sf-blue-primary text-white rounded-lg text-sm font-medium hover:bg-sf-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
