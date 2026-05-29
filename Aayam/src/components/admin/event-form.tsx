"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventFormData } from "@/schemas/event.schema";
import { slugify } from "@/lib/utils";
import { Loader2, ArrowLeft, Save, Sparkles, Upload, ImageIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface EventFormProps {
  initialData?: any; // Event from DB
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
  title: string;
  description: string;
}

export function EventForm({ initialData, onSubmit, title, description }: EventFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Helper to format Date to YYYY-MM-DD for date inputs
  const formatDateInput = (dateVal: any) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  // Helper to format Date to YYYY-MM-DDTHH:MM for datetime-local inputs
  const formatDateTimeInput = (dateVal: any) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          registrationFee: initialData.registrationFee ? Number(initialData.registrationFee) : 0,
          eventDate: formatDateInput(initialData.eventDate),
          lastRegistrationDate: formatDateTimeInput(initialData.lastRegistrationDate),
          problemReleaseTime: formatDateTimeInput(initialData.problemReleaseTime),
        }
      : {
          name: "",
          slug: "",
          shortDescription: "",
          description: "",
          rules: "",
          eligibility: "",
          format: "",
          participationType: "SOLO",
          minTeamSize: 1,
          maxTeamSize: 1,
          prizeDetails: "",
          venue: "",
          schedule: "",
          bannerUrl: "",
          registrationFee: 0,
          lastRegistrationDate: "",
          eventDate: "",
          problemSummary: "",
          problemStatement: "",
          problemReleaseTime: "",
          isPublished: false,
          isRegistrationOpen: true,
          isSubmissionOpen: false,
          sortOrder: 0,
        },
  });

  const nameValue = watch("name");
  const participationTypeValue = watch("participationType");

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue && !initialData) {
      setValue("slug", slugify(nameValue), { shouldValidate: true });
    }
  }, [nameValue, setValue, initialData]);

  const onFormSubmit = (data: any) => {
    setError(null);
    startTransition(async () => {
      const res = await onSubmit(data);
      if (!res.success) {
        setError(res.error || "An error occurred");
      }
    });
  };

  const onFormError = (errors: any) => {
    console.error("Validation errors:", errors);
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      toast.error("Please correct the errors in the form before saving.");
    }
  };

  const watchBanner = watch("bannerUrl");

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Banner must be under 5MB");
      return;
    }
    setBannerUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "aayam/events");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setValue("bannerUrl", data.url, { shouldValidate: true });
      toast.success("Banner uploaded successfully!");
    } catch {
      toast.error("Failed to upload banner.");
    } finally {
      setBannerUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <Link
          href="/admin/events"
          className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit, onFormError)} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
          <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2">
            Basic Information
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300">Event Name</label>
              <input
                type="text"
                {...register("name")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="Fast Coding Battle"
              />
              {errors.name?.message && <p className="mt-1 text-xs text-rose-400">{errors.name.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">URL Slug</label>
              <input
                type="text"
                {...register("slug")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="fast-coding-battle"
              />
              {errors.slug?.message && <p className="mt-1 text-xs text-rose-400">{errors.slug.message as string}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Short Description</label>
            <input
              type="text"
              {...register("shortDescription")}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="A brief one-line highlight of the competition."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Detailed Description</label>
            <textarea
              rows={5}
              {...register("description")}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="Describe the target audience, format, technologies, etc."
            />
            {errors.description?.message && <p className="mt-1 text-xs text-rose-400">{errors.description.message as string}</p>}
          </div>
        </div>

        {/* Format and Rules */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
          <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2">
            Guidelines & Structure
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300">Format</label>
              <input
                type="text"
                {...register("format")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="Online / Offline Hackathon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Venue</label>
              <input
                type="text"
                {...register("venue")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="Lab 3, CS Department"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300">Rules & Regulations</label>
              <textarea
                rows={4}
                {...register("rules")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="List down all rules..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Eligibility Criteria</label>
              <textarea
                rows={4}
                {...register("eligibility")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="Who can apply..."
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300">Prize Details</label>
              <textarea
                rows={3}
                {...register("prizeDetails")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="First Prize: ₹10,000, etc..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Schedule Details</label>
              <textarea
                rows={3}
                {...register("schedule")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="Day 1: Round 1, Day 2: Finals..."
              />
            </div>
          </div>
        </div>

        {/* Participation and Pricing */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
          <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2">
            Participation & Pricing
          </h3>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-300">Participation Type</label>
              <select
                {...register("participationType")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="SOLO">Solo (Individual)</option>
                <option value="TEAM">Team Only</option>
                <option value="BOTH">Solo or Team</option>
              </select>
            </div>

            {participationTypeValue !== "SOLO" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Min Team Size</label>
                  <input
                    type="number"
                    min={1}
                    {...register("minTeamSize", { valueAsNumber: true })}
                    className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Max Team Size</label>
                  <input
                    type="number"
                    min={1}
                    {...register("maxTeamSize", { valueAsNumber: true })}
                    className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300">Registration Fee (₹)</label>
              <input
                type="number"
                min={0}
                {...register("registrationFee", { valueAsNumber: true })}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="0 for Free"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Sort Order</label>
              <input
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300">Event Date</label>
              <input
                type="date"
                {...register("eventDate")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Registration Deadline</label>
              <input
                type="datetime-local"
                {...register("lastRegistrationDate")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Problem Statement Details */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
          <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2">
            Challenge / Problem Statement (Time-locked)
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300">Problem Summary (Public preview)</label>
              <textarea
                rows={3}
                {...register("problemSummary")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="A high level overview or instructions."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Problem Statement Release Time</label>
              <input
                type="datetime-local"
                {...register("problemReleaseTime")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Detailed Problem Statement (Markdown / Text)</label>
            <textarea
              rows={6}
              {...register("problemStatement")}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="This will be revealed only when release time passes..."
            />
          </div>
        </div>

        {/* Banner Upload */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
          <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2">
            Event Banner Image
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                {...register("bannerUrl")}
                className="flex-1 rounded-xl border border-white/10 bg-[#16213e] px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                placeholder="https://res.cloudinary.com/... or paste URL"
              />
              <label className="flex h-10 cursor-pointer items-center gap-2 justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 transition-all whitespace-nowrap">
                {bannerUploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="h-4 w-4" /> Upload Image</>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  disabled={bannerUploading}
                  className="hidden"
                />
              </label>
            </div>
            {watchBanner ? (
              <div className="relative">
                <img
                  src={watchBanner}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded-xl border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setValue("bannerUrl", "", { shouldValidate: true })}
                  className="absolute top-2 right-2 rounded-lg bg-black/60 border border-white/20 px-3 py-1 text-xs text-white hover:bg-red-500/20 hover:border-red-400 transition-all"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-white/10 text-gray-500 gap-2">
                <ImageIcon className="h-8 w-8" />
                <p className="text-xs">No banner uploaded yet</p>
              </div>
            )}
            <p className="text-xs text-gray-500">Recommended size: 1200×630px. Max 5MB.</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md flex flex-wrap gap-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("isPublished")}
              className="h-5 w-5 rounded border-white/10 bg-[#16213e] text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="block text-sm font-medium text-white">Publish Event</span>
              <span className="text-xs text-gray-500">Make it visible on the public page</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("isRegistrationOpen")}
              className="h-5 w-5 rounded border-white/10 bg-[#16213e] text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="block text-sm font-medium text-white">Registration Open</span>
              <span className="text-xs text-gray-500">Allow participants to register</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("isSubmissionOpen")}
              className="h-5 w-5 rounded border-white/10 bg-[#16213e] text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="block text-sm font-medium text-white">Submission Form Enabled</span>
              <span className="text-xs text-gray-500">Allow participants to submit project links</span>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/events"
            className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-gray-300 hover:text-white transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Competition</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
