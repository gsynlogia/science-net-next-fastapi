"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/useSession";
import { useSummary } from "@/lib/hooks/useSummary";

interface ArticleSummaryProps {
  articleId: number;
}

export function ArticleSummary({ articleId }: ArticleSummaryProps) {
  const { user, isLoading } = useSession();
  const { text, status, error, start } = useSummary(articleId);

  if (isLoading) {
    return null;
  }
  if (user === null) {
    return (
      <p className="mt-4 text-sm text-slate-600">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Zaloguj się
        </Link>
        , aby skorzystać z asystenta AI.
      </p>
    );
  }

  return (
    <section aria-label="Asystent AI" className="mt-4 rounded-xl bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => void start()}
        disabled={status === "streaming"}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {status === "streaming" ? "Streszczam…" : "Streść (AI)"}
      </button>
      {text !== "" && (
        <p aria-live="polite" className="mt-3 whitespace-pre-line text-slate-700">
          {text}
        </p>
      )}
      {status === "done" && (
        <p className="mt-2 text-xs text-slate-500">
          Streszczenie wygenerował lokalny model AI — może zawierać błędy.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="mt-2 text-sm text-accent-600">
          {error}
        </p>
      )}
    </section>
  );
}
