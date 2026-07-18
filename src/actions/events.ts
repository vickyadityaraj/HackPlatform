"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EventStatus } from "@prisma/client";

// Zod schemas for validation
const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  bannerUrl: z.string().url().optional().nullable().or(z.literal("")),
  paymentQrUrl: z.string().url().optional().nullable().or(z.literal("")),
  registrationStart: z.coerce.date(),
  registrationEnd: z.coerce.date(),
  eventStart: z.coerce.date(),
  eventEnd: z.coerce.date(),
  rules: z.string().optional().nullable(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).optional().nullable(),
  prizes: z.array(z.object({ rank: z.number(), title: z.string(), reward: z.string() })).optional().nullable(),
  sponsors: z.array(z.object({ name: z.string(), logo: z.string(), tier: z.string() })).optional().nullable(),
  schedule: z.array(z.object({ time: z.string(), title: z.string() })).optional().nullable(),
  timeline: z.array(z.object({ date: z.string(), label: z.string() })).optional().nullable(),
});

export async function createEvent(formData: z.infer<typeof eventSchema>) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);
  const validated = eventSchema.parse(formData);

  // Check if slug is unique
  const existing = await prisma.event.findUnique({
    where: { slug: validated.slug },
  });

  if (existing) {
    throw new Error("Slug already exists");
  }

  // Enforce one event per organizer rule
  if (user.role === "ORGANIZER") {
    const existingOrganizerEvent = await prisma.event.findFirst({
      where: { organizerId: user.id, deletedAt: null },
    });
    if (existingOrganizerEvent) {
      throw new Error("Organizers can only manage one event. You already have an active event.");
    }
  }

  const event = await prisma.event.create({
    data: {
      ...validated,
      bannerUrl: validated.bannerUrl || null,
      paymentQrUrl: validated.paymentQrUrl || null,
      faq: validated.faq ? (validated.faq as any) : null,
      prizes: validated.prizes ? (validated.prizes as any) : null,
      sponsors: validated.sponsors ? (validated.sponsors as any) : null,
      schedule: validated.schedule ? (validated.schedule as any) : null,
      timeline: validated.timeline ? (validated.timeline as any) : null,
      organizerId: user.id,
      status: EventStatus.DRAFT,
    },
  });

  revalidatePath("/dashboard/organizer");
  return event;
}

export async function updateEvent(
  id: string,
  formData: z.infer<typeof eventSchema> & { version: number }
) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);
  const validated = eventSchema.parse(formData);

  // Optimistic Locking & Ownership Check
  const currentEvent = await prisma.event.findFirst({
    where: { id, deletedAt: null },
  });

  if (!currentEvent) {
    throw new Error("Event not found");
  }

  if (currentEvent.organizerId !== user.id && user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized access to this event");
  }

  if (currentEvent.version !== formData.version) {
    throw new Error("Database state updated by another session. Please reload and retry.");
  }

  // Block editing if the event is already completed
  if (new Date() > new Date(currentEvent.eventEnd)) {
    throw new Error("Cannot edit event details after the event has completed.");
  }

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      ...validated,
      bannerUrl: validated.bannerUrl || null,
      paymentQrUrl: validated.paymentQrUrl || null,
      faq: validated.faq ? (validated.faq as any) : null,
      prizes: validated.prizes ? (validated.prizes as any) : null,
      sponsors: validated.sponsors ? (validated.sponsors as any) : null,
      schedule: validated.schedule ? (validated.schedule as any) : null,
      timeline: validated.timeline ? (validated.timeline as any) : null,
      version: { increment: 1 },
    },
  });

  revalidatePath("/dashboard/organizer");
  revalidatePath(`/dashboard/organizer/events/${id}`);
  revalidatePath(`/dashboard/participant/events/${updatedEvent.slug}`);
  return updatedEvent;
}

export async function publishEvent(id: string) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);

  const currentEvent = await prisma.event.findFirst({
    where: { id, deletedAt: null },
  });

  if (!currentEvent) {
    throw new Error("Event not found");
  }

  if (currentEvent.organizerId !== user.id && user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  // Super admins publish directly, Organizers submit for approval or publish based on platform policy
  // For standard workflow, organizers can publish their own events
  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      status: EventStatus.PUBLISHED,
      version: { increment: 1 },
    },
  });

  revalidatePath("/dashboard/organizer");
  revalidatePath(`/dashboard/participant/events/${updatedEvent.slug}`);
  return updatedEvent;
}

export async function deleteEvent(id: string) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);

  const currentEvent = await prisma.event.findFirst({
    where: { id, deletedAt: null },
  });

  if (!currentEvent) {
    throw new Error("Event not found");
  }

  if (currentEvent.organizerId !== user.id && user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  // Soft delete implementation
  const deletedEvent = await prisma.event.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      version: { increment: 1 },
    },
  });

  revalidatePath("/dashboard/organizer");
  return deletedEvent;
}

export async function getEventBySlug(slug: string) {
  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    include: {
      registrations: true,
      judges: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      announcements: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return event;
}

export async function getOrganizerEvents(userId?: string) {
  const finalUserId = userId || (await requireRole(["ORGANIZER"])).id;
  
  const events = await prisma.event.findMany({
    where: { organizerId: finalUserId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      registrations: true,
      teams: true,
    },
  });
  return events;
}

export async function saveCustomQuestions(eventId: string, questions: any[]) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });

  if (!event || (event.organizerId !== user.id && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      customQuestions: questions as any,
      version: { increment: 1 },
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return updatedEvent;
}

