"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, type RegistrationFormData } from "@/schemas/registration.schema";
import { submitRegistration } from "@/actions/registration.actions";
import { toast } from "sonner";
import {
  User,
  Users,
  CreditCard,
  Plus,
  Trash2,
  Upload,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationFormClientProps {
  event: {
    slug: string;
    name: string;
    participationType: "SOLO" | "TEAM" | "BOTH";
    minTeamSize: number;
    maxTeamSize: number;
    registrationFee: any;
  };
  settings: {
    paymentQrCodeUrl?: string | null;
    paymentInstructions?: string | null;
  } | null;
}

export function RegistrationFormClient({ event, settings }: RegistrationFormClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const fee = event.registrationFee ? Number(event.registrationFee) : 0;
  const isPaidEvent = fee > 0;
  const isTeamRegistrationAllowed = event.participationType === "TEAM" || event.participationType === "BOTH";

  // State to track if user chose Team registration for BOTH type events
  const [regType, setRegType] = useState<"SOLO" | "TEAM">(
    event.participationType === "TEAM" ? "TEAM" : "SOLO"
  );

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors },
    watch,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      participantName: "",
      email: "",
      phone: "",
      collegeName: "",
      department: "",
      yearOrSemester: "",
      teamName: "",
      teamMembers: [],
      paymentReference: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "teamMembers",
  });

  // Calculate if Step 2 is active/needed
  const showTeamStep = isTeamRegistrationAllowed && regType === "TEAM";

  async function handleNext() {
    if (step === 1) {
      const isValid = await trigger([
        "participantName",
        "email",
        "phone",
        "collegeName",
        "department",
        "yearOrSemester",
      ]);
      if (!isValid) return;

      if (showTeamStep) {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2) {
      if (showTeamStep) {
        const teamName = watch("teamName");
        if (!teamName || teamName.trim() === "") {
          toast.error("Team name is required for team registration.");
          return;
        }
      }

      const isValid = await trigger(["teamName", "teamMembers"]);
      if (!isValid) return;

      // Validate team size constraints
      const members = watch("teamMembers") || [];
      const totalTeamSize = members.length + 1; // leader + members
      if (totalTeamSize < event.minTeamSize) {
        toast.error(`A minimum of ${event.minTeamSize} team members are required (including yourself).`);
        return;
      }
      if (totalTeamSize > event.maxTeamSize) {
        toast.error(`A maximum of ${event.maxTeamSize} team members are allowed.`);
        return;
      }

      setStep(3);
    }
  }

  function handleBack() {
    if (step === 3) {
      if (showTeamStep) {
        setStep(2);
      } else {
        setStep(1);
      }
    } else if (step === 2) {
      setStep(1);
    }
  }

  // Handle Screenshot file upload to Cloudinary API
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "aayam/payment-proofs");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setScreenshotUrl(data.url);
      toast.success("Payment proof uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload screenshot. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const onSubmit = (data: RegistrationFormData) => {
    if (isPaidEvent && !screenshotUrl) {
      toast.error("Please upload payment screenshot before submitting.");
      return;
    }

    startTransition(async () => {
      // If SOLO, force clear team fields just in case
      const submissionData = {
        ...data,
        teamName: showTeamStep ? data.teamName : undefined,
        teamMembers: showTeamStep ? data.teamMembers : undefined,
      };

      try {
        const result = await submitRegistration(
          event.slug,
          submissionData as any,
          isPaidEvent ? screenshotUrl : undefined
        );

        if (result.success && result.data?.registrationId) {
          toast.success("Registration submitted successfully!");
          router.push(`/registration-success?id=${result.data.registrationId}`);
        } else {
          toast.error(result.error || "Failed to submit registration.");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl sm:p-10">
      {/* Step Indicator */}
      <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-6">
        {[
          { num: 1, label: "Info", icon: User },
          ...(showTeamStep ? [{ num: 2, label: "Team", icon: Users }] : []),
          { num: 3, label: "Payment", icon: CreditCard },
        ].map((s, index, arr) => (
          <div key={s.num} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300",
                  step === s.num
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/35"
                    : step > s.num
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-white/5 border-white/10 text-gray-500"
                )}
              >
                {step > s.num ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium tracking-wide uppercase",
                  step === s.num ? "text-indigo-400" : "text-gray-500"
                )}
              >
                {s.label}
              </span>
            </div>
            {index < arr.length - 1 && (
              <div
                className={cn(
                  "mx-4 h-0.5 flex-1 rounded-full",
                  step > s.num ? "bg-emerald-500/30" : "bg-white/5"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-bold text-white">Participant Information</h2>

            {/* If BOTH, select SOLO or TEAM */}
            {event.participationType === "BOTH" && (
              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-black/20 p-2">
                <button
                  type="button"
                  onClick={() => setRegType("SOLO")}
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200",
                    regType === "SOLO"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <User className="h-4 w-4" />
                  <span>Register as Solo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegType("TEAM")}
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200",
                    regType === "TEAM"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span>Register as Team</span>
                </button>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-300">Full Name</label>
                <input
                  type="text"
                  {...register("participantName")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="John Doe"
                />
                {errors.participantName && (
                  <p className="mt-1 text-xs text-rose-400">{errors.participantName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Email Address</label>
                <input
                  type="email"
                  {...register("email")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Phone Number</label>
                <input
                  type="tel"
                  {...register("phone")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="9876543210"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-rose-400">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">College / University</label>
                <input
                  type="text"
                  {...register("collegeName")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="State Tech University"
                />
                {errors.collegeName && (
                  <p className="mt-1 text-xs text-rose-400">{errors.collegeName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Department</label>
                <input
                  type="text"
                  {...register("department")}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedYear(val);
                    setValue("yearOrSemester", val && selectedSemester ? `${val} Year / ${selectedSemester} Sem` : val ? `${val} Year` : selectedSemester ? `${selectedSemester} Sem` : "");
                  }}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="" className="bg-[#0f0f23]">Select Year</option>
                  <option value="1" className="bg-[#0f0f23]">1st Year</option>
                  <option value="2" className="bg-[#0f0f23]">2nd Year</option>
                  <option value="3" className="bg-[#0f0f23]">3rd Year</option>
                  <option value="4" className="bg-[#0f0f23]">4th Year</option>
                  <option value="5" className="bg-[#0f0f23]">5th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSemester(val);
                    setValue("yearOrSemester", selectedYear && val ? `${selectedYear} Year / ${val} Sem` : selectedYear ? `${selectedYear} Year` : val ? `${val} Sem` : "");
                  }}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="" className="bg-[#0f0f23]">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                    <option key={sem} value={sem} className="bg-[#0f0f23]">{sem}th Semester</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Team Details */}
        {step === 2 && showTeamStep && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-white">Team Details</h2>
              <span className="text-xs text-gray-400 font-medium">
                Size limit: {event.minTeamSize} - {event.maxTeamSize} (including Leader)
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Team Name</label>
              <input
                type="text"
                {...register("teamName")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="Ctrl Alt Defeat"
              />
              {errors.teamName && (
                <p className="mt-1 text-xs text-rose-400">{errors.teamName.message}</p>
              )}
            </div>

            {/* Dynamic fields for members */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">Add Team Members</h3>
                {fields.length + 1 < event.maxTeamSize && (
                  <button
                    type="button"
                    onClick={() =>
                      append({
                        name: "",
                        email: "",
                        phone: "",
                        collegeName: watch("collegeName") || "",
                      })
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Member
                  </button>
                )}
              </div>

              {fields.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No additional team members added yet.</p>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="relative rounded-2xl border border-white/5 bg-black/10 p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-bold text-indigo-400">Member #{idx + 2}</span>
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="text-gray-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            Name
                          </label>
                          <input
                            type="text"
                            {...register(`teamMembers.${idx}.name` as const)}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                            placeholder="Member Name"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            Email (Optional)
                          </label>
                          <input
                            type="email"
                            {...register(`teamMembers.${idx}.email` as const)}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                            placeholder="member@example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            Phone (Optional)
                          </label>
                          <input
                            type="tel"
                            {...register(`teamMembers.${idx}.phone` as const)}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                            placeholder="Phone number"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            College (Optional)
                          </label>
                          <input
                            type="text"
                            {...register(`teamMembers.${idx}.collegeName` as const)}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                            placeholder="College/Uni"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Payment & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-bold text-white">Payment & Finalize</h2>

            {/* Paid Event Details */}
            {isPaidEvent ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                  <div className="flex justify-between border-b border-indigo-500/20 pb-3 mb-3">
                    <span className="text-gray-300 text-sm font-semibold">Total Registration Fee</span>
                    <span className="font-heading text-lg font-bold text-indigo-400">₹{fee}</span>
                  </div>

                  {settings?.paymentInstructions && (
                    <div className="text-xs text-gray-400 whitespace-pre-line leading-relaxed mb-4">
                      {settings.paymentInstructions}
                    </div>
                  )}

                  {settings?.paymentQrCodeUrl && (
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={settings.paymentQrCodeUrl}
                        alt="QR Code"
                        className="rounded-xl border border-white/10 bg-white p-2 h-64 w-64 object-contain"
                      />
                      <span className="text-[10px] text-gray-500 mt-2">Scan QR Code to make payment</span>
                    </div>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Transaction ID / UTR / Reference Number
                    </label>
                    <input
                      type="text"
                      {...register("paymentReference")}
                      className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Transaction reference ID"
                    />
                    {errors.paymentReference && (
                      <p className="mt-1 text-xs text-rose-400">{errors.paymentReference.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Upload Payment Proof (Screenshot)
                    </label>
                    <div className="mt-2 relative">
                      {screenshotUrl ? (
                        <div className="relative rounded-xl border border-white/10 overflow-hidden bg-black/40 h-[100px] flex items-center justify-between p-3">
                          <img
                            src={screenshotUrl}
                            alt="Screenshot proof"
                            className="h-16 w-16 rounded-md object-cover border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => setScreenshotUrl("")}
                            className="text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-500/20 bg-rose-500/10 rounded-lg px-3 py-1"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-[100px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all">
                          <div className="flex flex-col items-center justify-center p-4 text-center">
                            {uploading ? (
                              <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                            ) : (
                              <Upload className="h-6 w-6 text-gray-400" />
                            )}
                            <span className="mt-2 text-xs font-semibold text-gray-400">
                              {uploading ? "Uploading file..." : "Choose Image (Max 5MB)"}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center text-emerald-400">
                <CheckCircle className="mx-auto h-10 w-10 mb-2" />
                <h4 className="font-semibold text-white">Free Competition</h4>
                <p className="mt-1 text-sm text-gray-400">
                  This event has no registration fee. Simply hit the submit button to finalize your registration.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300">Notes / Remarks (Optional)</label>
              <textarea
                rows={3}
                {...register("notes")}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="Any special requests or details we should know."
              />
            </div>
          </div>
        )}

        {/* Buttons Nav */}
        <div className="mt-8 flex justify-between pt-6 border-t border-white/5">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isPending}
              className="flex items-center gap-1 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex h-11 items-center gap-1 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending || uploading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                "Submit Registration"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
