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
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-4 text-sm text-gray-900">
          {request.email || request.user_id.slice(0, 8)}
        </td>
        <td className="px-4 py-4 text-sm font-semibold text-gray-900">{request.business_name}</td>
        <td className="px-4 py-4 text-sm text-gray-700">{request.business_category}</td>
        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">{request.business_address}</td>
        <td className="px-4 py-4">
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColor}`}>
            {request.status.toUpperCase()}
          </span>
        </td>
        <td className="px-4 py-4 text-sm text-gray-600">
          {new Date(request.created_at).toLocaleDateString()}
        </td>
        <td className="px-4 py-4">
          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Approve'
                )}
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                Reject
              </button>
            </div>
          )}
          {!isPending && <span className="text-sm text-gray-400">—</span>}
        </td>
      </tr>
      {message && (
        <tr>
          <td colSpan={7} className="px-4 py-3 bg-gray-50">
            <div className={`p-4 rounded-xl flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border-2 border-green-200'
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {message.type === 'success' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
