"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/cart/actions";

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
}: OrderStatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    setLoading(true);
    setMessage("");

    const result = await updateOrderStatus(orderId, newStatus);

    if (result.error) {
      setMessage(result.error);
    } else {
      setStatus(newStatus);
      setMessage("Status updated successfully");
      router.refresh();
      setTimeout(() => setMessage(""), 3000);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-sf-gray-2">
        Update Order Status
      </label>
      <div className="flex gap-2 flex-wrap">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            disabled={loading || option.value === status}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              option.value === status
                ? "bg-sf-blue-primary text-white"
                : loading
                ? "bg-sf-gray-5 text-sf-gray-3 cursor-wait"
                : "bg-white border border-border-light text-sf-gray-2 hover:bg-sf-gray-6"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {message && (
        <p
          className={`text-sm ${
            message.includes("error") || message.includes("Error")
              ? "text-red-500"
              : "text-green-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
