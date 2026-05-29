"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, type SettingsFormData } from "@/schemas/settings.schema";
import { updateSettings, resetCountdownDate } from "@/actions/settings.actions";
import { changePasswordAction } from "@/actions/auth.actions";
import { toast } from "sonner";
import { Loader2, Save, Info, Image, CreditCard, Mail, Upload, Lock, XCircle } from "lucide-react";
import { cn, formatToISTInputString } from "@/lib/utils";

interface SettingsFormProps {
  settings: any; // Settings object from DB
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [isPending, startTransition] = useTransition();
  const [uploads, setUploads] = useState<Record<string, boolean>>({});

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, startChangePassTransition] = useTransition();
  const [isResettingCountdown, startResetCountdownTransition] = useTransition();

  const handleResetCountdown = () => {
    startResetCountdownTransition(async () => {
      const res = await resetCountdownDate();
      if (res.success) {
        setValue("countdownDate", "");
        toast.success("Countdown timer cleared.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to reset countdown.");
      }
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    startChangePassTransition(async () => {
      try {
        const res = await changePasswordAction(currentPassword, newPassword);
        if (res.success) {
          toast.success("Password changed successfully!");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          toast.error(res.error || "Failed to change password.");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred. Please try again.");
      }
    });
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings
      ? {
          siteName: settings.siteName || "",
          eventTitle: settings.eventTitle || "",
          tagline: settings.tagline || "",
          aboutContent: settings.aboutContent || "",
          contactEmail: settings.contactEmail || "",
          contactPhone: settings.contactPhone || "",
          footerText: settings.footerText || "",
          paymentInstructions: settings.paymentInstructions || "",
          logoUrl: settings.logoUrl || "",
          headerLogoUrl: settings.headerLogoUrl || "",
          footerLogoUrl: settings.footerLogoUrl || "",
          faviconUrl: settings.faviconUrl || "",
          paymentQrCodeUrl: settings.paymentQrCodeUrl || "",
          contactAddress: settings.contactAddress || "",
          countdownDate: formatToISTInputString(settings.countdownDate),
          instagramUrl: settings.instagramUrl || "",
          githubUrl: settings.githubUrl || "",
          twitterUrl: settings.twitterUrl || "",
          linkedinUrl: settings.linkedinUrl || "",
          youtubeUrl: settings.youtubeUrl || "",
        }
      : {
          siteName: "AAYAM",
          eventTitle: "AAYAM 2026",
          tagline: "",
          aboutContent: "",
          contactEmail: "",
          contactPhone: "",
          footerText: "",
          paymentInstructions: "",
          logoUrl: "",
          headerLogoUrl: "",
          footerLogoUrl: "",
          faviconUrl: "",
          paymentQrCodeUrl: "",
          contactAddress: "University Campus, Main Road",
          countdownDate: "",
          instagramUrl: "",
          githubUrl: "",
          twitterUrl: "",
          linkedinUrl: "",
          youtubeUrl: "",
        },
  });

  const watchLogo = watch("logoUrl");
  const watchQrCode = watch("paymentQrCodeUrl");
  const watchHeaderLogo = watch("headerLogoUrl");
  const watchFooterLogo = watch("footerLogoUrl");
  const watchFavicon = watch("faviconUrl");

  // File Upload Helper
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof SettingsFormData, folder: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }

    setUploads((prev) => ({ ...prev, [fieldName]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setValue(fieldName, data.url, { shouldValidate: true });
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image.");
    } finally {
      setUploads((prev) => ({ ...prev, [fieldName]: false }));
    }
  }

  function onSubmit(data: SettingsFormData) {
    startTransition(async () => {
      try {
        const res = await updateSettings(data);
        if (res.success) {
          toast.success("Site settings updated successfully!");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update settings");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
      }
    });
  }

  const onFormError = (errors: any) => {
    console.error("Validation errors:", errors);
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      toast.error("Please correct the errors in the settings form before saving.");
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Info },
    { id: "branding", label: "Branding", icon: Image },
    { id: "payment", label: "Payment & QR", icon: CreditCard },
    { id: "contact", label: "Contact & Footer", icon: Mail },
    { id: "security", label: "Security & Pass", icon: Lock },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-200 focus:outline-none",
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-white"
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab !== "security" && (
        <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-6">
        {/* GENERAL TAB */}
        {activeTab === "general" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
            <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2">
              General Settings
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-300">Site Name</label>
                <input
                  type="text"
                  {...register("siteName")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="AAYAM Portal"
                />
                {errors.siteName && (
                  <p className="mt-1 text-xs text-rose-400">{errors.siteName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Event Title</label>
                <input
                  type="text"
                  {...register("eventTitle")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="AAYAM 2026"
                />
                {errors.eventTitle && (
                  <p className="mt-1 text-xs text-rose-400">{errors.eventTitle.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-300">Tagline</label>
                <input
                  type="text"
                  {...register("tagline")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Innovate. Compete. Excel."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Countdown Date (IST)</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="datetime-local"
                    {...register("countdownDate")}
                    className="flex-1 rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleResetCountdown}
                    disabled={isResettingCountdown}
                    title="Reset / Clear countdown"
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/20 hover:border-rose-500/30 disabled:opacity-50"
                  >
                    {isResettingCountdown ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reset
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">Countdown timer target date and time. Click Reset to clear it.</p>
              </div>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-300">About Content (Markdown / HTML)</label>
              <textarea
                rows={6}
                {...register("aboutContent")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Introduce the AAYAM festival..."
              />
            </div>
          </div>
        )}

        {/* BRANDING TAB */}
        {activeTab === "branding" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
            <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2">
              Branding Assets
            </h3>

            <div className="grid gap-6 sm:grid-cols-1">
              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Logo Image URL</label>
                <div className="mt-2 flex gap-3 max-w-md">
                  <input
                    type="text"
                    {...register("logoUrl")}
                    className="flex-1 rounded-xl border border-white/10 bg-[#16213e] px-4 py-2.5 text-xs text-white focus:outline-none"
                    placeholder="https://cloudinary.com/..."
                  />
                  <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 transition-all">
                    {uploads.logoUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "logoUrl", "aayam/logos")}
                      disabled={uploads.logoUrl}
                      className="hidden"
                    />
                  </label>
                </div>
                {watchLogo && (
                  <img
                    src={watchLogo}
                    alt="Logo preview"
                    className="mt-3 rounded-lg border border-white/10 h-12 object-contain bg-black/40 p-1"
                  />
                )}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {/* Header Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Header Logo URL (Optional)</label>
                <div className="mt-2 flex gap-3">
                  <input
                    type="text"
                    {...register("headerLogoUrl")}
                    className="flex-1 rounded-xl border border-white/10 bg-[#16213e] px-3 py-2.5 text-xs text-white focus:outline-none"
                    placeholder="Header Logo URL"
                  />
                  <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10 transition-all">
                    {uploads.headerLogoUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "headerLogoUrl", "aayam/logos")}
                      disabled={uploads.headerLogoUrl}
                      className="hidden"
                    />
                  </label>
                </div>
                {watchHeaderLogo && (
                  <img
                    src={watchHeaderLogo}
                    alt="Header logo preview"
                    className="mt-3 rounded-lg border border-white/10 h-10 object-contain bg-black/40 p-1"
                  />
                )}
              </div>

              {/* Footer Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Footer Logo URL (Optional)</label>
                <div className="mt-2 flex gap-3">
                  <input
                    type="text"
                    {...register("footerLogoUrl")}
                    className="flex-1 rounded-xl border border-white/10 bg-[#16213e] px-3 py-2.5 text-xs text-white focus:outline-none"
                    placeholder="Footer Logo URL"
                  />
                  <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10 transition-all">
                    {uploads.footerLogoUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "footerLogoUrl", "aayam/logos")}
                      disabled={uploads.footerLogoUrl}
                      className="hidden"
                    />
                  </label>
                </div>
                {watchFooterLogo && (
                  <img
                    src={watchFooterLogo}
                    alt="Footer logo preview"
                    className="mt-3 rounded-lg border border-white/10 h-10 object-contain bg-black/40 p-1"
                  />
                )}
              </div>

              {/* Favicon Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Favicon URL (Optional)</label>
                <div className="mt-2 flex gap-3">
                  <input
                    type="text"
                    {...register("faviconUrl")}
                    className="flex-1 rounded-xl border border-white/10 bg-[#16213e] px-3 py-2.5 text-xs text-white focus:outline-none"
                    placeholder="Favicon URL"
                  />
                  <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10 transition-all">
                    {uploads.faviconUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "faviconUrl", "aayam/logos")}
                      disabled={uploads.faviconUrl}
                      className="hidden"
                    />
                  </label>
                </div>
                {watchFavicon && (
                  <img
                    src={watchFavicon}
                    alt="Favicon preview"
                    className="mt-3 rounded-lg border border-white/10 h-10 w-10 object-contain bg-black/40 p-1"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT TAB */}
        {activeTab === "payment" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
            <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2">
              Payment Configurations
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-300">Payment QR Code Image</label>
              <div className="mt-2 flex gap-3 max-w-md">
                <input
                  type="text"
                  {...register("paymentQrCodeUrl")}
                  className="flex-1 rounded-xl border border-white/10 bg-[#16213e] px-4 py-2.5 text-xs text-white focus:outline-none"
                  placeholder="https://cloudinary.com/..."
                />
                <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 transition-all">
                  {uploads.paymentQrCodeUrl ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "paymentQrCodeUrl", "aayam/qr-codes")}
                    disabled={uploads.paymentQrCodeUrl}
                    className="hidden"
                  />
                </label>
              </div>
              {watchQrCode && (
                <img
                  src={watchQrCode}
                  alt="QR Code preview"
                  className="mt-4 rounded-xl border border-white/10 h-64 w-64 object-contain bg-white p-2"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Payment Instructions</label>
              <textarea
                rows={5}
                {...register("paymentInstructions")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Include UPI ID, account number, bank details, and step-by-step instructions..."
              />
            </div>
          </div>
        )}

        {/* CONTACT & FOOTER */}
        {activeTab === "contact" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
            <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2">
              Contact & Footers
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-300">Contact Email</label>
                <input
                  type="email"
                  {...register("contactEmail")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:outline-none"
                  placeholder="contact@university.edu"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-xs text-rose-400">{errors.contactEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Contact Phone</label>
                <input
                  type="text"
                  {...register("contactPhone")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Contact Address</label>
              <input
                type="text"
                {...register("contactAddress")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:outline-none"
                placeholder="University Campus, Main Road"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-sm font-medium text-gray-300">Instagram URL</label>
                <input
                  type="text"
                  {...register("instagramUrl")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:outline-none"
                  placeholder="https://instagram.com/aayam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">GitHub URL</label>
                <input
                  type="text"
                  {...register("githubUrl")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:outline-none"
                  placeholder="https://github.com/mdwarishansari/Aayam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Twitter URL</label>
                <input
                  type="text"
                  {...register("twitterUrl")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:outline-none"
                  placeholder="https://twitter.com/aayam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">LinkedIn URL</label>
                <input
                  type="text"
                  {...register("linkedinUrl")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:outline-none"
                  placeholder="https://linkedin.com/company/aayam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">YouTube URL</label>
                <input
                  type="text"
                  {...register("youtubeUrl")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:outline-none"
                  placeholder="https://www.youtube.com/@AayamTechFest"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Footer text / Copyright</label>
              <input
                type="text"
                {...register("footerText")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:outline-none"
                placeholder="© 2026 Technical Festival. All Rights Reserved."
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving settings...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
        </form>
      )}

      {activeTab === "security" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
          <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2">
            Security & Password Settings
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
                disabled={isChangingPass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
                disabled={isChangingPass}
              />
              <p className="mt-1 text-xs text-gray-400">Must be at least 8 characters long.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
                disabled={isChangingPass}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isChangingPass}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500"
              >
                {isChangingPass ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
