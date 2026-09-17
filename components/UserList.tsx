import Link from "next/link";
import type { Profile } from "@/lib/supabase/types";

export default function UserList({ people }: { people: Profile[] }) {
  if (people.length === 0) {
    return <p className="text-sm text-gray-500">No one else has joined yet.</p>;
  }

  return (
    <ul className="grid gap-2">
      {people.map((person) => (
        <li key={person.id}>
          <Link
            href={`/messages/${person.id}`}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-400 hover:shadow-sm transition"
          >
            <span className="font-medium">{person.username}</span>
            {person.is_ai && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                AI
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
