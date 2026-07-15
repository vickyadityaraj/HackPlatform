"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  skills: z.array(z.string()).default([]),
  experience: z.string().optional().nullable(),
  resumeUrl: z.string().url().optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().optional().nullable().or(z.literal("")),
  linkedInUrl: z.string().url().optional().nullable().or(z.literal("")),
  portfolioUrl: z.string().url().optional().nullable().or(z.literal("")),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  college: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export async function getProfile(userId?: string) {
  const finalUserId = userId || (await requireAuth()).id;

  // Find or create profile record
  let profile = await prisma.profile.findUnique({
    where: { userId: finalUserId },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: finalUserId,
        skills: [],
        experience: "",
        bio: "",
        college: "",
        country: "",
      },
    });
  }

  return profile;
}

export async function updateProfile(formData: z.infer<typeof profileSchema> & { version: number }) {
  const user = await requireAuth();
  const validated = profileSchema.parse(formData);

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!currentProfile) {
    throw new Error("Profile not found");
  }

  if (currentProfile.version !== formData.version) {
    throw new Error("Database state updated by another session. Please reload and retry.");
  }

  const updatedProfile = await prisma.profile.update({
    where: { userId: user.id },
    data: {
      ...validated,
      resumeUrl: validated.resumeUrl || null,
      githubUrl: validated.githubUrl || null,
      linkedInUrl: validated.linkedInUrl || null,
      portfolioUrl: validated.portfolioUrl || null,
      avatarUrl: validated.avatarUrl || null,
      version: { increment: 1 },
    },
  });

  revalidatePath("/dashboard/participant/profile");
  return updatedProfile;
}

export async function getPublicProfiles(params: {
  search?: string;
  skills?: string[];
  experience?: string;
  country?: string;
  sortBy?: "newest" | "experience";
  page?: number;
  limit?: number;
}) {
  const {
    search = "",
    skills = [],
    experience = "",
    country = "",
    sortBy = "newest",
    page = 1,
    limit = 10,
  } = params;

  const skip = (page - 1) * limit;

  // Build prisma filter conditions
  const where: any = {
    // Only return profiles of active users
    user: {
      status: "ACTIVE",
      role: "PARTICIPANT",
    },
  };

  if (search) {
    where.OR = [
      { bio: { contains: search, mode: "insensitive" } },
      { college: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (skills.length > 0) {
    where.skills = { hasEvery: skills };
  }

  if (experience) {
    where.experience = experience;
  }

  if (country) {
    where.country = { equals: country, mode: "insensitive" };
  }

  const orderBy: any = {};
  if (sortBy === "newest") {
    orderBy.updatedAt = "desc";
  } else if (sortBy === "experience") {
    orderBy.experience = "desc";
  }

  const [profiles, total] = await prisma.$transaction([
    prisma.profile.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    }),
    prisma.profile.count({ where }),
  ]);

  return {
    profiles,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}
