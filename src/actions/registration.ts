"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";
import { revalidatePath } from "next/cache";

export async function registerForEvent(eventId: string, answers: any[]) {
  const user = await requireAuth();

  // 1. Get Event and check dates
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });

  if (!event || event.status !== "PUBLISHED") {
    throw new Error("Event not found or not open for registrations");
  }

  const now = new Date();
  if (now < event.registrationStart || now > event.registrationEnd) {
    throw new Error("Registration period is closed");
  }

  // 2. Check if already registered
  const existing = await prisma.registration.findUnique({
    where: {
      userId_eventId: { userId: user.id, eventId },
    },
  });

  if (existing) {
    throw new Error("You are already registered for this event");
  }

  // 3. Create registration
  const registration = await prisma.registration.create({
    data: {
      userId: user.id,
      eventId,
      answers: answers as any,
      status: "APPROVED", // Default auto-approve
    },
  });

  // Create registration audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "REGISTER_FOR_EVENT",
      details: { eventId, registrationId: registration.id },
    },
  });

  revalidatePath(`/events/${event.slug}`);
  revalidatePath(`/dashboard/participant/teams`);
  return registration;
}

export async function checkUserRegistration(eventId: string) {
  const sessionUser = await requireAuth().catch(() => null);
  if (!sessionUser) return null;

  return await prisma.registration.findUnique({
    where: {
      userId_eventId: { userId: sessionUser.id, eventId },
    },
    include: {
      team: true,
    },
  });
}
