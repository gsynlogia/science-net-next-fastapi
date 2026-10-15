import { notFound } from "next/navigation";
import { UserProfileView } from "@/components/UserProfileView";

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId < 1) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <UserProfileView id={userId} />
    </main>
  );
}
