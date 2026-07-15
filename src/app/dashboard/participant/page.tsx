import { getParticipantTeams } from "@/actions/teams";
import { getParticipantRegistrations } from "@/actions/registration";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const TeamWorkspace = dynamic(
  () => import("@/components/dashboard/team-workspace").then((mod) => mod.TeamWorkspace),
  {
    ssr: false,
    loading: () => <div className="p-8 text-center text-neutral-500 text-xs">Loading team workspace...</div>,
  }
);

export default async function ParticipantDashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // Load backend states in parallel, passing the pre-fetched session.user.id to bypass redundant auth guards
  const [teams, registrations] = await Promise.all([
    getParticipantTeams(session.user.id),
    getParticipantRegistrations(session.user.id),
  ]);

  return (
    <div className="space-y-6 font-sans">
      <TeamWorkspace
        initialTeams={teams as any}
        currentUserId={session.user.id}
        registrations={registrations as any}
      />
    </div>
  );
}
