import type { Metadata } from "next";
import { ArticleForm } from "@/components/ArticleForm";

export const metadata: Metadata = {
  title: "Nowy artykuł — Science Net",
};

export default function NewArticlePage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Nowy artykuł</h1>
      <ArticleForm />
    </main>
  );
}
