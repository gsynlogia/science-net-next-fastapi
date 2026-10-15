"use client";

import { Avatar } from "@/components/Avatar";
import { FeedResults } from "@/components/FeedResults";
import { FieldBadge } from "@/components/FieldBadge";
import { FollowButton } from "@/components/FollowButton";
import { formatDate } from "@/lib/format";
import { useFeed } from "@/lib/hooks/useFeed";
import { useUser } from "@/lib/hooks/useUser";

interface UserProfileViewProps {
  id: number;
}

export function UserProfileView({ id }: UserProfileViewProps) {
  const user = useUser(id);
  const feed = useFeed(null, "", id);

  if (user.isPending) {
    return <p className="text-slate-500">Ładowanie profilu…</p>;
  }
  if (user.isError) {
    return (
      <p role="alert" className="text-accent-600">
        {user.error.message}
      </p>
    );
  }
  const profile = user.data;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name} />
          <div>
            <h1 className="text-xl font-bold text-brand-700">{profile.full_name}</h1>
            <p className="text-sm text-slate-500">
              {profile.affiliation ?? "Brak afiliacji"} · Na portalu od{" "}
              {formatDate(profile.created_at)}
            </p>
          </div>
          <div className="ml-auto">
            <FollowButton profile={profile} />
          </div>
        </div>
        {profile.field && (
          <div className="mt-3">
            <FieldBadge field={profile.field} />
          </div>
        )}
        {profile.bio && <p className="mt-3 text-slate-700">{profile.bio}</p>}
        <p className="mt-3 text-sm text-slate-600">Obserwujący: {profile.followers_count}</p>
      </section>
      <section aria-labelledby="author-articles" className="flex flex-col gap-4">
        <h2 id="author-articles" className="text-lg font-semibold text-slate-800">
          Artykuły autora
        </h2>
        <FeedResults feed={feed} />
      </section>
    </div>
  );
}
