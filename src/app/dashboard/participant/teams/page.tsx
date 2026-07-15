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

export default async function ParticipantTeamsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // Load related tables in parallel and pass pre-authenticated session.user.id to bypass redundant auth calls
  const [teams, registrations] = await Promise.all([
    getParticipantTeams(session.user.id),
    getParticipantRegistrations(session.user.id),
  ]);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50">My Teams</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Coordinate with teammates, invite other developers, and submit your hackathon projects.
        </p>
      </div>
      <TeamWorkspace
        initialTeams={teams as any}
        currentUserId={session.user.id}
        registrations={registrations as any}
      />
    </div>
  );
}
