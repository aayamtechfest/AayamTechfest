"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitContactMessage } from "@/actions/contact.actions";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export function ContactFormClient() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(data: ContactFormData) {
    startTransition(async () => {
      try {
        const res = await submitContactMessage(data);
        if (res.success) {
          toast.success("Message sent successfully! We will get back to you soon.");
          reset();
        } else {
          toast.error(res.error || "Failed to send message.");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong. Please try again later.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-300">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="John Doe"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-300">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-semibold text-gray-300">
          Subject (Optional)
        </label>
        <input
          id="subject"
          type="text"
          {...register("subject")}
          className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="General Query / Sponsorship"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-300">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          {...register("message")}
          className="mt-2 block w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Tell us what you need help with..."
        />
        {errors.message && (
          <p className="mt-1 text-xs text-rose-400">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending Message...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Send Message</span>
          </>
        )}
      </button>
    </form>
  );
}
