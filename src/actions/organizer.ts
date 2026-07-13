"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";

export async function addJudge(eventId: string, email: string) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);

  // 1. Verify Event ownership
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });

  if (!event || (event.organizerId !== user.id && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized to assign judges to this event");
  }

  // 2. Find User by email
  let targetUser = await prisma.user.findUnique({
    where: { email },
  });

  // If user doesn't exist, we cannot assign them (they must sign up first)
  if (!targetUser) {
    throw new Error(`User with email "${email}" not found on the platform. Ask them to register first.`);
  }

  // 3. Assign/Upgrade user role to JUDGE if not already a JUDGE or ADMIN
  if (targetUser.role !== Role.JUDGE && targetUser.role !== Role.SUPER_ADMIN) {
    targetUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: Role.JUDGE },
    });
  }

  // 4. Create Judge mapping
  const mapping = await prisma.judge.upsert({
    where: {
      eventId_userId: { eventId, userId: targetUser.id },
    },
    update: {},
    create: {
      eventId,
      userId: targetUser.id,
    },
  });

  // Create notification for the new judge
  await prisma.notification.create({
    data: {
      userId: targetUser.id,
      title: "Assigned as Judge",
      message: `You have been assigned as a Judge for the event: "${event.title}".`,
      type: "EVENT",
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return mapping;
}

export async function removeJudge(eventId: string, judgeId: string) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });

  if (!event || (event.organizerId !== user.id && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const mapping = await prisma.judge.delete({
    where: { id: judgeId },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return mapping;
}

export async function createAnnouncement(
  eventId: string,
  title: string,
  content: string,
  targetAudience: string = "ALL"
) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });

  if (!event || (event.organizerId !== user.id && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const announcement = await prisma.announcement.create({
    data: {
      eventId,
      title,
      content,
      targetAudience,
    },
  });

  // Fetch target user IDs to create notifications
  const registrations = await prisma.registration.findMany({
    where: { eventId, deletedAt: null },
    select: { userId: true },
  });

  // Bulk create notifications (non-blocking)
  const notificationsData = registrations.map((reg) => ({
    userId: reg.userId,
    title: `Announcement: ${title}`,
    message: `New announcement in "${event.title}": ${content.substring(0, 100)}...`,
    type: "EVENT",
  }));

  if (notificationsData.length > 0) {
    await prisma.notification.createMany({
      data: notificationsData,
    });
  }

  revalidatePath(`/dashboard/participant/events/${event.slug}`);
  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return announcement;
}

export async function getEventRegistrations(eventId: string) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });

  if (!event || (event.organizerId !== user.id && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  return await prisma.registration.findMany({
    where: { eventId, deletedAt: null },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      team: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateRegistrationStatus(registrationId: string, status: string) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);

  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { event: true },
  });

  if (!reg || (reg.event.organizerId !== user.id && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const updatedReg = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status,
      version: { increment: 1 },
    },
  });

  // Notify participant
  await prisma.notification.create({
    data: {
      userId: reg.userId,
      title: "Registration Status Updated",
      message: `Your registration status for "${reg.event.title}" is now: ${status}.`,
      type: "EVENT",
    },
  });

  revalidatePath(`/dashboard/organizer/events/${reg.eventId}`);
  return updatedReg;
}

export async function getEventTeams(eventId: string) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });

  if (!event || (event.organizerId !== user.id && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  return await prisma.team.findMany({
    where: { eventId, deletedAt: null },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      submissions: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
