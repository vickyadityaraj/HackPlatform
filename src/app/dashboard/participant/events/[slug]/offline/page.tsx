import { prisma } from "@/lib/prisma";
import { checkUserRegistration } from "@/actions/registration";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { OfflineConsoleClient } from "./offline-client";

interface OfflinePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OfflinePage({ params }: OfflinePageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // 1. Fetch Event
  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
  });

  if (!event) {
    notFound();
  }

  // 2. Fetch Registration
  const registration = await checkUserRegistration(event.id, session.user.id);
  if (!registration) {
    redirect(`/dashboard/participant/events/${slug}`);
  }

  // 3. Fetch Team
  if (!registration.teamId) {
    return (
      <div className="min-h-screen bg-neutral-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold uppercase text-red-500">Workspace Error</h2>
        <p className="text-xs text-neutral-400 mt-2 max-w-sm">
          You are not currently in any team for this event. To view the table screen, you must be in a team.
        </p>
      </div>
    );
  }

  const team = await prisma.team.findUnique({
    where: { id: registration.teamId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      coordinator: {
        select: { id: true, name: true, email: true }
      },
      submissions: {
        where: { deletedAt: null },
        take: 1,
        select: { id: true, repoUrl: true }
      }
    }
  });

  if (!team) {
    notFound();
  }

  // 4. Verify Shortlist Lockdown if Online Round is enabled
  const isShortlisted = event.shortlistedTeams.includes(team.id);
  if (event.hasOnlineRound && !isShortlisted) {
    return (
      <div className="min-h-screen bg-neutral-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-black uppercase text-red-500 tracking-wider">Access Locked</h2>
        <p className="text-xs text-neutral-400 max-w-md">
          Your team <strong className="text-neutral-200">&quot;{team.name}&quot;</strong> has not been shortlisted for the final phase of this event. 
          The offline table display is restricted to shortlisted teams only.
        </p>
      </div>
    );
  }

  return (
    <OfflineConsoleClient 
      event={{
        title: event.title,
        collegeName: event.collegeName,
        organizedBy: event.organizedBy,
        reviewPhases: event.reviewPhases,
      }}
      team={team as any}
    />
  );
}
