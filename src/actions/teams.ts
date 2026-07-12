"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { cryptoSecureToken } from "@/utils/token";
import { InvitationStatus, TeamRole } from "@prisma/client";

export async function createTeam(name: string, eventId: string) {
  const user = await requireAuth();

  // 1. Verify user is registered for the event
  const registration = await prisma.registration.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
  });

  if (!registration) {
    throw new Error("You must register for the event before creating a team");
  }

  if (registration.teamId) {
    throw new Error("You are already in a team for this event");
  }

  // 2. Check name uniqueness for this event
  const existingTeam = await prisma.team.findFirst({
    where: { name, eventId, deletedAt: null },
  });

  if (existingTeam) {
    throw new Error("Team name already taken for this event");
  }

  // 3. Create team & first member mapping (Leader) in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const inviteToken = cryptoSecureToken();
    const inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const team = await tx.team.create({
      data: {
        name,
        eventId,
        leaderId: user.id,
        inviteToken,
        inviteExpiresAt,
      },
    });

    await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: TeamRole.LEADER,
        status: InvitationStatus.ACCEPTED,
        joinedAt: new Date(),
      },
    });

    await tx.registration.update({
      where: { id: registration.id },
      data: { teamId: team.id },
    });

    return team;
  });

  revalidatePath(`/dashboard/participant/teams`);
  revalidatePath(`/events/${eventId}`);
  return result;
}

export async function joinTeam(inviteToken: string) {
  const user = await requireAuth();

  // 1. Validate invite token exists and is not expired
  const team = await prisma.team.findUnique({
    where: { inviteToken },
    include: { members: true },
  });

  if (!team || team.deletedAt) {
    throw new Error("Invalid invite link");
  }

  if (new Date() > team.inviteExpiresAt) {
    throw new Error("Invite link has expired");
  }

  // 2. Verify target user is registered for the same event
  const registration = await prisma.registration.findUnique({
    where: { userId_eventId: { userId: user.id, eventId: team.eventId } },
  });

  if (!registration) {
    throw new Error("You must register for the event before joining this team");
  }

  if (registration.teamId) {
    throw new Error("You are already in a team for this event");
  }

  // 3. Add to members in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const member = await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: TeamRole.MEMBER,
        status: InvitationStatus.ACCEPTED,
        joinedAt: new Date(),
      },
    });

    await tx.registration.update({
      where: { id: registration.id },
      data: { teamId: team.id },
    });

    return member;
  });

  // Notify team leader
  await prisma.notification.create({
    data: {
      userId: team.leaderId,
      title: "New Team Member",
      message: `${user.name || user.email} has joined your team "${team.name}".`,
      type: "TEAM",
    },
  });

  revalidatePath(`/dashboard/participant/teams`);
  return result;
}

export async function leaveTeam(teamId: string) {
  const user = await requireAuth();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team || team.deletedAt) {
    throw new Error("Team not found");
  }

  const userMember = team.members.find((m) => m.userId === user.id);
  if (!userMember) {
    throw new Error("You are not a member of this team");
  }

  if (userMember.role === TeamRole.LEADER) {
    // If leader is leaving
    if (team.members.length > 1) {
      throw new Error("You must transfer team ownership before leaving");
    }

    // Single member leader leaving: soft delete team
    await prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id: teamId },
        data: { deletedAt: new Date() },
      });
      await tx.registration.updateMany({
        where: { teamId },
        data: { teamId: null },
      });
    });
  } else {
    // Standard member leaving
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.delete({
        where: { teamId_userId: { teamId, userId: user.id } },
      });
      await tx.registration.updateMany({
        where: { userId: user.id, eventId: team.eventId },
        data: { teamId: null },
      });
    });

    // Notify leader
    await prisma.notification.create({
      data: {
        userId: team.leaderId,
        title: "Member Left Team",
        message: `${user.name || user.email} has left your team "${team.name}".`,
        type: "TEAM",
      },
    });
  }

  revalidatePath(`/dashboard/participant/teams`);
}

export async function removeMember(teamId: string, memberUserId: string) {
  const user = await requireAuth();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team || team.deletedAt) {
    throw new Error("Team not found");
  }

  if (team.leaderId !== user.id) {
    throw new Error("Only the team leader can remove members");
  }

  if (memberUserId === user.id) {
    throw new Error("You cannot remove yourself. Transfer ownership or leave instead.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.teamMember.delete({
      where: { teamId_userId: { teamId, userId: memberUserId } },
    });
    await tx.registration.updateMany({
      where: { userId: memberUserId, eventId: team.eventId },
      data: { teamId: null },
    });
  });

  // Notify member
  await prisma.notification.create({
    data: {
      userId: memberUserId,
      title: "Removed from Team",
      message: `You have been removed from the team "${team.name}".`,
      type: "TEAM",
    },
  });

  revalidatePath(`/dashboard/participant/teams`);
}

export async function transferOwnership(teamId: string, targetUserId: string) {
  const user = await requireAuth();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team || team.deletedAt) {
    throw new Error("Team not found");
  }

  if (team.leaderId !== user.id) {
    throw new Error("Only the team leader can transfer ownership");
  }

  const targetMember = team.members.find((m) => m.userId === targetUserId);
  if (!targetMember) {
    throw new Error("Target user is not a member of this team");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update team leader link
    await tx.team.update({
      where: { id: teamId },
      data: { leaderId: targetUserId },
    });

    // 2. Change roles in members table
    await tx.teamMember.update({
      where: { teamId_userId: { teamId, userId: user.id } },
      data: { role: TeamRole.MEMBER },
    });

    await tx.teamMember.update({
      where: { teamId_userId: { teamId, userId: targetUserId } },
      data: { role: TeamRole.LEADER },
    });
  });

  // Notify target user
  await prisma.notification.create({
    data: {
      userId: targetUserId,
      title: "Team Leadership Transferred",
      message: `You are now the team leader of "${team.name}".`,
      type: "TEAM",
    },
  });

  revalidatePath(`/dashboard/participant/teams`);
}

export async function getParticipantTeams() {
  const user = await requireAuth();

  return await prisma.teamMember.findMany({
    where: { userId: user.id, team: { deletedAt: null } },
    include: {
      team: {
        include: {
          event: true,
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          submissions: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
}

export async function getTeamByInviteToken(inviteToken: string) {
  // Checks authentication first
  await requireAuth();

  const team = await prisma.team.findUnique({
    where: { inviteToken, deletedAt: null },
    include: {
      event: {
        select: { title: true },
      },
      members: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  if (!team) {
    throw new Error("Invalid or expired invite token");
  }

  if (new Date() > team.inviteExpiresAt) {
    throw new Error("This invite token has expired");
  }

  // Find leader's name
  const leaderMember = team.members.find((m) => m.userId === team.leaderId);
  const leaderName = leaderMember?.user.name || leaderMember?.user.email || "Unknown Leader";

  return {
    id: team.id,
    name: team.name,
    eventTitle: team.event.title,
    leaderName,
    memberCount: team.members.length,
  };
}
