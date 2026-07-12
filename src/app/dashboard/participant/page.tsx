import { getProfile } from "@/actions/profile";
import { getParticipantTeams } from "@/actions/teams";
import { getPendingInvitations } from "@/actions/invitations";
import { getParticipantRegistrations } from "@/actions/registration";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { TeamWorkspace } from "@/components/dashboard/team-workspace";
import { PendingInvitationsList } from "@/components/dashboard/pending-invitations-list";
import { User, Users, Mail } from "lucide-react";

export default async function ParticipantDashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // Load backend states
  const profile = await getProfile();
  const teams = await getParticipantTeams();
  const invites = await getPendingInvitations();
  const registrations = await getParticipantRegistrations();

  return (
    <div className="space-y-6 font-sans">
      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-lg flex max-w-lg mb-8">
          <TabsTrigger
            value="teams"
            className="flex-1 py-2 text-sm font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            My Teams
          </TabsTrigger>
          <TabsTrigger
            value="invites"
            className="flex-1 py-2 text-sm font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 transition-all flex items-center justify-center gap-2 relative"
          >
            <Mail className="w-4 h-4" />
            Invites
            {invites.length > 0 && (
              <span className="absolute top-1.5 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex-1 py-2 text-sm font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 transition-all flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            My Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <TeamWorkspace
            initialTeams={teams as any}
            currentUserId={session.user.id}
            registrations={registrations as any}
          />
        </TabsContent>

        <TabsContent value="invites">
          <PendingInvitationsList initialInvites={invites as any} />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileForm initialProfile={profile as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
