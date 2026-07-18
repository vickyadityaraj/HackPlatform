"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function getPlatformSettings(skipAuth = false) {
  if (!skipAuth) {
    await requireRole(["SUPER_ADMIN"]);
  }

  let settings = await prisma.platformSettings.findUnique({
    where: { id: "single-settings-row" },
  });

  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: {
        id: "single-settings-row",
        platformFeePercentage: 0.0,
        maintenanceMode: false,
      },
    });
  }

  return settings;
}

export async function updatePlatformSettings(platformFeePercentage: number, maintenanceMode: boolean) {
  const admin = await requireRole(["SUPER_ADMIN"]);

  const settings = await prisma.platformSettings.update({
    where: { id: "single-settings-row" },
    data: {
      platformFeePercentage,
      maintenanceMode,
    },
  });

  // Log admin action
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "UPDATE_PLATFORM_SETTINGS",
      details: { platformFeePercentage, maintenanceMode },
    },
  });

  return settings;
}

export async function getUsersList(skipAuth = false) {
  if (!skipAuth) {
    await requireRole(["SUPER_ADMIN"]);
  }

  return await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      profile: true,
    },
  });
}

export async function updateUserStatus(userId: string, status: UserStatus, role: Role) {
  const admin = await requireRole(["SUPER_ADMIN"]);

  if (role === Role.ORGANIZER) {
    // Check if the user is already assigned to an event
    const assignedEvent = await prisma.event.findFirst({
      where: { organizerId: userId, deletedAt: null },
    });
    if (!assignedEvent) {
      throw new Error(
        "To make a user an Organizer, please assign them to an event using the 'Create/Assign Organizer' panel."
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      role,
      version: { increment: 1 },
    },
  });

  // Log admin action
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "UPDATE_USER_STATUS",
      details: { targetUserId: userId, status, role },
    },
  });

  revalidatePath("/dashboard/admin/users");
  return updatedUser;
}

export async function getAuditLogs(skipAuth = false) {
  if (!skipAuth) {
    await requireRole(["SUPER_ADMIN"]);
  }

  return await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function createOrAssignOrganizer(data: {
  mode: "create" | "assign";
  name?: string;
  email: string;
  password?: string;
  eventMode: "existing" | "new";
  eventId?: string;
  newEventData?: {
    title: string;
    slug: string;
    description: string;
    registrationStart: string;
    registrationEnd: string;
    eventStart: string;
    eventEnd: string;
  };
}) {
  const admin = await requireRole(["SUPER_ADMIN"]);
  const emailLower = data.email.toLowerCase().trim();

  let targetEventId = data.eventId || "";
  let eventTitle = "";

  // If eventMode is "new", validate the new event details
  if (data.eventMode === "new") {
    if (!data.newEventData) {
      throw new Error("Event details are required when creating a new event.");
    }
    // Check if slug is unique
    const existingEvent = await prisma.event.findUnique({
      where: { slug: data.newEventData.slug },
    });
    if (existingEvent) {
      throw new Error("Event URL slug already exists.");
    }
    eventTitle = data.newEventData.title;
  } else {
    if (!targetEventId) {
      throw new Error("Event must be selected.");
    }
    // Validate eventId
    const event = await prisma.event.findFirst({
      where: { id: targetEventId, deletedAt: null },
    });
    if (!event) {
      throw new Error("Target event not found.");
    }
    eventTitle = event.title;
  }

  let organizerId = "";

  if (data.mode === "create") {
    if (!data.name || !data.password) {
      throw new Error("Name and password are required to create a new organizer.");
    }
    if (data.password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      throw new Error("Email is already registered on the platform.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create new organizer and assign event (creating event if new) in a transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: emailLower,
          password: hashedPassword,
          role: Role.ORGANIZER,
          status: UserStatus.ACTIVE,
          emailVerified: new Date(),
        },
      });

      await tx.profile.create({
        data: {
          userId: user.id,
          skills: [],
          badges: [],
        },
      });

      let finalEventId = targetEventId;

      if (data.eventMode === "new" && data.newEventData) {
        const newEvent = await tx.event.create({
          data: {
            title: data.newEventData.title,
            slug: data.newEventData.slug,
            description: data.newEventData.description,
            registrationStart: new Date(data.newEventData.registrationStart),
            registrationEnd: new Date(data.newEventData.registrationEnd),
            eventStart: new Date(data.newEventData.eventStart),
            eventEnd: new Date(data.newEventData.eventEnd),
            organizerId: user.id,
            status: "DRAFT",
          },
        });
        finalEventId = newEvent.id;
      } else {
        // Update existing event
        await tx.event.update({
          where: { id: targetEventId },
          data: {
            organizerId: user.id,
            version: { increment: 1 },
          },
        });
      }

      return { userId: user.id, eventId: finalEventId };
    });

    organizerId = transactionResult.userId;
    targetEventId = transactionResult.eventId;
  } else {
    // Mode is assign (promote existing user)
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!existingUser) {
      throw new Error("User with this email not found.");
    }

    // Check if this user is already assigned to another event
    const otherEvent = await prisma.event.findFirst({
      where: { 
        organizerId: existingUser.id, 
        ...(data.eventMode === "existing" ? { NOT: { id: targetEventId } } : {}),
        deletedAt: null 
      },
    });
    if (otherEvent) {
      throw new Error(`This user is already an organizer for event: "${otherEvent.title}". An organizer can manage only one event.`);
    }

    // In a transaction, update user role to ORGANIZER and assign/create event
    const transactionResult = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          role: Role.ORGANIZER,
          version: { increment: 1 },
        },
      });

      let finalEventId = targetEventId;

      if (data.eventMode === "new" && data.newEventData) {
        const newEvent = await tx.event.create({
          data: {
            title: data.newEventData.title,
            slug: data.newEventData.slug,
            description: data.newEventData.description,
            registrationStart: new Date(data.newEventData.registrationStart),
            registrationEnd: new Date(data.newEventData.registrationEnd),
            eventStart: new Date(data.newEventData.eventStart),
            eventEnd: new Date(data.newEventData.eventEnd),
            organizerId: existingUser.id,
            status: "DRAFT",
          },
        });
        finalEventId = newEvent.id;
      } else {
        await tx.event.update({
          where: { id: targetEventId },
          data: {
            organizerId: existingUser.id,
            version: { increment: 1 },
          },
        });
      }

      return { eventId: finalEventId };
    });

    organizerId = existingUser.id;
    targetEventId = transactionResult.eventId;
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: data.mode === "create" ? "CREATE_ORGANIZER_ACCOUNT" : "ASSIGN_ORGANIZER_ROLE",
      details: {
        organizerEmail: emailLower,
        organizerId,
        eventId: targetEventId,
        eventTitle,
      },
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/organizer");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const admin = await requireRole(["SUPER_ADMIN"]);

  if (userId === admin.id) {
    throw new Error("You cannot delete your own admin account.");
  }

  const userToDelete = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!userToDelete) {
    throw new Error("User not found.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      version: { increment: 1 },
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "DELETE_USER",
      details: {
        deletedUserId: userId,
        deletedUserEmail: updatedUser.email,
        deletedUserName: updatedUser.name,
      },
    },
  });

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}
