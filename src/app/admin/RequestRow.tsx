"use client";

import { useState } from "react";
import { approveBusinessRequest, rejectBusinessRequest } from "./actions";

interface RequestRowProps {
  request: {
    id: string;
    user_id: string;
    business_name: string;
    business_category: string;
    business_address: string;
    status: string;
    created_at: string;
    email?: string;
  };
}

export default function RequestRow({ request }: RequestRowProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApprove = async () => {
    if (!confirm(`Approve business request for "${request.business_name}"?`)) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const result = await approveBusinessRequest(request.id);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.message) {
      setMessage({ type: 'success', text: result.message });
    }

    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!confirm(`Reject business request for "${request.business_name}"?`)) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const result = await rejectBusinessRequest(request.id);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.message) {
      setMessage({ type: 'success', text: result.message });
    }

    setIsProcessing(false);
  };

  const isPending = request.status === 'pending';
  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }[request.status] || 'bg-gray-100 text-gray-800';

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 text-sm">
        {request.email || request.user_id.slice(0, 8)}
      </td>
      <td className="px-4 py-3 text-sm font-medium">{request.business_name}</td>
      <td className="px-4 py-3 text-sm">{request.business_category}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{request.business_address}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
          {request.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {new Date(request.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        {isPending && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Approve'}
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject
            </button>
          </div>
        )}
        {!isPending && <span className="text-sm text-gray-400">—</span>}
      </td>
      {message && (
        <td colSpan={7} className="px-4 py-2">
          <div className={`p-2 rounded text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        </td>
      )}
    </tr>
  );
}
