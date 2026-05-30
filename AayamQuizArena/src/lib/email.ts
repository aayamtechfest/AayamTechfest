import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

// ─── Transporter (reused across calls) ───────────────────────────────────────
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // TLS via STARTTLS
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return _transporter;
}

// ─── Branding Config ──────────────────────────────────────────────────────────
export interface EmailBranding {
  logoUrl: string;
  siteName: string;
  contactEmail: string;
  footerText: string;
  youtubeUrl?: string;
}

export async function getEmailBranding(): Promise<EmailBranding> {
  try {
    const settings = await prisma.settings.findFirst();
    const socialLinks = settings?.socialLinks as any;
    return {
      logoUrl:
        settings?.logoUrl ||
        settings?.headerLogoUrl ||
        "https://aayam-warish.vercel.app/LogoGIF.gif",
      siteName: settings?.siteName || "AAYAM",
      contactEmail: settings?.contactEmail || process.env.SMTP_EMAIL || "aayamhackathon@gmail.com",
      footerText:
        settings?.footerText || "© 2026 AAYAM. All rights reserved.",
      youtubeUrl: socialLinks?.youtube || "https://www.youtube.com/@AayamTechFest",
    };
  } catch {
    return {
      logoUrl: "https://aayam-warish.vercel.app/LogoGIF.gif",
      siteName: "AAYAM",
      contactEmail: process.env.SMTP_EMAIL || "aayamhackathon@gmail.com",
      footerText: "© 2026 AAYAM. All rights reserved.",
      youtubeUrl: "https://www.youtube.com/@AayamTechFest",
    };
  }
}

// ─── Base Template Wrapper ─────────────────────────────────────────────────────
function wrapEmailTemplate(
  contentHtml: string,
  accentColor: string,
  branding: EmailBranding
): string {
  const gradientMap: Record<string, string> = {
    "#4F46E5": "linear-gradient(135deg,#4F46E5,#7C3AED)",
    "#059669": "linear-gradient(135deg,#059669,#10b981)",
    "#dc2626": "linear-gradient(135deg,#dc2626,#ef4444)",
    "#D97706": "linear-gradient(135deg,#D97706,#f59e0b)",
    "#0891b2": "linear-gradient(135deg,#0891b2,#06b6d4)",
  };
  const gradient = gradientMap[accentColor] || gradientMap["#4F46E5"];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${branding.siteName}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${gradient};border-radius:20px 20px 0 0;padding:40px 40px 36px;text-align:center;">
              ${
                branding.logoUrl
                  ? `<img src="${branding.logoUrl}" alt="${branding.siteName}" width="70" height="70" style="border-radius:16px;border:2px solid rgba(255,255,255,0.25);margin-bottom:16px;object-fit:cover;" /><br/>`
                  : ""
              }
              <h1 style="color:#ffffff;font-size:30px;font-weight:800;margin:0;letter-spacing:3px;text-transform:uppercase;">${branding.siteName}</h1>
              <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:6px 0 0;letter-spacing:1px;">University Event & Hackathon Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#13131f;border-left:1px solid rgba(255,255,255,0.08);border-right:1px solid rgba(255,255,255,0.08);padding:40px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d0d1a;border:1px solid rgba(255,255,255,0.06);border-top:1px solid rgba(255,255,255,0.08);border-radius:0 0 20px 20px;padding:28px 40px;text-align:center;">
              <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">
                ${branding.footerText}
              </p>
              <p style="color:#6b7280;font-size:11px;margin:0 0 8px;">
                Questions? Contact us at 
                <a href="mailto:${branding.contactEmail}" style="color:#818cf8;text-decoration:none;">${branding.contactEmail}</a>
              </p>
              ${branding.youtubeUrl ? `
              <p style="color:#94a3b8;font-size:11px;margin:8px 0 8px;">
                📺 Subscribe to our YouTube Channel for event videos & highlights: 
                <a href="${branding.youtubeUrl}" target="_blank" style="color:#ef4444;text-decoration:none;font-weight:600;">@AayamTechFest</a>
              </p>
              ` : ""}
              <p style="color:#374151;font-size:10px;margin:8px 0 0;">
                This is an automated message. Please do not reply directly to this email.
              </p>
              ${
                branding.logoUrl
                  ? `<img src="${branding.logoUrl}" alt="${branding.siteName}" width="32" height="32" style="border-radius:8px;margin-top:16px;opacity:0.5;" />`
                  : ""
              }
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Core Send Function ────────────────────────────────────────────────────────
interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const fromName = process.env.SMTP_FROM_NAME || "AAYAM Hackathon Team";
  const fromEmail = process.env.SMTP_EMAIL;

  if (!fromEmail) {
    console.warn("[Email] SMTP_EMAIL is not configured. Email not sent.");
    return;
  }

  const transporter = getTransporter();
  const recipients = Array.isArray(to) ? to.join(", ") : to;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: recipients,
    subject,
    html,
  });

  console.log(`[Email] ✅ Sent "${subject}" → ${recipients}`);
}

