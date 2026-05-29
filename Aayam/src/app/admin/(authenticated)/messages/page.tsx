import { getContactMessages } from "@/actions/contact.actions";
import { serializePrisma } from "@/lib/utils";
import { MessagesListClient } from "./messages-list-client";

export const revalidate = 0; // Disable static caching for admin messages

export default async function AdminMessagesPage() {
  const rawMessages = await getContactMessages();
  const messages = serializePrisma(rawMessages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Contact Messages
        </h1>
        <p className="mt-1 text-gray-400">
          View and manage questions, feedback, and sponsorship requests submitted by public visitors.
        </p>
      </div>

      <MessagesListClient initialMessages={messages} />
    </div>
  );
}
