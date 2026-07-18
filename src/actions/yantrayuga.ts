"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { revalidatePath } from "next/cache";

// Guard helper: check event ownership
async function checkEventOwnership(eventId: string) {
  const user = await requireRole(["ORGANIZER", "SUPER_ADMIN"]);

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });

  if (!event || (event.organizerId !== user.id && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized to access this event");
  }

  return event;
}

// 1. Update active review phases and github submission toggle
export async function updateEventYantraYugaConfig(
  eventId: string,
  reviewPhases: any,
  githubSubmissionActive: boolean
) {
  await checkEventOwnership(eventId);

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      reviewPhases,
      githubSubmissionActive,
      version: { increment: 1 },
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return updated;
}

// 2. Commit and toggle shortlist lockdown status
export async function commitEventShortlist(
  eventId: string,
  shortlistedTeamIds: string[],
  commit: boolean
) {
  await checkEventOwnership(eventId);

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      shortlistCommitted: commit,
      shortlistedTeams: shortlistedTeamIds,
      version: { increment: 1 },
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return updated;
}

// Clear shortlisted lockdown
export async function clearEventShortlist(eventId: string) {
  await checkEventOwnership(eventId);

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      shortlistCommitted: false,
      shortlistedTeams: [],
      version: { increment: 1 },
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return updated;
}

// 3. Create a Mentor Group for an event
export async function createMentorGroup(
  eventId: string,
  name: string,
  coordinatorIds: string[]
) {
  await checkEventOwnership(eventId);

  // Use a transaction to create the group and assign coordinators
  const group = await prisma.$transaction(async (tx) => {
    // Check if group name already exists for this event
    const existing = await tx.mentorGroup.findFirst({
      where: { name, eventId },
    });

    if (existing) {
      throw new Error(`A mentor group named "${name}" already exists for this event`);
    }

    const newGroup = await tx.mentorGroup.create({
      data: {
        name,
        eventId,
      },
    });

    // Update coordinator users
    if (coordinatorIds.length > 0) {
      await tx.user.updateMany({
        where: {
          id: { in: coordinatorIds },
          role: "COORDINATOR",
        },
        data: {
          mentorGroupId: newGroup.id,
        },
      });
    }

    return newGroup;
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return group;
}

// Delete mentor group
export async function deleteMentorGroup(eventId: string, groupId: string) {
  await checkEventOwnership(eventId);

  const group = await prisma.mentorGroup.findUnique({
    where: { id: groupId },
  });

  if (!group || group.eventId !== eventId) {
    throw new Error("Mentor group not found");
  }

  await prisma.$transaction(async (tx) => {
    // Unassign coordinators from this group
    await tx.user.updateMany({
      where: { mentorGroupId: groupId },
      data: { mentorGroupId: null },
    });

    // Delete group
    await tx.mentorGroup.delete({
      where: { id: groupId },
    });
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return { success: true };
}

// 4. Assign coordinator to team
export async function assignCoordinatorToTeam(
  eventId: string,
  coordinatorId: string,
  teamIds: string[]
) {
  await checkEventOwnership(eventId);

  // Validate coordinator user
  const coord = await prisma.user.findFirst({
    where: { id: coordinatorId, role: "COORDINATOR", deletedAt: null },
  });

  if (!coord) {
    throw new Error("Coordinator user not found or not active");
  }

  // Update teams
  const updated = await prisma.team.updateMany({
    where: {
      id: { in: teamIds },
      eventId,
    },
    data: {
      coordinatorId,
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return updated;
}

// Unassign coordinator from team
export async function unassignCoordinatorFromTeam(
  eventId: string,
  teamId: string,
  coordinatorId: string
) {
  await checkEventOwnership(eventId);

  const updated = await prisma.team.updateMany({
    where: {
      id: teamId,
      eventId,
      coordinatorId,
    },
    data: {
      coordinatorId: null,
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return updated;
}

// 5. Update Online Round Config
export async function updateOnlineRoundConfig(
  eventId: string,
  hasOnlineRound: boolean,
  onlineRoundType: string,
  onlineRoundDeadline: Date | null,
  onlineCutoffScore: number
) {
  await checkEventOwnership(eventId);

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      hasOnlineRound,
      onlineRoundType,
      onlineRoundDeadline,
      onlineCutoffScore,
      version: { increment: 1 },
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  revalidatePath(`/dashboard/participant/events/${updated.slug}`);
  return updated;
}

// 6. Update Event Branding Config
export async function updateEventBrandingConfig(
  eventId: string,
  collegeName: string,
  organizedBy: string
) {
  await checkEventOwnership(eventId);

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      collegeName,
      organizedBy,
      version: { increment: 1 },
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  revalidatePath(`/dashboard/participant/events/${updated.slug}`);
  return updated;
}

// 7. Submit Online Round Details (Participant action)
export async function submitTeamOnlineRound(
  teamId: string,
  submissionUrl: string,
  submissionText: string
) {
  const user = await requireRole(["PARTICIPANT", "ORGANIZER", "SUPER_ADMIN"]);

  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id },
  });

  if (!member) {
    throw new Error("You are not a member of this team");
  }

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      onlineSubmissionUrl: submissionUrl,
      onlineSubmissionText: submissionText,
      onlineSubmissionStatus: "SUBMITTED",
      version: { increment: 1 },
    },
    include: { event: true }
  });

  revalidatePath(`/dashboard/participant/teams`);
  revalidatePath(`/dashboard/participant/events/${updated.event.slug}`);
  return updated;
}

// 8. Update Team Online Score (Organizer action)
export async function updateTeamOnlineScore(
  eventId: string,
  teamId: string,
  score: number
) {
  await checkEventOwnership(eventId);

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      onlineScore: score,
      onlineSubmissionStatus: "EVALUATED",
      version: { increment: 1 },
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return updated;
}

// 9. Update Team Table Number (Organizer action)
export async function updateTeamTableNumber(
  eventId: string,
  teamId: string,
  tableNo: string
) {
  await checkEventOwnership(eventId);

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      tableNo: tableNo || null,
      version: { increment: 1 },
    },
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);
  return updated;
}

