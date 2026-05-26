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

// ─── Registration Confirmation Email ─────────────────────────────────────────
export async function getRegistrationConfirmationEmail(params: {
  participantName: string;
  eventName: string;
  registrationId: string;
  paymentStatus: string;
  eventDate?: string;
}): Promise<{ subject: string; html: string }> {
  const { participantName, eventName, registrationId, paymentStatus, eventDate } = params;
  const branding = await getEmailBranding();
  const isPaid = paymentStatus === "APPROVED";

  const statusBg = isPaid ? "#064e3b" : "#78350f";
  const statusColor = isPaid ? "#6ee7b7" : "#fde68a";
  const statusLabel = isPaid ? "✅ APPROVED" : "⏳ PENDING";

  const contentHtml = `
    <h2 style="color:#e0e7ff;font-size:24px;font-weight:700;margin:0 0 6px;">
      Registration Confirmed! 🎉
    </h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;line-height:1.7;">
      Hi <strong style="color:#e0e7ff;">${participantName}</strong>, your registration has been successfully submitted. We're thrilled to have you on board!
    </p>

    <!-- Detail Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a1a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;margin-bottom:28px;">
      <tr>
        <td style="padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Registration ID</td>
              <td align="right" style="color:#a5b4fc;font-size:18px;font-weight:700;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${registrationId}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Event</td>
              <td align="right" style="color:#f1f5f9;font-size:14px;font-weight:600;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${eventName}</td>
            </tr>
            ${eventDate ? `
            <tr>
              <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Event Date</td>
              <td align="right" style="color:#f1f5f9;font-size:14px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">📅 ${eventDate}</td>
            </tr>` : ""}
            <tr>
              <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0;">Payment Status</td>
              <td align="right" style="padding:10px 0;">
                <span style="background:${statusBg};color:${statusColor};font-size:11px;font-weight:700;letter-spacing:1px;padding:5px 14px;border-radius:100px;text-transform:uppercase;">
                  ${statusLabel}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Info Box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.25);border-radius:12px;margin-bottom:28px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="color:#a5b4fc;font-size:13px;margin:0;line-height:1.7;">
            💡 <strong>Keep your Registration ID safe</strong> — you'll need it for check-in, payment verification, and any future correspondence about this event.
          </p>
        </td>
      </tr>
    </table>

    ${!isPaid ? `
    <!-- Payment Required Banner -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(217,119,6,0.1);border:1px solid rgba(217,119,6,0.3);border-radius:12px;margin-bottom:28px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="color:#fde68a;font-size:13px;margin:0;line-height:1.7;">
            ⚠️ <strong>Payment Pending</strong> — Please complete your payment and upload the screenshot. Your registration will be verified once payment is confirmed.
          </p>
        </td>
      </tr>
    </table>
    ` : ""}

    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0;">
      You will receive another email once your payment is verified. Stay tuned for event updates and announcements. See you at ${eventName}! 🚀
    </p>
  `;

  return {
    subject: `Registration Confirmed – ${eventName} | ${branding.siteName}`,
    html: wrapEmailTemplate(contentHtml, "#4F46E5", branding),
  };
}

