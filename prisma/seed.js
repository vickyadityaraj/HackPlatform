const { PrismaClient, Role, UserStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Default Platform Settings
  const settings = await prisma.platformSettings.upsert({
    where: { id: "single-settings-row" },
    update: {},
    create: {
      id: "single-settings-row",
      platformFeePercentage: 2.5,
      maintenanceMode: false,
    },
  });
  console.log("Created/Updated Platform Settings:", settings);

  // 2. Create Default Roles & Permissions
  const permissions = [
    { role: Role.SUPER_ADMIN, permission: "ALL_ACCESS" },
    { role: Role.ORGANIZER, permission: "CREATE_EVENT" },
    { role: Role.ORGANIZER, permission: "MANAGE_TEAMS" },
    { role: Role.JUDGE, permission: "SUBMIT_SCORES" },
    { role: Role.PARTICIPANT, permission: "JOIN_TEAM" },
    { role: Role.PARTICIPANT, permission: "SUBMIT_PROJECT" },
  ];

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permission: { role: perm.role, permission: perm.permission },
      },
      update: {},
      create: perm,
    });
  }
  console.log("Seeded Role Permissions successfully.");

  // 3. Create Default Super Admin Account
  const adminEmail = "admin@hackathon.com";
  const adminPasswordHash = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Global Admin",
      password: adminPasswordHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("Created Super Admin Account:", adminUser.email);

  // 4. Create Default Organizer Account
  const orgEmail = "organizer@hackathon.com";
  const orgPasswordHash = await bcrypt.hash("password123", 10);

  const orgUser = await prisma.user.upsert({
    where: { email: orgEmail },
    update: {},
    create: {
      email: orgEmail,
      name: "Summit Coordinator",
      password: orgPasswordHash,
      role: Role.ORGANIZER,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("Created Organizer Account:", orgUser.email);

  // 5. Create Default Judge Account
  const judgeEmail = "judge@hackathon.com";
  const judgePasswordHash = await bcrypt.hash("password123", 10);

  const judgeUser = await prisma.user.upsert({
    where: { email: judgeEmail },
    update: {},
    create: {
      email: judgeEmail,
      name: "Technical Evaluator",
      password: judgePasswordHash,
      role: Role.JUDGE,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("Created Judge Account:", judgeUser.email);

  // 6. Create Default Participant Account
  const partEmail = "participant@hackathon.com";
  const partPasswordHash = await bcrypt.hash("password123", 10);

  const partUser = await prisma.user.upsert({
    where: { email: partEmail },
    update: {},
    create: {
      email: partEmail,
      name: "Alex Dev",
      password: partPasswordHash,
      role: Role.PARTICIPANT,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("Created Participant Account:", partUser.email);

  // Create Profile for the participant
  const partProfile = await prisma.profile.upsert({
    where: { userId: partUser.id },
    update: {},
    create: {
      userId: partUser.id,
      skills: ["typescript", "nextjs", "react", "postgresql"],
      experience: "Intermediate (2-4 yrs)",
      bio: "Full stack engineer building developer tools and SaaS platforms.",
      college: "University of Washington",
      country: "United States",
    },
  });
  console.log("Created Participant Profile:", partProfile.userId);

  console.log("Database seeding completed successfully! 🚀");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
