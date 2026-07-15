"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { InvitationStatus, TeamRole } from "@prisma/client";

/**
 * Gets all teams where the current user is the leader and the target user is eligible to join.
 * Eligible means: target user is registered for the same event and NOT already in a team for that event.
 */
export async function getLeaderTeamsForTargetUser(targetUserId: string, currentUserId?: string) {
  const finalUserId = currentUserId || (await requireAuth()).id;

  // 1. Get all events where target user is registered and has NO team
  const targetRegistrations = await prisma.registration.findMany({
    where: {
      userId: targetUserId,
      teamId: null,
      deletedAt: null,
    },
    select: {
      eventId: true,
      event: { select: { title: true } },
    },
  });

  if (targetRegistrations.length === 0) {
    return [];
  }

  const targetEventIds = targetRegistrations.map((r) => r.eventId);

  // 2. Find all teams where the current user is the leader and the team is for one of those events
  const leaderTeams = await prisma.team.findMany({
    where: {
      leaderId: finalUserId,
      eventId: { in: targetEventIds },
      deletedAt: null,
    },
    include: {
      event: { select: { title: true } },
      members: { select: { userId: true } },
    },
  });

  // Filter out teams where target user is already invited or a member
  return leaderTeams.filter(
    (team) => !team.members.some((m) => m.userId === targetUserId)
  );
}

/**
 * Sends a direct team invitation to a target user.
 */
export async function sendTeamInvitation(teamId: string, targetUserId: string) {
  const user = await requireAuth();

  // 1. Validate team and leadership
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true, event: true },
  });

  if (!team || team.deletedAt) {
    throw new Error("Team not found");
  }

  if (team.leaderId !== user.id) {
    throw new Error("Only the team leader can send invitations");
  }

  // 2. Validate target user registration
  const targetReg = await prisma.registration.findUnique({
    where: { userId_eventId: { userId: targetUserId, eventId: team.eventId } },
  });

  if (!targetReg) {
    throw new Error("Target user is not registered for this event");
  }

  if (targetReg.teamId) {
    throw new Error("Target user is already in a team for this event");
  }

  // 3. Validate duplicate invitation
  const existingMapping = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUserId } },
  });

  if (existingMapping) {
    if (existingMapping.status === InvitationStatus.PENDING) {
      throw new Error("Invitation already sent and pending response");
    }
    if (existingMapping.status === InvitationStatus.ACCEPTED) {
      throw new Error("User is already a member of this team");
    }
  }

  // 4. Create PENDING TeamMember row in a transaction and send notification
  const result = await prisma.$transaction(async (tx) => {
    const invite = await tx.teamMember.upsert({
      where: { teamId_userId: { teamId, userId: targetUserId } },
      update: {
        role: TeamRole.MEMBER,
        status: InvitationStatus.PENDING,
        joinedAt: null,
      },
      create: {
        teamId,
        userId: targetUserId,
        role: TeamRole.MEMBER,
        status: InvitationStatus.PENDING,
      },
    });

    // Notify target user
    await tx.notification.create({
      data: {
        userId: targetUserId,
        title: "Team Invitation",
        message: `You have been invited to join team "${team.name}" for the event "${team.event.title}".`,
        type: "TEAM",
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "SEND_TEAM_INVITATION",
        details: { teamId, targetUserId, eventId: team.eventId },
      },
    });

    return invite;
  });

  revalidatePath("/dashboard/participant");
  return result;
}

/**
 * Gets all pending invitations for the current user.
 */
export async function getPendingInvitations(userId?: string) {
  const finalUserId = userId || (await requireAuth()).id;

  return await prisma.teamMember.findMany({
    where: {
      userId: finalUserId,
      status: InvitationStatus.PENDING,
      team: { deletedAt: null },
    },
    include: {
      team: {
        include: {
          event: { select: { title: true } },
          members: {
            where: { role: TeamRole.LEADER },
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });
}

/**
 * Responds to a team invitation.
 */
export async function respondToTeamInvitation(teamId: string, accept: boolean) {
  const user = await requireAuth();

  const invitation = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
    include: { team: { include: { event: true } } },
  });

  if (!invitation || invitation.status !== InvitationStatus.PENDING || invitation.team.deletedAt) {
    throw new Error("No pending invitation found");
  }

  const eventId = invitation.team.eventId;

  if (accept) {
    // 1. Verify user is not already on a team for this event
    const reg = await prisma.registration.findUnique({
      where: { userId_eventId: { userId: user.id, eventId } },
    });

    if (!reg) {
      throw new Error("You are not registered for this event");
    }

    if (reg.teamId) {
      throw new Error("You are already in a team for this event");
    }

    await prisma.$transaction(async (tx) => {
      // 2. Accept invitation
      await tx.teamMember.update({
        where: { teamId_userId: { teamId, userId: user.id } },
        data: {
          status: InvitationStatus.ACCEPTED,
          joinedAt: new Date(),
        },
      });

      // 3. Update registration
      await tx.registration.update({
        where: { id: reg.id },
        data: { teamId },
      });

      // 4. Reject all other pending invitations for this user on this event
      const otherInvites = await tx.teamMember.findMany({
        where: {
          userId: user.id,
          status: InvitationStatus.PENDING,
          team: { eventId },
        },
      });

      if (otherInvites.length > 0) {
        await tx.teamMember.updateMany({
          where: {
            id: { in: otherInvites.map((o) => o.id) },
          },
          data: {
            status: InvitationStatus.REJECTED,
          },
        });
      }

      // 5. Notify Team Leader
      await tx.notification.create({
        data: {
          userId: invitation.team.leaderId,
          title: "Invitation Accepted",
          message: `${user.name || user.email} has accepted your invitation and joined the team "${invitation.team.name}".`,
          type: "TEAM",
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "ACCEPT_TEAM_INVITATION",
          details: { teamId, eventId },
        },
      });
    });
  } else {
    // Decline invitation
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.update({
        where: { teamId_userId: { teamId, userId: user.id } },
        data: {
          status: InvitationStatus.REJECTED,
        },
      });

      // Notify leader
      await tx.notification.create({
        data: {
          userId: invitation.team.leaderId,
          title: "Invitation Declined",
          message: `${user.name || user.email} has declined your invitation to join the team "${invitation.team.name}".`,
          type: "TEAM",
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DECLINE_TEAM_INVITATION",
          details: { teamId, eventId },
        },
      });
    });
  }

  revalidatePath("/dashboard/participant");
  revalidatePath(`/dashboard/participant/teams`);
}
