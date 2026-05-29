import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return formatDateIST(date);
}

export function formatDateTime(date: Date | string): string {
  return formatDateTimeIST(date);
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getPublicIdFromUrl(url: string | null | undefined): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    
    const pathAndVersion = parts[1];
    const pathParts = pathAndVersion.split("/");
    if (pathParts[0].startsWith("v") && !isNaN(Number(pathParts[0].substring(1)))) {
      pathParts.shift();
    }
    
    const pathWithoutVersion = pathParts.join("/");
    const dotIndex = pathWithoutVersion.lastIndexOf(".");
    if (dotIndex !== -1) {
      return pathWithoutVersion.substring(0, dotIndex);
    }
    return pathWithoutVersion;
  } catch (error) {
    console.error("Failed to parse publicId from URL:", url, error);
    return null;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function serializePrisma<T>(data: T): any {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map(serializePrisma);
  }

  if (typeof data === "object") {
    if (data instanceof Date) {
      return data;
    }
    if ("toNumber" in data && typeof (data as any).toNumber === "function") {
      return (data as any).toNumber();
    }
    const serialized: any = {};
    for (const key of Object.keys(data)) {
      serialized[key] = serializePrisma((data as any)[key]);
    }
    return serialized;
  }

  return data;
}

export function formatToISTInputString(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  
  // Calculate offset for UTC +5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffset);
  
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDateTimeIST(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateIST(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function parseToISTDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  let normalizedStr = dateStr;
  if (!dateStr.includes("Z") && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
    if (dateStr.length === 10) {
      normalizedStr = `${dateStr}T00:00:00+05:30`;
    } else {
      normalizedStr = `${dateStr}+05:30`;
    }
  }
  const d = new Date(normalizedStr);
  return isNaN(d.getTime()) ? null : d;
}

