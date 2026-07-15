"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { Role, UserStatus } from "@prisma/client";

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
