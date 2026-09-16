import Link from "next/link";
import type { Room } from "@/lib/supabase/types";

const LEVEL_COLORS: Record<Room["level"], string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

export default function RoomCard({ room }: { room: Room }) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="block rounded-lg border border-gray-200 p-4 hover:border-blue-400 hover:shadow-sm transition"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{room.name}</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_COLORS[room.level]}`}
        >
          {room.level}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{room.description}</p>
      <p className="text-xs text-gray-400 mt-2">Topic: {room.topic}</p>
    </Link>
  );
}