// ─── Payment Approved Email ───────────────────────────────────────────────────
export async function getPaymentApprovedEmail(params: {
  participantName: string;
  eventName: string;
  registrationId: string;
}): Promise<{ subject: string; html: string }> {
  const { participantName, eventName, registrationId } = params;
  const branding = await getEmailBranding();

  const contentHtml = `
    <h2 style="color:#e0e7ff;font-size:24px;font-weight:700;margin:0 0 6px;">
      Payment Approved! ✅
    </h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;line-height:1.7;">
      Congratulations <strong style="color:#e0e7ff;">${participantName}</strong>! Your payment has been verified and your spot in <strong style="color:#6ee7b7;">${eventName}</strong> is officially confirmed. Get ready to compete! 🏆
    </p>

    <!-- Reg ID Spotlight -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,rgba(5,150,105,0.15),rgba(16,185,129,0.08));border:1px solid rgba(5,150,105,0.3);border-radius:16px;margin-bottom:28px;">
      <tr>
        <td style="padding:28px;text-align:center;">
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;">Your Registration ID</p>
          <p style="color:#6ee7b7;font-size:32px;font-weight:800;letter-spacing:4px;margin:0;font-family:monospace;">${registrationId}</p>
        </td>
      </tr>
    </table>

    <!-- Success Points -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td>
          <p style="color:#94a3b8;font-size:14px;margin:0 0 12px;font-weight:600;color:#d1fae5;">What's next?</p>
          <p style="color:#6b7280;font-size:13px;line-height:2;margin:0;">
            ✅ Keep your Registration ID for event check-in<br/>
            📅 Arrive 15 minutes early on the event day<br/>
            📱 Carry a valid college/university ID card<br/>
            🔔 Watch out for event day announcements<br/>
          </p>
        </td>
      </tr>
    </table>

    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0;">
      We're excited to see you at <strong style="color:#a5b4fc;">${eventName}</strong>. Good luck, and may the best coder win! 💻⚡
    </p>
  `;

  return {
    subject: `Payment Approved – ${eventName} | ${branding.siteName}`,
    html: wrapEmailTemplate(contentHtml, "#059669", branding),
  };
}

// ─── Payment Rejected Email ───────────────────────────────────────────────────
export async function getPaymentRejectedEmail(params: {
  participantName: string;
  eventName: string;
  registrationId: string;
  reason?: string;
}): Promise<{ subject: string; html: string }> {
  const { participantName, eventName, registrationId, reason } = params;
  const branding = await getEmailBranding();

  const contentHtml = `
    <h2 style="color:#e0e7ff;font-size:24px;font-weight:700;margin:0 0 6px;">
      Payment Not Verified ❌
    </h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;line-height:1.7;">
      Hi <strong style="color:#e0e7ff;">${participantName}</strong>, unfortunately we could not verify your payment for <strong style="color:#fca5a5;">${eventName}</strong>.
    </p>

    <!-- Registration ID -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.2);border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Registration ID</p>
          <p style="color:#fca5a5;font-size:18px;font-weight:700;letter-spacing:2px;margin:0;font-family:monospace;">${registrationId}</p>
        </td>
      </tr>
    </table>

    ${reason ? `
    <!-- Rejection Reason -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a0a0a;border:1px solid rgba(127,29,29,0.5);border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="color:#ef4444;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:700;">Reason for Rejection</p>
          <p style="color:#fca5a5;font-size:14px;margin:0;line-height:1.7;">${reason}</p>
        </td>
      </tr>
    </table>
    ` : ""}

    <!-- Next Steps -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(30,27,75,0.5);border:1px solid rgba(79,70,229,0.2);border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="color:#a5b4fc;font-size:13px;margin:0 0 8px;font-weight:600;">What can you do?</p>
          <p style="color:#6b7280;font-size:13px;line-height:2;margin:0;">
            🔄 Re-submit a clear, valid payment screenshot<br/>
            📧 Contact us at <a href="mailto:${branding.contactEmail}" style="color:#818cf8;text-decoration:none;">${branding.contactEmail}</a><br/>
            💬 Reach out with your Registration ID for assistance<br/>
          </p>
        </td>
      </tr>
    </table>

    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0;">
      We apologize for any inconvenience. Our team is here to help — please contact us and we'll resolve this as quickly as possible.
    </p>
  `;

  return {
    subject: `Payment Issue – ${eventName} | ${branding.siteName}`,
    html: wrapEmailTemplate(contentHtml, "#dc2626", branding),
  };
}

