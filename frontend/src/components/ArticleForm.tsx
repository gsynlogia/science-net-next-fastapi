"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Field, INPUT_CLASS } from "@/components/Field";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth/useSession";
import { FIELD_NAMES, FIELD_SLUGS } from "@/lib/domain/fields";
import { queryKeys } from "@/lib/queryKeys";
import { articleSchema, toArticleInput, type ArticleFormValues } from "@/lib/schemas/article";

export function ArticleForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArticleFormValues>({ resolver: zodResolver(articleSchema) });
  const create = useMutation({
    mutationFn: (values: ArticleFormValues) => api.createArticle(toArticleInput(values)),
    onSuccess: async (article) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.articles });
      router.push(`/articles/${article.id}`);
    },
  });

  if (isLoading) {
    return <p className="text-slate-500">Ładowanie…</p>;
  }
  if (user === null) {
    return (
      <p className="text-slate-700">
        Aby opublikować artykuł,{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          zaloguj się
        </Link>
        .
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => create.mutate(values))}
      noValidate
      className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm"
    >
      <Field label="Tytuł" error={errors.title?.message}>
        <input type="text" className={INPUT_CLASS} {...register("title")} />
      </Field>
      <Field label="Streszczenie" error={errors.abstract?.message}>
        <textarea rows={6} className={INPUT_CLASS} {...register("abstract")} />
      </Field>
      <Field label="Dziedzina" error={errors.field?.message}>
        <select className={INPUT_CLASS} defaultValue="" {...register("field")}>
          <option value="">Wybierz dziedzinę…</option>
          {FIELD_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {FIELD_NAMES[slug]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Tagi (oddzielone przecinkami)" error={errors.tags_text?.message}>
        <input
          type="text"
          placeholder="np. grafy, algorytmy"
          className={INPUT_CLASS}
          {...register("tags_text")}
        />
      </Field>
      <Field label="Link do pełnego tekstu (opcjonalnie)" error={errors.full_text_url?.message}>
        <input
          type="url"
          placeholder="https://doi.org/…"
          className={INPUT_CLASS}
          {...register("full_text_url")}
        />
      </Field>
      {create.isError && (
        <p role="alert" className="text-sm text-accent-600">
          {create.error.message}
        </p>
      )}
      <button
        type="submit"
        disabled={create.isPending}
        className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {create.isPending ? "Publikowanie…" : "Opublikuj"}
      </button>
    </form>
  );
}
