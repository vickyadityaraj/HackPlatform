import { prisma } from "@/lib/prisma";
import { submitProject } from "@/actions/evaluation";
import { sendTeamInvitation, respondToTeamInvitation } from "@/actions/invitations";
import { requireAuth, requireRole } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { InvitationStatus, Role, SubmissionStatus, TeamRole, UserStatus } from "@prisma/client";

// Mock guards
jest.mock("@/lib/guards", () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}));

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Server Actions Tests", () => {
  jest.setTimeout(45000);

  let mockUser: any;
  let mockEvent: any;
  let mockTeam: any;
  let mockTargetUser: any;

  beforeAll(async () => {
    // 1. Clean up potential old test data
    await prisma.teamMember.deleteMany({ where: { user: { email: { startsWith: "test-" } } } });
    await prisma.registration.deleteMany({ where: { user: { email: { startsWith: "test-" } } } });
    await prisma.submission.deleteMany({ where: { title: { startsWith: "Test Project" } } });
    await prisma.team.deleteMany({ where: { name: { startsWith: "Test Team" } } });
    await prisma.event.deleteMany({ where: { slug: { startsWith: "test-event-" } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: "test-" } } });

    // 2. Create users
    mockUser = await prisma.user.create({
      data: {
        email: `test-leader-${Date.now()}@example.com`,
        name: "Test Leader",
        role: Role.PARTICIPANT,
        status: UserStatus.ACTIVE,
      },
    });

    mockTargetUser = await prisma.user.create({
      data: {
        email: `test-member-${Date.now()}@example.com`,
        name: "Test Member",
        role: Role.PARTICIPANT,
        status: UserStatus.ACTIVE,
      },
    });

    // 3. Create Event
    mockEvent = await prisma.event.create({
      data: {
        title: "Test Hackathon Event",
        slug: `test-event-${Date.now()}`,
        description: "This is a test event for running action assertions.",
        registrationStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
        registrationEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
        eventStart: new Date(),
        eventEnd: new Date(Date.now() + 48 * 60 * 60 * 1000),
        organizerId: mockUser.id,
        status: "PUBLISHED",
      },
    });

    // 4. Register both users for the event
    await prisma.registration.create({
      data: {
        userId: mockUser.id,
        eventId: mockEvent.id,
        status: "APPROVED",
      },
    });

    await prisma.registration.create({
      data: {
        userId: mockTargetUser.id,
        eventId: mockEvent.id,
        status: "APPROVED",
      },
    });

    // 5. Create Team where mockUser is leader
    mockTeam = await prisma.team.create({
      data: {
        name: `Test Team-${Date.now()}`,
        eventId: mockEvent.id,
        leaderId: mockUser.id,
        inviteToken: `token-${Date.now()}`,
        inviteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await prisma.teamMember.create({
      data: {
        teamId: mockTeam.id,
        userId: mockUser.id,
        role: TeamRole.LEADER,
        status: InvitationStatus.ACCEPTED,
        joinedAt: new Date(),
      },
    });

    await prisma.registration.update({
      where: { userId_eventId: { userId: mockUser.id, eventId: mockEvent.id } },
      data: { teamId: mockTeam.id },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.teamMember.deleteMany({ where: { user: { email: { startsWith: "test-" } } } });
    await prisma.registration.deleteMany({ where: { user: { email: { startsWith: "test-" } } } });
    await prisma.submission.deleteMany({ where: { title: { startsWith: "Test Project" } } });
    await prisma.team.deleteMany({ where: { name: { startsWith: "Test Team" } } });
    await prisma.event.deleteMany({ where: { slug: { startsWith: "test-event-" } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: "test-" } } });
  });

  describe("Project Submission Flow", () => {
    it("should allow a team leader to submit a project", async () => {
      (requireAuth as jest.Mock).mockResolvedValue(mockUser);

      const submission = await submitProject(mockTeam.id, mockEvent.id, {
        title: "Test Project Name",
        description: "This is a detailed description of the project being submitted.",
        projectUrl: "https://demo.example.com",
        repoUrl: "https://github.com/test/repo",
      });

      expect(submission).toBeDefined();
      expect(submission.title).toBe("Test Project Name");
      expect(submission.status).toBe(SubmissionStatus.SUBMITTED);

      // Verify db state
      const dbSub = await prisma.submission.findUnique({
        where: { id: submission.id },
      });
      expect(dbSub).toBeDefined();
      expect(dbSub?.teamId).toBe(mockTeam.id);
    });

    it("should block a non-leader or other user from submitting project", async () => {
      (requireAuth as jest.Mock).mockResolvedValue(mockTargetUser);

      await expect(
        submitProject(mockTeam.id, mockEvent.id, {
          title: "Intruder Title",
          description: "This submission should fail because user is not team leader.",
        })
      ).rejects.toThrow("Only the team leader can submit the project");
    });
  });

  describe("Team Invitation Flow", () => {
    it("should allow team leader to invite a registered developer", async () => {
      (requireAuth as jest.Mock).mockResolvedValue(mockUser);

      const invite = await sendTeamInvitation(mockTeam.id, mockTargetUser.id);
      expect(invite).toBeDefined();
      expect(invite.status).toBe(InvitationStatus.PENDING);

      // Verify notification created
      const notif = await prisma.notification.findFirst({
        where: { userId: mockTargetUser.id, type: "TEAM" },
      });
      expect(notif).toBeDefined();
      expect(notif?.message).toContain(mockTeam.name);
    });

    it("should block duplicate invitations", async () => {
      (requireAuth as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        sendTeamInvitation(mockTeam.id, mockTargetUser.id)
      ).rejects.toThrow("Invitation already sent and pending response");
    });

    it("should allow the invitee to accept the team invitation", async () => {
      (requireAuth as jest.Mock).mockResolvedValue(mockTargetUser);

      await respondToTeamInvitation(mockTeam.id, true);

      // Verify target user team membership accepted
      const mapping = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: mockTeam.id, userId: mockTargetUser.id } },
      });
      expect(mapping?.status).toBe(InvitationStatus.ACCEPTED);

      // Verify target registration linked to team
      const reg = await prisma.registration.findUnique({
        where: { userId_eventId: { userId: mockTargetUser.id, eventId: mockEvent.id } },
      });
      expect(reg?.teamId).toBe(mockTeam.id);

      // Verify leader notified
      const notif = await prisma.notification.findFirst({
        where: { userId: mockUser.id, title: "Invitation Accepted" },
      });
      expect(notif).toBeDefined();
    });
  });
});
