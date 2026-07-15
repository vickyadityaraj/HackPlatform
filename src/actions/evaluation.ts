"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SubmissionStatus } from "@prisma/client";

const submissionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  projectUrl: z.string().url().optional().nullable().or(z.literal("")),
  repoUrl: z.string().url().optional().nullable().or(z.literal("")),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export async function submitProject(
  teamId: string,
  eventId: string,
  formData: z.infer<typeof submissionSchema>
) {
  const user = await requireAuth();
  const validated = submissionSchema.parse(formData);

  // 1. Verify Team and user ownership (must be team leader)
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team || team.deletedAt) {
    throw new Error("Team not found");
  }

  if (team.leaderId !== user.id) {
    throw new Error("Only the team leader can submit the project");
  }

  // 2. Create or update submission (upsert logic)
  const submission = await prisma.submission.create({
    data: {
      teamId,
      eventId,
      title: validated.title,
      description: validated.description,
      projectUrl: validated.projectUrl || null,
      repoUrl: validated.repoUrl || null,
      videoUrl: validated.videoUrl || null,
      status: SubmissionStatus.SUBMITTED,
    },
  });

  revalidatePath(`/dashboard/participant/events/${eventId}`);
  return submission;
}

export async function submitEvaluation(
  submissionId: string,
  scores: { criteriaName: string; points: number; maxPoints: number }[],
  feedback?: string
) {
  const user = await requireRole(["JUDGE", "SUPER_ADMIN"]);

  // 1. Get Judge mapping for the event
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  const judge = await prisma.judge.findFirst({
    where: {
      eventId: submission.eventId,
      userId: user.id,
    },
  });

  if (!judge && user.role !== "SUPER_ADMIN") {
    throw new Error("You are not assigned as a judge for this event");
  }

  // Use dummy judge ID for super admins who are not mapped as judges
  const finalJudgeId = judge ? judge.id : await getOrCreateAdminJudgeId(submission.eventId, user.id);

  // 2. Transact evaluation & score creations
  const result = await prisma.$transaction(async (tx) => {
    // Upsert the main evaluation header
    const evalHeader = await tx.evaluation.upsert({
      where: {
        submissionId_judgeId: { submissionId, judgeId: finalJudgeId },
      },
      update: {
        feedback,
      },
      create: {
        submissionId,
        judgeId: finalJudgeId,
        feedback,
      },
    });

    // Delete existing scores for replacement
    await tx.score.deleteMany({
      where: { evaluationId: evalHeader.id },
    });

    // Insert new scores
    const scoreCreations = scores.map((sc) => ({
      evaluationId: evalHeader.id,
      criteriaName: sc.criteriaName,
      points: sc.points,
      maxPoints: sc.maxPoints,
    }));

    await tx.score.createMany({
      data: scoreCreations,
    });

    // Update submission status
    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.EVALUATED,
        version: { increment: 1 },
      },
    });

    return evalHeader;
  });

  revalidatePath(`/dashboard/judge`);
  return result;
}

async function getOrCreateAdminJudgeId(eventId: string, userId: string): Promise<string> {
  const existing = await prisma.judge.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (existing) return existing.id;

  const created = await prisma.judge.create({
    data: { eventId, userId },
  });
  return created.id;
}

export async function getLeaderboard(eventId: string) {
  // Query all submissions for the event with scores
  const submissions = await prisma.submission.findMany({
    where: { eventId, deletedAt: null },
    include: {
      team: {
        select: { id: true, name: true },
      },
      evaluations: {
        include: {
          scores: true,
        },
      },
    },
  });

  // Calculate scores per submission
  const leaderboardData = submissions.map((sub) => {
    let totalScore = 0;
    let maxPossible = 0;
    let judgeCount = sub.evaluations.length;

    sub.evaluations.forEach((ev) => {
      ev.scores.forEach((sc) => {
        totalScore += sc.points;
        maxPossible += sc.maxPoints;
      });
    });

    const averagePoints = judgeCount > 0 ? totalScore / judgeCount : 0;
    const completionRate = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

    return {
      submissionId: sub.id,
      teamId: sub.team.id,
      teamName: sub.team.name,
      projectTitle: sub.title,
      judgeCount,
      totalScore,
      averageScore: parseFloat(averagePoints.toFixed(2)),
      percentage: parseFloat(completionRate.toFixed(1)),
    };
  });

  // Sort descending by average score
  return leaderboardData.sort((a, b) => b.averageScore - a.averageScore);
}

export async function getJudgeSubmissions(eventId: string, userId?: string) {
  const finalUserId = userId || (await requireRole(["JUDGE", "SUPER_ADMIN"])).id;

  // Fetch submissions that need evaluation
  return await prisma.submission.findMany({
    where: { eventId, deletedAt: null },
    include: {
      team: {
        select: { id: true, name: true },
      },
      evaluations: {
        where: {
          judge: {
            userId: finalUserId,
          },
        },
        include: {
          scores: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
