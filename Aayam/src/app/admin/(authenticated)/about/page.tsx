import { getAboutCards } from "@/actions/about.actions";
import { getSettings } from "@/actions/settings.actions";
import AboutCardsClient from "./about-client";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const cards = await getAboutCards();
  const settings = await getSettings();

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
          About Page Details
        </h1>
        <p className="mt-1 text-gray-400">
          Manage the official description text and the 3-pillar feature cards (Mission, Vision, Values, etc.) shown on the public About page.
        </p>
      </div>

      <AboutCardsClient initialCards={cards} initialAboutContent={settings?.aboutContent || ""} />
    </div>
  );
}
