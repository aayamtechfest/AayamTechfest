import crypto from "crypto";

const HMAC_ALGORITHM = "sha256";

export interface SSOPayload {
  adminId: string;
  adminEmail: string;
  adminName: string;
  exp: number;
}

export function generateSSOToken(admin: { id: string; email: string; name: string }, secret: string): string {
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured for SSO");
  }
  const payload: SSOPayload = {
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.name,
    exp: Date.now() + 60 * 1000, // 60 seconds expiration
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac(HMAC_ALGORITHM, secret);
  hmac.update(payloadStr);
  const signature = hmac.digest("base64url");
  return `${payloadStr}.${signature}`;
}

export function verifySSOToken(token: string, secret: string): Omit<SSOPayload, "exp"> | null {
  try {
    if (!secret || !token) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts;

    const hmac = crypto.createHmac(HMAC_ALGORITHM, secret);
    hmac.update(payloadStr);
    const expectedSignature = hmac.digest("base64url");
    if (signature !== expectedSignature) return null;

    const payload: SSOPayload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
    if (Date.now() > payload.exp) {
      console.warn("[SSO] Token has expired.");
      return null;
    }
    return {
      adminId: payload.adminId,
      adminEmail: payload.adminEmail,
      adminName: payload.adminName,
    };
  } catch (e) {
    console.error("[SSO] Failed to verify SSO token:", e);
    return null;
  }
}
