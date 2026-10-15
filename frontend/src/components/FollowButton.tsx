"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/useSession";
import type { UserProfile } from "@/lib/domain/types";
import { useFollow } from "@/lib/hooks/useFollow";

interface FollowButtonProps {
  profile: UserProfile;
}

export function FollowButton({ profile }: FollowButtonProps) {
  const { user, isLoading } = useSession();
  const follow = useFollow();

  if (isLoading || user?.id === profile.id) {
    return null;
  }
  if (user === null) {
    return (
      <Link href="/login" className="text-sm font-medium text-brand-600 hover:underline">
        Zaloguj się, aby obserwować
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        aria-pressed={profile.followed_by_me}
        disabled={follow.isPending}
        onClick={() => follow.mutate(profile)}
        className={
          profile.followed_by_me
            ? "rounded-md border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            : "rounded-md bg-brand-600 px-4 py-1.5 text-sm text-white hover:bg-brand-700"
        }
      >
        {profile.followed_by_me ? "Przestań obserwować" : "Obserwuj"}
      </button>
      {follow.isError && (
        <span role="alert" className="text-xs text-accent-600">
          {follow.error.message}
        </span>
      )}
    </div>
  );
}
