"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex gap-4 items-center">
        <Link href="/rooms" className="font-semibold">
          聊天中文
        </Link>
        <Link href="/rooms" className="text-sm text-gray-600 hover:text-black">
          Rooms
        </Link>
        <Link href="/vocab" className="text-sm text-gray-600 hover:text-black">
          My Vocab
        </Link>
        <Link href="/messages" className="text-sm text-gray-600 hover:text-black">
          Messages
        </Link>
      </div>
      <div className="flex gap-4 items-center">
        <Link href="/account" className="text-sm text-gray-600 hover:text-black">
          Account
        </Link>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-black"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
