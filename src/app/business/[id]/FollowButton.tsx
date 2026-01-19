"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleFollow } from "@/app/business/actions";

interface FollowButtonProps {
  businessId: string;
  isLoggedIn: boolean;
  initialIsFollowing: boolean;
}

export default function FollowButton({ businessId, isLoggedIn, initialIsFollowing }: FollowButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const result = await toggleFollow(businessId);
    setLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.success) {
      setIsFollowing(result.isFollowing);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? "bg-sf-blue-dark text-white hover:bg-sf-blue-primary"
          : "bg-white text-sf-blue-primary hover:bg-sf-gray-7"
      }`}
    >
      <svg
        className="w-4 h-4"
        fill={isFollowing ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isFollowing ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        )}
      </svg>
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