// ─── Submission Confirmation Email ─────────────────────────────────────────
export async function getSubmissionConfirmationEmail(params: {
  participantName: string;
  eventName: string;
  registrationId: string;
  projectLink: string;
}): Promise<{ subject: string; html: string }> {
  const { participantName, eventName, registrationId, projectLink } = params;
  const branding = await getEmailBranding();

  const contentHtml = `
    <h2 style="color:#e0e7ff;font-size:24px;font-weight:700;margin:0 0 6px;">
      Project Submitted Successfully! 🚀
    </h2>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;line-height:1.7;">
      Hi <strong style="color:#e0e7ff;">${participantName}</strong>, your project submission for <strong style="color:#a5b4fc;">${eventName}</strong> has been received. Our team will review your work!
    </p>

    <!-- Detail Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a1a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;margin-bottom:28px;">
      <tr>
        <td style="padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Registration ID</td>
              <td align="right" style="color:#a5b4fc;font-size:16px;font-weight:700;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${registrationId}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Event</td>
              <td align="right" style="color:#f1f5f9;font-size:14px;font-weight:600;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${eventName}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 0;">Project Link</td>
              <td align="right" style="padding:10px 0;">
                <a href="${projectLink}" target="_blank" style="color:#34d399;font-size:14px;font-weight:600;text-decoration:none;word-break:break-all;">
                  Open Project 🔗
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25);border-radius:12px;margin-bottom:28px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="color:#34d399;font-size:13px;margin:0;line-height:1.7;">
            Your project link has been securely saved. You can update your submission as long as the submission window remains open.
          </p>
        </td>
      </tr>
    </table>

    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0;">
      Thank you for participating in AAYAM. Best of luck with your evaluation! 🌟
    </p>
  `;

  return {
    subject: `Project Submitted: ${eventName} | ${branding.siteName}`,
    html: wrapEmailTemplate(contentHtml, "#0891b2", branding),
  };
}

// ─── Broadcast Email ──────────────────────────────────────────────────────────

/** Converts basic Markdown to HTML for broadcast emails */
export function markdownToHtml(markdown: string): string {
  // Process line by line for bullet lists
  const lines = markdown.split("\n");
  const processedLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[-*]\s(.+)$/);
    if (bulletMatch) {
      if (!inList) {
        processedLines.push('<ul style="padding-left:20px;margin:12px 0;">');
        inList = true;
      }
      processedLines.push(`<li style="color:#94a3b8;font-size:14px;line-height:1.8;margin-bottom:4px;">${bulletMatch[1]}</li>`);
    } else {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
      processedLines.push(line);
    }
  }
  if (inList) processedLines.push("</ul>");

  return processedLines
    .join("\n")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Undo escaping we did on our own HTML tags
    .replace(/&lt;(\/?(ul|li|h[123]|strong|em|a|br|p)[^&]*?)&gt;/g, "<$1>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e0e7ff;">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // H3
    .replace(/^### (.+)$/gm, '<h3 style="color:#a5b4fc;font-size:16px;font-weight:700;margin:20px 0 8px;">$1</h3>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 style="color:#c7d2fe;font-size:18px;font-weight:700;margin:24px 0 10px;">$1</h2>')
    // H1
    .replace(/^# (.+)$/gm, '<h1 style="color:#e0e7ff;font-size:22px;font-weight:800;margin:24px 0 12px;">$1</h1>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#818cf8;text-decoration:none;">$1</a>')
    // Paragraphs / newlines
    .replace(/\n\n/g, "</p><p style=\"color:#94a3b8;font-size:14px;line-height:1.8;margin:12px 0;\">")
    .replace(/\n/g, "<br/>")
    // Wrap in paragraph
    .replace(/^(.+)$/, (m) =>
      m.startsWith("<h") || m.startsWith("<ul") || m.startsWith("<li")
        ? m
        : `<p style="color:#94a3b8;font-size:14px;line-height:1.8;margin:12px 0;">${m}</p>`
    );
}

export async function getBroadcastEmailHtml(
  subject: string,
  bodyMarkdownOrHtml: string
): Promise<string> {
  const branding = await getEmailBranding();

  // Detect if the body is raw HTML (starts with a tag) or Markdown
  const isHtml = /^\s*</.test(bodyMarkdownOrHtml);
  const bodyHtml = isHtml ? bodyMarkdownOrHtml : markdownToHtml(bodyMarkdownOrHtml);

  const contentHtml = `
    <h2 style="color:#e0e7ff;font-size:22px;font-weight:700;margin:0 0 20px;">${subject}</h2>
    <div style="color:#94a3b8;font-size:14px;line-height:1.8;">
      ${bodyHtml}
    </div>
  `;

  return wrapEmailTemplate(contentHtml, "#4F46E5", branding);
}
