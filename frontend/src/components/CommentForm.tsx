"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Field, INPUT_CLASS } from "@/components/Field";
import { useSession } from "@/lib/auth/useSession";
import { useAddComment } from "@/lib/hooks/useAddComment";
import { commentSchema, type CommentValues } from "@/lib/schemas/comment";

interface CommentFormProps {
  articleId: number;
}

export function CommentForm({ articleId }: CommentFormProps) {
  const { user, isLoading } = useSession();
  const addComment = useAddComment(articleId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentValues>({ resolver: zodResolver(commentSchema) });

  if (isLoading) {
    return null;
  }
  if (user === null) {
    return (
      <p className="text-sm text-slate-600">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Zaloguj się
        </Link>
        , aby dodać komentarz.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) =>
        addComment.mutate(values.body, { onSuccess: () => reset() }),
      )}
      noValidate
      className="flex flex-col gap-2"
    >
      <Field label="Twój komentarz" error={errors.body?.message}>
        <textarea rows={3} className={INPUT_CLASS} {...register("body")} />
      </Field>
      {addComment.isError && (
        <p role="alert" className="text-sm text-accent-600">
          {addComment.error.message}
        </p>
      )}
      <button
        type="submit"
        disabled={addComment.isPending}
        className="self-end rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {addComment.isPending ? "Wysyłanie…" : "Dodaj komentarz"}
      </button>
    </form>
  );
}
