import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  return (
    <>
      <NavBar />
      <main className="flex flex-col items-center p-6">
        <h1 className="text-2xl font-semibold mb-1">Account</h1>
        <p className="text-sm text-gray-600 mb-6">{userData.user.email}</p>
        <ChangePasswordForm />
      </main>
    </>
  );
}
