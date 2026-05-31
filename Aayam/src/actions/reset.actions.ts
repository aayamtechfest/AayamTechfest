"use server";

import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";
import { getPublicIdFromUrl } from "@/lib/utils";

export async function resetSystemAction(confirmationText: string): Promise<ActionResponse> {
  try {
    // Basic verification to prevent accidental destruction
    if (confirmationText !== "RESET SYSTEM FOR NEW YEAR") {
      return { success: false, error: "Incorrect confirmation text." };
    }

    console.log("Starting full system reset...");

    // 1. Delete and clean Cloudinary assets
    try {
      // Clean event banners
      const events = await prisma.event.findMany({ select: { bannerUrl: true } });
      for (const event of events) {
        if (event.bannerUrl && event.bannerUrl.includes("res.cloudinary.com")) {
          const publicId = getPublicIdFromUrl(event.bannerUrl);
          if (publicId) {
            try {
              await deleteFromCloudinary(publicId);
            } catch (e) {
              console.error(`Failed to delete event banner from Cloudinary during reset:`, e);
            }
          }
        }
      }

      // Clean registration payment screenshots
      const registrations = await prisma.registration.findMany({ select: { paymentScreenshot: true } });
      for (const reg of registrations) {
        if (reg.paymentScreenshot && reg.paymentScreenshot.includes("res.cloudinary.com")) {
          const publicId = getPublicIdFromUrl(reg.paymentScreenshot);
          if (publicId) {
            try {
              await deleteFromCloudinary(publicId);
            } catch (e) {
              console.error(`Failed to delete registration screenshot from Cloudinary during reset:`, e);
            }
          }
        }
      }

      // Clean custom settings images
      const currentSettings = await prisma.settings.findFirst();
      if (currentSettings) {
        const urlsToClean = [
          currentSettings.logoUrl,
          currentSettings.headerLogoUrl,
          currentSettings.footerLogoUrl,
          currentSettings.faviconUrl,
          currentSettings.paymentQrCodeUrl,
        ];
        for (const url of urlsToClean) {
          if (url && url.includes("res.cloudinary.com")) {
            const publicId = getPublicIdFromUrl(url);
            if (publicId) {
              try {
                await deleteFromCloudinary(publicId);
              } catch (e) {
                console.error(`Failed to delete settings image during reset:`, e);
              }
            }
          }
        }
      }

      // Clean media uploaded in the UploadedMedia table
      const mediaList = await prisma.uploadedMedia.findMany();
      console.log(`Found ${mediaList.length} media files to delete from Cloudinary.`);
      
      for (const media of mediaList) {
        if (media.publicId) {
          try {
            await deleteFromCloudinary(media.publicId);
            console.log(`Deleted Cloudinary asset: ${media.publicId}`);
          } catch (clErr) {
            console.error(`Failed to delete Cloudinary asset ${media.publicId}:`, clErr);
          }
        }
      }
    } catch (mediaErr) {
      console.error("Error reading or deleting uploaded media from Cloudinary during reset:", mediaErr);
    }

    // 2. Clear Database collections
    // Registrations & Team Members
    await prisma.registration.deleteMany();
    // Events & Form configurations
    await prisma.event.deleteMany();
    // Announcements
    await prisma.announcement.deleteMany();
    // Contact Messages
    await prisma.contactMessage.deleteMany();
    // Media Records
    await prisma.uploadedMedia.deleteMany();

    // 3. Reset Settings to default template values
    const settings = await prisma.settings.findFirst();
    const defaultData = {
      siteName: "AAYAM",
      eventTitle: "AAYAM - University Event Platform",
      tagline: "Innovate. Compete. Excel.",
      aboutContent: `<p>AAYAM is a premier university-level event and hackathon platform that brings together the brightest minds to compete in fast coding, quiz, UI/UX design, and problem-solving challenges.</p>
<p>Our mission is to foster innovation, collaboration, and technical excellence among students. Whether you're a beginner or an experienced developer, AAYAM offers competitions for every skill level.</p>
<p>Join us to showcase your talent, learn from peers, win prizes, and build lasting connections in the tech community.</p>`,
      logoUrl: "/LogoGIF.gif",
      headerLogoUrl: "/LogoGIF.gif",
      footerLogoUrl: "/LogoGIF.gif",
      faviconUrl: "/LogoGIF.gif",
      heroBannerUrl: "",
      paymentQrCodeUrl: "",
      paymentInstructions: "Scan the QR code below to make the payment. After payment, enter the UTR/Reference number and upload a screenshot of the payment confirmation.",
      contactEmail: process.env.SMTP_EMAIL || "aayamhackathon@gmail.com",
      contactPhone: "+91 9876543210",
      contactAddress: "University Campus, Main Road",
      socialLinks: {
        instagram: "https://instagram.com/aayam",
        twitter: "https://twitter.com/aayam",
        linkedin: "https://linkedin.com/company/aayam",
        youtube: "https://www.youtube.com/@AayamTechFest",
      },
      countdownDate: null,
      statParticipants: "1000+",
      statEvents: "20+",
      statColleges: "15+",
    };

    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: defaultData,
      });
    } else {
      await prisma.settings.create({
        data: defaultData,
      });
    }

    console.log("System reset completed successfully!");

    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath("/about");
    revalidatePath("/contact");
    revalidatePath("/admin/events");
    revalidatePath("/admin/registrations");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/messages");

    return { success: true };
  } catch (error) {
    console.error("System reset error:", error);
    return { success: false, error: "Failed to perform system reset. Please check database logs." };
  }
}
