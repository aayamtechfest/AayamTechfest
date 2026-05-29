import { getBroadcastRecipients } from "@/actions/broadcast.actions";
import { BroadcastEmailClient } from "./broadcast-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Broadcast Email | AAYAM Admin",
};

export default async function BroadcastEmailPage() {
  const recipients = await getBroadcastRecipients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Broadcast Email</h1>
        <p className="mt-1 text-sm text-gray-400">
          Compose and send an important email to selected registered participants.
        </p>
      </div>
      <BroadcastEmailClient initialRecipients={recipients} />
    </div>
  );
}
