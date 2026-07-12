import { prisma } from "@/lib/prisma";
import { getLeaderTeamsForTargetUser, sendTeamInvitation } from "@/actions/invitations";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, UserPlus, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface InvitePageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function ParticipantInvitePage({ searchParams }: InvitePageProps) {
  const session = await auth();
  const { userId } = await searchParams;

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  if (!userId) {
    redirect("/matchmaking");
  }

  // Get target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    include: { profile: true },
  });

  if (!targetUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 font-sans">
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 text-center p-6">
          <CardContent className="space-y-4">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
            <CardTitle>User Not Found</CardTitle>
            <p className="text-xs text-neutral-450">
              The developer profile you are trying to invite does not exist on the platform.
            </p>
            <Link href="/matchmaking">
              <Button className="bg-neutral-800 hover:bg-neutral-755 text-xs mt-2">
                Back to Matchmaking
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get eligible teams
  const eligibleTeams = await getLeaderTeamsForTargetUser(userId);

  const handleSendInvite = async (formData: FormData) => {
    "use server";
    const teamId = formData.get("teamId") as string;
    const targetId = formData.get("targetUserId") as string;

    if (!teamId || !targetId) return;

    try {
      await sendTeamInvitation(teamId, targetId);
    } catch (err) {
      // Handles error gracefully via redirect logic below
    }
    redirect(`/dashboard/participant`);
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 font-sans space-y-6">
      {/* Back link */}
      <Link href="/matchmaking" className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Matchmaking
      </Link>

      <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-neutral-850 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 font-bold uppercase">
              {targetUser.name ? targetUser.name.substring(0, 2) : "DV"}
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Invite {targetUser.name || "Developer"}</CardTitle>
              <CardDescription className="text-xs text-neutral-400 mt-0.5 truncate">
                {targetUser.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="py-6 space-y-6">
          {eligibleTeams.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <ShieldAlert className="w-12 h-12 text-neutral-600 mx-auto" />
              <p className="font-semibold text-neutral-350 text-sm">No Eligible Teams Found</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                You must be a Team Leader of a team in an event that {targetUser.name || "this user"} is registered for. The user must also not be on any other team for that event.
              </p>
            </div>
          ) : (
            <form action={handleSendInvite} className="space-y-6">
              <input type="hidden" name="targetUserId" value={userId} />

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                  Select Team to Invite To
                </label>
                <div className="space-y-2">
                  {eligibleTeams.map((team, idx) => (
                    <label
                      key={team.id}
                      className="flex items-start gap-3 p-4 rounded-lg bg-neutral-950 border border-neutral-850 cursor-pointer hover:border-neutral-750 transition-colors"
                    >
                      <input
                        type="radio"
                        name="teamId"
                        value={team.id}
                        defaultChecked={idx === 0}
                        className="w-4 h-4 mt-0.5 accent-violet-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-200">{team.name}</p>
                        <p className="text-xs text-violet-400 mt-0.5">{team.event.title}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-850">
                <Link href="/matchmaking">
                  <Button type="button" variant="outline" className="border-neutral-850 bg-neutral-950 text-neutral-450 hover:text-neutral-200 text-xs">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold flex items-center gap-2 shadow-lg shadow-violet-500/15 text-xs">
                  <UserPlus className="w-4 h-4" />
                  Send Invitation
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
