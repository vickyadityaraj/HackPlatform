import { getParticipantTeams } from "@/actions/teams";
import { getParticipantRegistrations } from "@/actions/registration";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TeamWorkspace } from "@/components/dashboard/team-workspace";

export default async function ParticipantTeamsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const teams = await getParticipantTeams();
  const registrations = await getParticipantRegistrations();

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
