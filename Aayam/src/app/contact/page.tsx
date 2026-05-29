export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getSettings } from "@/actions/settings.actions";
import { ContactFormClient } from "./contact-form-client";
import { Mail, Phone, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | AAYAM Technical Festival Support",
  description: "Get in touch with the AAYAM technical festival team. Have any questions, feedback, or sponsorship proposals? Submit your messages here and we'll respond promptly.",
  keywords: ["Contact AAYAM", "Support", "University Fest contact", "Sponsorship queries", "AAYAM address"],
};

export const revalidate = 0; // Ensure fresh data on request

export default async function ContactPage() {
  const settings = await getSettings();
  const contactEmail = settings?.contactEmail || "contact@aayam.tech";
  const contactPhone = settings?.contactPhone || "+91 98765 43210";
  const contactAddress = settings?.contactAddress || "University Campus, Main Road";

  return (
    <div className="flex min-h-screen flex-col bg-[#070b19]">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        {/* Background gradient effects */}
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-down">
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="mt-4 text-lg text-gray-400">
              Have questions about registration, event schedules, or sponsorships? Reach out to us and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-12 max-w-6xl mx-auto">
            {/* Contact details */}
            <div className="lg:col-span-5 space-y-8 flex flex-col justify-between animate-slide-up [animation-delay:150ms]">
              <div className="space-y-6">
                <h3 className="font-heading text-2xl font-bold text-white">
                  Contact Information
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  We are here to support you. You can connect with our team through the following channels or send us a message directly via the form.
                </p>

                <div className="space-y-6 pt-4">
                  {/* Email */}
                  <div className="group flex items-start gap-4 transition-transform duration-200 hover:translate-x-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 transition-all duration-300 group-hover:bg-indigo-600/20 group-hover:border-indigo-400">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-300">Email us</p>
                      <a href={`mailto:${contactEmail}`} className="mt-1 block text-base text-white hover:text-indigo-400 transition-colors">
                        {contactEmail}
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="group flex items-start gap-4 transition-transform duration-200 hover:translate-x-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 transition-all duration-300 group-hover:bg-indigo-600/20 group-hover:border-indigo-400">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-300">Call us</p>
                      <a href={`tel:${contactPhone}`} className="mt-1 block text-base text-white hover:text-indigo-400 transition-colors">
                        {contactPhone}
                      </a>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="group flex items-start gap-4 transition-transform duration-200 hover:translate-x-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 transition-all duration-300 group-hover:bg-indigo-600/20 group-hover:border-indigo-400">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-300">Our Location</p>
                      <p className="mt-1 text-base text-white">
                        {contactAddress}
                      </p>
                    </div>
                  </div>

                  {/* YouTube Channel */}
                  {(() => {
                    const socialLinks = settings?.socialLinks as any;
                    const youtube = socialLinks?.youtube || "https://www.youtube.com/@AayamTechFest";
                    return (
                      <div className="group flex items-start gap-4 transition-transform duration-200 hover:translate-x-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 transition-all duration-300 group-hover:bg-rose-600/20 group-hover:border-rose-400">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-300">YouTube Channel</p>
                          <a href={youtube} target="_blank" rel="noopener noreferrer" className="mt-1 block text-base text-white hover:text-rose-400 transition-colors">
                            @AayamTechFest
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Decorative Card */}
              <div className="hidden lg:block rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5">
                <p className="text-xs text-indigo-400 font-semibold tracking-wider uppercase mb-1">Important Reminder</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Registrations for hackathons and coding events have strict deadlines. Please register early to secure your slot!
                </p>
              </div>
            </div>

            {/* Contact Form Client Wrapper */}
            <div className="lg:col-span-7 animate-slide-up [animation-delay:300ms]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl shadow-black/40 transition-all duration-300 hover:border-indigo-500/25 hover:shadow-indigo-500/5">
                <h3 className="font-heading text-2xl font-bold text-white mb-6">
                  Send a Message
                </h3>
                <ContactFormClient />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
