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

  // 6b. Create Default Coordinator Account
  const coordEmail = "coordinator@hackathon.com";
  const coordPasswordHash = await bcrypt.hash("password123", 10);

  const coordUser = await prisma.user.upsert({
    where: { email: coordEmail },
    update: {},
    create: {
      email: coordEmail,
      name: "Event Coordinator",
      password: coordPasswordHash,
      role: Role.COORDINATOR,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("Created Coordinator Account:", coordUser.email);

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

  // 7. Create Featured Event (global-hackathon-2026)
  const featuredEventSlug = "global-hackathon-2026";
  const featuredEvent = await prisma.event.upsert({
    where: { slug: featuredEventSlug },
    update: {},
    create: {
      title: "Global Hackathon 2026",
      slug: featuredEventSlug,
      description: "Join developers worldwide to build state-of-the-art AI applications, premium developer tools, and scalable web apps. Compete for major cash rewards and goodies, connect with elite mentors, and showcase your skills to top-tier global sponsors.",
      status: "PUBLISHED",
      registrationStart: new Date("2026-01-01T00:00:00Z"),
      registrationEnd: new Date("2026-12-31T23:59:59Z"),
      eventStart: new Date("2026-08-01T09:00:00Z"),
      eventEnd: new Date("2026-08-05T18:00:00Z"),
      organizerId: orgUser.id,
      rules: "1. Respect all code of conduct rules.\n2. Projects must be built entirely during the event.\n3. Team sizes must be between 1 and 4 members.",
      faq: [
        { q: "Who can participate?", a: "Anyone interested in software development, design, or product creation!" },
        { q: "What is the maximum team size?", a: "You can compete individually or in teams of up to 4 members." }
      ],
      prizes: [
        { rank: 1, title: "Grand Champion", reward: "$10,000 USD" },
        { rank: 2, title: "Runner Up", reward: "$5,000 USD" },
        { rank: 3, title: "Third Place", reward: "$2,500 USD" }
      ],
      sponsors: [
        { name: "Google Cloud", logo: "/images/google.png", tier: "Gold" },
        { name: "Vercel", logo: "/images/vercel.png", tier: "Silver" }
      ],
      schedule: [
        { time: "Day 1, 09:00 AM", title: "Opening Ceremony & Team Matchmaking" },
        { time: "Day 2, 02:00 PM", title: "Mid-way Progress Check-in" },
        { time: "Day 4, 12:00 PM", title: "Project Submission Deadline" }
      ],
      timeline: [
        { date: "Aug 1, 2026", label: "Kickoff Ceremony" },
        { date: "Aug 4, 2026", label: "Submission Review" },
        { date: "Aug 5, 2026", label: "Winners Announcement" }
      ],
      customQuestions: [
        { id: "tshirt", type: "select", label: "T-Shirt Size", required: true, options: ["XS", "S", "M", "L", "XL", "XXL"] },
        { id: "github", type: "text", label: "GitHub Profile link", required: true },
        { id: "dietary", type: "text", label: "Dietary Restrictions (optional)", required: false }
      ]
    }
  });
  console.log("Created Featured Event:", featuredEvent.title);

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
