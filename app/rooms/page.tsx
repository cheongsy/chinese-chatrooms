import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import RoomCard from "@/components/RoomCard";
import type { Room } from "@/lib/supabase/types";

export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .order("level")
    .returns<Room[]>();

  return (
    <>
      <NavBar />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Chatrooms</h1>
        <div className="grid gap-3">
          {(rooms ?? []).map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </main>
    </>
  );
}
