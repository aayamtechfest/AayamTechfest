"use client";

import { useState, useTransition } from "react";
import { submitProjectSubmission } from "@/actions/submission.actions";
import { toast } from "sonner";
import { Send, Loader2, Link2, CheckCircle2, AlertCircle } from "lucide-react";

interface ProjectSubmissionFormProps {
  eventId: string;
}

export function ProjectSubmissionForm({ eventId }: ProjectSubmissionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [registrationId, setRegistrationId] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [email, setEmail] = useState("");
  const [projectLink, setProjectLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!registrationId || !participantName || !email || !projectLink) {
      toast.error("Please fill in all the fields.");
      return;
    }

    if (!projectLink.startsWith("http://") && !projectLink.startsWith("https://")) {
      setError("Project URL must start with http:// or https://");
      return;
    }

    startTransition(async () => {
      const res = await submitProjectSubmission({
        eventId,
        registrationId: registrationId.trim().toUpperCase(),
        participantName: participantName.trim(),
        email: email.trim(),
        projectLink: projectLink.trim(),
      });

      if (res.success) {
        setIsSuccess(true);
        toast.success("Project submitted successfully!");
      } else {
        setError(res.error || "An error occurred during submission.");
        toast.error(res.error || "Submission failed.");
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-fade-in space-y-4">
        <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center animate-bounce" style={{ animationDuration: "2s" }}>
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-white font-bold text-lg">Submission Received!</h3>
          <p className="text-sm text-gray-400 max-w-sm">
            Your project submission has been saved and is associated with registration <span className="font-mono text-indigo-400 font-semibold">{registrationId.toUpperCase()}</span>.
          </p>
        </div>
        <div className="p-3 bg-black/30 border border-white/5 rounded-xl font-mono text-xs text-gray-400 max-w-md w-full truncate">
          Project URL: <a href={projectLink} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{projectLink}</a>
        </div>
        <p className="text-xs text-gray-500 pt-2">
          An automated confirmation email has been sent to {email}. You can resubmit the form using the same details if you need to update your link.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="mt-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2 text-xs font-semibold text-white transition-all"
        >
          Submit Another Link / Edit Submission
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <div className="border-b border-white/5 pb-3">
        <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
          <Link2 className="h-5 w-5 text-indigo-400" />
          <span>Project Submission Form</span>
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Enter your registration credentials to submit your final project link.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Registration ID */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Registration ID</label>
          <input
            type="text"
            required
            value={registrationId}
            onChange={(e) => setRegistrationId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
            placeholder="e.g. FST-XXXXXX"
          />
        </div>

        {/* Participant / Leader Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Leader Name / Participant Name</label>
          <input
            type="text"
            required
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Name used during registration"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Email used during registration"
          />
        </div>

        {/* Project Link */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Project Submission URL</label>
          <input
            type="url"
            required
            value={projectLink}
            onChange={(e) => setProjectLink(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            placeholder="e.g. https://github.com/username/project"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] hover:shadow-indigo-500/35 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying and Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit Project</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
