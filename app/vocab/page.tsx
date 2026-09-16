import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import VocabList from "@/components/VocabList";
import type { SavedVocab } from "@/lib/supabase/types";

export default async function VocabPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { data: vocab } = await supabase
    .from("saved_vocab")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .returns<SavedVocab[]>();

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">My Vocab</h1>
        <VocabList initialVocab={vocab ?? []} />
      </main>
    </>
  );
}
