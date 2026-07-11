import { getProfile } from "@/actions/profile";
import { getParticipantTeams } from "@/actions/teams";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { TeamWorkspace } from "@/components/dashboard/team-workspace";
import { User, Users } from "lucide-react";

export default async function ParticipantDashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // Load backend states
  const profile = await getProfile();
  const teams = await getParticipantTeams();

  return (
    <div className="space-y-6 font-sans">
      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-lg flex max-w-md mb-8">
          <TabsTrigger
            value="teams"
            className="flex-1 py-2 text-sm font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            My Teams
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
          <TeamWorkspace initialTeams={teams as any} currentUserId={session.user.id} />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileForm initialProfile={profile as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