// ─── Live Quiz Session Start Email ──────────────────────────────────────────
export async function getQuizSessionLiveEmail(params: {
  participantName: string;
  sessionName: string;
  accessCode: string;
  registrationId: string;
  joinUrl: string;
}): Promise<{ subject: string; html: string }> {
  const { participantName, sessionName, accessCode, registrationId, joinUrl } = params;
  const branding = await getEmailBranding();

  const contentHtml = `
    <h2 style="color:#e0e7ff;font-size:24px;font-weight:700;margin:0 0 6px;">
      Live Quiz Arena Ready! 🚀
    </h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;line-height:1.7;">
      Hi <strong style="color:#e0e7ff;">${participantName}</strong>, the live session for <strong style="color:#818cf8;">${sessionName}</strong> is now live and waiting for you to join!
    </p>

    <!-- Session Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a1a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;margin-bottom:28px;">
      <tr>
        <td style="padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Registration ID</td>
              <td align="right" style="color:#a5b4fc;font-size:16px;font-weight:700;letter-spacing:1px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05); font-family:monospace;">${registrationId}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Session</td>
              <td align="right" style="color:#f1f5f9;font-size:14px;font-weight:600;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${sessionName}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0;">Access Code</td>
              <td align="right" style="color:#e0e7ff;font-size:22px;font-weight:800;letter-spacing:3px;padding:10px 0; font-family:monospace;">${accessCode}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;text-align:center;">
      <tr>
        <td align="center">
          <a href="${joinUrl}" target="_blank" style="background:#4F46E5;color:#ffffff;display:inline-block;padding:14px 30px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 10px 15px -3px rgba(79,70,229,0.3);">
            Join Live Lobby Directly 🚀
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.25);border-radius:12px;margin-bottom:28px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="color:#a5b4fc;font-size:12px;margin:0;line-height:1.7;">
            💡 <strong>Direct Join:</strong> The button above will automatically autofill your Registration ID and Access Code, taking you directly into the lobby room.
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Live Quiz Active: ${sessionName} | ${branding.siteName}`,
    html: wrapEmailTemplate(contentHtml, "#4F46E5", branding),
  };
}

// ─── Live Quiz Results Email ──────────────────────────────────────────────
export async function getQuizSessionResultEmail(params: {
  participantName: string;
  sessionName: string;
  score: number;
  leaderboardUrl: string;
}): Promise<{ subject: string; html: string }> {
  const { participantName, sessionName, score, leaderboardUrl } = params;
  const branding = await getEmailBranding();

  const contentHtml = `
    <h2 style="color:#e0e7ff;font-size:24px;font-weight:700;margin:0 0 6px;">
      Quiz Results Released! 🏆
    </h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;line-height:1.7;">
      Hi <strong style="color:#e0e7ff;">${participantName}</strong>, the final scores and leaderboard for the live quiz session <strong style="color:#a5b4fc;">${sessionName}</strong> are officially out!
    </p>

    <!-- Score Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,rgba(5,150,105,0.15),rgba(16,185,129,0.08));border:1px solid rgba(5,150,105,0.3);border-radius:16px;margin-bottom:28px;">
      <tr>
        <td style="padding:28px;text-align:center;">
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;">Your Total Score</p>
          <p style="color:#6ee7b7;font-size:42px;font-weight:800;margin:0;">${score} <span style="font-size:20px;font-weight:500;color:#6b7280;">pts</span></p>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;text-align:center;">
      <tr>
        <td align="center">
          <a href="${leaderboardUrl}" target="_blank" style="background:#059669;color:#ffffff;display:inline-block;padding:14px 30px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 10px 15px -3px rgba(5,150,105,0.3);">
            View Live Leaderboard 📊
          </a>
        </td>
      </tr>
    </table>

    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0;text-align:center;">
      Thank you for participating! Stay tuned for more competitions. 🚀
    </p>
  `;

  return {
    subject: `Quiz Results: ${sessionName} | ${branding.siteName}`,
    html: wrapEmailTemplate(contentHtml, "#059669", branding),
  };
}

// ─── Helper Functions to Trigger Emails ──────────────────────────────────────────

export async function sendSessionLiveEmails(sessionId: string): Promise<void> {
  try {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          select: {
            eventId: true,
          },
        },
      },
    });

    if (!session || !session.quiz.eventId) {
      console.warn(`[Email] Session ${sessionId} has no associated eventId. No emails sent.`);
      return;
    }

    // Query registrations for the event
    const registrations = await prisma.registration.findMany({
      where: {
        eventId: session.quiz.eventId,
        OR: [
          { paymentStatus: "APPROVED" },
          { status: "APPROVED" },
        ],
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";

    console.log(`[Email] Launching live session emails for session ${session.name} to ${registrations.length} registrations...`);

    for (const reg of registrations) {
      if (!reg.email) continue;
      
      const regCode = reg.registrationId || reg.id;
      const joinUrl = `${siteUrl}/join?regCode=${encodeURIComponent(regCode)}&accessCode=${encodeURIComponent(session.accessCode)}`;
      
      const { subject, html } = await getQuizSessionLiveEmail({
        participantName: reg.participantName,
        sessionName: session.name,
        accessCode: session.accessCode,
        registrationId: regCode,
        joinUrl,
      });

      sendEmail({ to: reg.email, subject, html }).catch((err) => {
        console.error(`[Email] Failed to send live email to ${reg.email}:`, err);
      });
    }
  } catch (error) {
    console.error("[Email] Error in sendSessionLiveEmails:", error);
  }
}

export async function sendSessionResultEmails(sessionId: string): Promise<void> {
  try {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: true,
        participants: {
          include: {
            registration: true,
          },
        },
      },
    });

    if (!session) {
      console.warn(`[Email] Session ${sessionId} not found for results email.`);
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";
    const leaderboardUrl = `${siteUrl}/leaderboard/${session.id}`;

    console.log(`[Email] Sending result emails for session ${session.name} to ${session.participants.length} participants...`);

    for (const participant of session.participants) {
      const email = participant.registration?.email;
      if (!email) continue;

      const { subject, html } = await getQuizSessionResultEmail({
        participantName: participant.displayName,
        sessionName: session.name,
        score: participant.totalScore,
        leaderboardUrl,
      });

      sendEmail({ to: email, subject, html }).catch((err) => {
        console.error(`[Email] Failed to send results email to ${email}:`, err);
      });
    }
  } catch (error) {
    console.error("[Email] Error in sendSessionResultEmails:", error);
  }
}
