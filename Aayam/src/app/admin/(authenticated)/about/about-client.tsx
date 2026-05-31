"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  createAboutCard, 
  updateAboutCard, 
  deleteAboutCard 
} from "@/actions/about.actions";
import { updateSettingsField } from "@/actions/settings.actions";
import * as Icons from "lucide-react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  AlertCircle,
  HelpCircle,
  ArrowUpDown
} from "lucide-react";

// Predefined popular Lucide icons suitable for Pillars/Values
const POPULAR_ICONS = [
  { name: "Target", label: "🎯 Target / Goal" },
  { name: "Compass", label: "🧭 Compass / Vision" },
  { name: "Award", label: "🏆 Award / Values" },
  { name: "Trophy", label: "🥇 Trophy / Success" },
  { name: "Users", label: "👥 Users / Community" },
  { name: "Lightbulb", label: "💡 Lightbulb / Innovation" },
  { name: "Zap", label: "⚡ Zap / Energy" },
  { name: "Globe", label: "🌐 Globe / Reach" },
  { name: "Shield", label: "🛡️ Shield / Security" },
  { name: "Heart", label: "❤️ Heart / Passion" },
  { name: "Star", label: "⭐ Star / Quality" },
  { name: "Rocket", label: "🚀 Rocket / Growth" },
  { name: "BookOpen", label: "📖 Book / Learning" },
  { name: "Briefcase", label: "💼 Briefcase / Professional" },
  { name: "Code", label: "💻 Code / Development" },
  { name: "Cpu", label: "⚙️ CPU / Engineering" },
  { name: "Layers", label: "🥞 Layers / Stack" },
  { name: "Activity", label: "📈 Activity / Vitality" }
];

interface AboutCard {
  id: string;
  iconName: string;
  title: string;
  description: string;
  sortOrder: number;
}

interface AboutCardsClientProps {
  initialCards: AboutCard[];
  initialAboutContent: string;
}

export default function AboutCardsClient({ initialCards, initialAboutContent }: AboutCardsClientProps) {
  const [cards, setCards] = useState<AboutCard[]>(initialCards);
  const [aboutContent, setAboutContent] = useState(initialAboutContent);
  const [isSavingAboutContent, setIsSavingAboutContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form fields
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIconName, setNewIconName] = useState("Target");
  const [newSortOrder, setNewSortOrder] = useState(0);

  // Edit form fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIconName, setEditIconName] = useState("Target");
  const [editSortOrder, setEditSortOrder] = useState(0);

  // Dynamic Icon Renderer
  const renderIcon = (name: string, className = "h-5 w-5") => {
    const IconComponent = (Icons as any)[name];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return <HelpCircle className={className} />;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    const res = await createAboutCard({
      title: newTitle,
      description: newDescription,
      iconName: newIconName,
      sortOrder: Number(newSortOrder),
    });

    setIsSubmitting(false);
    if (res.success) {
      toast.success("About Card created successfully!");
      // Reload page state
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to create card.");
    }
  };

  const handleEditStart = (card: AboutCard) => {
    setEditingCardId(card.id);
    setEditTitle(card.title);
    setEditDescription(card.description);
    setEditIconName(card.iconName);
    setEditSortOrder(card.sortOrder);
    setShowAddForm(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCardId || !editTitle || !editDescription) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    const res = await updateAboutCard(editingCardId, {
      title: editTitle,
      description: editDescription,
      iconName: editIconName,
      sortOrder: Number(editSortOrder),
    });

    setIsSubmitting(false);
    if (res.success) {
      toast.success("About Card updated successfully!");
      // Reload page state
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to update card.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this About Card?")) return;

    const res = await deleteAboutCard(id);
    if (res.success) {
      toast.success("About Card deleted successfully!");
      setCards(cards.filter(c => c.id !== id));
    } else {
      toast.error(res.error || "Failed to delete card.");
    }
  };

  const handleSaveAboutContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAboutContent(true);
    const res = await updateSettingsField("aboutContent", aboutContent);
    setIsSavingAboutContent(false);
    if (res.success) {
      toast.success("Official Description updated successfully!");
    } else {
      toast.error(res.error || "Failed to update description.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Official Description Section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4 shadow-xl">
        <h2 className="text-lg font-bold text-white font-heading border-b border-white/5 pb-2">
          Official Description
        </h2>
        <p className="text-xs text-gray-400">
          Manage the main introductory text block shown on the public About page. Only a single block is permitted.
        </p>
        <form onSubmit={handleSaveAboutContent} className="space-y-4">
          <textarea
            value={aboutContent}
            onChange={(e) => setAboutContent(e.target.value)}
            placeholder="Official Description..."
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 resize-y"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingAboutContent}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSavingAboutContent ? "Saving..." : "Save Official Description"}
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
      {/* Cards List (Left 2 columns) */}
      <div className="lg:col-span-2 space-y-4">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-gray-400">
            <AlertCircle className="mx-auto h-8 w-8 text-indigo-400 mb-2" />
            <p className="font-semibold">No about cards found.</p>
            <p className="text-xs text-gray-500 mt-1">Create one using the form on the right.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <div 
                key={card.id}
                className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {renderIcon(card.iconName, "h-5 w-5")}
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {card.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] text-gray-400 font-mono">
                        <ArrowUpDown className="h-2.5 w-2.5" /> Order: {card.sortOrder}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEditStart(card)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                    title="Edit Card"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-all"
                    title="Delete Card"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Sidebar (Right 1 column) */}
      <div className="space-y-4">
        {/* Toggle Form Buttons */}
        {!showAddForm && !editingCardId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Add New Card
          </button>
        )}

        {/* Add Card Form */}
        {showAddForm && (
          <div className="rounded-2xl border border-indigo-500/20 bg-white/5 p-6 backdrop-blur-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-400" />
                New About Card
              </h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Our Mission"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Description *</label>
                <textarea
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Write a short description..."
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Icon *</label>
                  <select
                    value={newIconName}
                    onChange={(e) => setNewIconName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    {POPULAR_ICONS.map((ico) => (
                      <option key={ico.name} value={ico.name}>
                        {ico.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sort Order</label>
                  <input
                    type="number"
                    value={newSortOrder}
                    onChange={(e) => setNewSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Live Preview Inside Add Form */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Live Preview</span>
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {renderIcon(newIconName, "h-4.5 w-4.5")}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{newTitle || "Untitled"}</h4>
                    <p className="text-xs text-gray-500 leading-normal mt-1 break-words max-w-[200px]">
                      {newDescription || "Write a description to preview it here..."}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Card"}
              </button>
            </form>
          </div>
        )}

        {/* Edit Card Form */}
        {editingCardId && (
          <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-6 backdrop-blur-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-amber-400" />
                Edit About Card
              </h3>
              <button 
                onClick={() => setEditingCardId(null)}
                className="text-gray-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Our Mission"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Description *</label>
                <textarea
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Write a short description..."
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Icon *</label>
                  <select
                    value={editIconName}
                    onChange={(e) => setEditIconName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  >
                    {POPULAR_ICONS.map((ico) => (
                      <option key={ico.name} value={ico.name}>
                        {ico.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sort Order</label>
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Live Preview Inside Edit Form */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Live Preview</span>
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {renderIcon(editIconName, "h-4.5 w-4.5")}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{editTitle || "Untitled"}</h4>
                    <p className="text-xs text-gray-500 leading-normal mt-1 break-words max-w-[200px]">
                      {editDescription || "Write a description..."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-grow flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-500 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCardId(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
