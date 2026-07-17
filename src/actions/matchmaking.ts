"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";
import { sendContactRequestEmail } from "@/lib/mail";
import { revalidatePath } from "next/cache";

/**
 * Toggle user interest in a specific event.
 */
export async function toggleEventInterest(eventId: string) {
  const user = await requireAuth();

  const existing = await prisma.eventInterest.findUnique({
    where: {
      eventId_userId: { eventId, userId: user.id },
    },
  });

  if (existing) {
    // Withdraw interest
    await prisma.eventInterest.delete({
      where: {
        eventId_userId: { eventId, userId: user.id },
      },
    });
  } else {
    // Declare interest
    await prisma.eventInterest.create({
      data: {
        eventId,
        userId: user.id,
      },
    });
  }

  // Revalidate routes
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { slug: true }
  });
  if (event) {
    revalidatePath(`/dashboard/participant/events/${event.slug}`);
  }
}

/**
 * Send a team-up contact request email and create an in-app notification.
 */
export async function sendTeamUpContactRequest(
  eventId: string,
  targetUserId: string,
  message: string
) {
  const user = await requireAuth();

  if (!message || message.trim() === "") {
    throw new Error("Message cannot be empty");
  }

  const [fromUser, toUser, event] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { name: true, email: true },
    }),
    prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true },
    }),
  ]);

  if (!fromUser || !toUser || !event) {
    throw new Error("Required information not found");
  }

  // 1. Send the email using nodemailer
  try {
    await sendContactRequestEmail(
      toUser.email,
      toUser.name || "Developer",
      fromUser.name || "A Teammate",
      fromUser.email,
      event.title,
      message
    );
  } catch (err) {
    console.error("[Matchmaking Action] Failed to send contact email:", err);
    throw new Error("Failed to send contact email. Please verify platform SMTP setup.");
  }

  // 2. Create an in-app notification for the target user
  await prisma.notification.create({
    data: {
      userId: targetUserId,
      title: "Team Invitation Pitch",
      message: `${fromUser.name || "A user"} wants to team up with you for the event "${event.title}". They sent you an email pitch.`,
      type: "TEAM",
    },
  });
}

/**
 * Fetch all users interested in an event, along with their profiles.
 */
export async function getInterestedUsers(eventId: string) {
  const user = await requireAuth();

  // Fetch interests excluding current user
  const interests = await prisma.eventInterest.findMany({
    where: {
      eventId,
      userId: { not: user.id },
      user: { deletedAt: null }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          profile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return interests.map(i => i.user);
}
