import { getTeamByInviteToken, joinTeam } from "@/actions/teams";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, ShieldAlert, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface JoinTeamPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function JoinTeamPage({ searchParams }: JoinTeamPageProps) {
  const session = await auth();
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <Card className="max-w-md w-full bg-slate-900 border-slate-800 text-slate-100 text-center py-8">
          <CardContent className="space-y-4">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
            <CardTitle className="text-lg font-bold">Missing Invitation Token</CardTitle>
            <p className="text-xs text-slate-400">
              Please use the full invitation link shared by your team leader.
            </p>
            <Link href="/" className="inline-block mt-4">
              <Button className="bg-slate-850 hover:bg-slate-800 text-xs">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session || !session.user) {
    redirect(`/auth/login?callbackUrl=/join-team?token=${token}`);
  }

  let teamInfo;
  let errorMsg = null;

  try {
    teamInfo = await getTeamByInviteToken(token);
  } catch (err: any) {
    errorMsg = err.message || "Failed to load team invitation";
  }

  const handleJoin = async () => {
    "use server";
    try {
      await joinTeam(token);
    } catch (err) {
      // Action will throw or redirect, handles below
    }
    redirect("/dashboard/participant");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[40%] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[40%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />

      {errorMsg ? (
        <Card className="max-w-md w-full bg-slate-900 border-slate-800 text-slate-100 text-center py-8 relative z-10">
          <CardContent className="space-y-4">
            <ShieldAlert className="w-12 h-12 text-red-550 mx-auto animate-pulse" />
            <CardTitle className="text-lg font-bold">Invitation Error</CardTitle>
            <p className="text-xs text-slate-400">{errorMsg}</p>
            <div className="pt-4 flex justify-center gap-3">
              <Link href="/dashboard/participant">
                <Button className="bg-slate-850 hover:bg-slate-800 text-xs text-slate-300">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-violet-600 hover:bg-violet-700 text-xs">
                  Return Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-lg w-full bg-slate-900/60 border-slate-800/80 text-slate-100 backdrop-blur-md relative z-10 shadow-2xl">
          <CardHeader className="text-center border-b border-slate-850 pb-6">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/25 flex items-center justify-center mx-auto text-violet-400 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-neutral-50 to-neutral-300 bg-clip-text text-transparent">
              Team Invitation
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              You are invited to join an active team roster
            </CardDescription>
          </CardHeader>

          <CardContent className="py-8 space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Team Name</span>
                  <p className="text-lg font-bold text-slate-100 mt-0.5">{teamInfo?.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Event</span>
                  <p className="text-sm font-semibold text-violet-400 mt-0.5">{teamInfo?.eventTitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-850/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Team Leader</span>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5 truncate">{teamInfo?.leaderName}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-850/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Roster Size</span>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">{teamInfo?.memberCount} Member(s)</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 text-center leading-relaxed">
              By accepting, you will join as a teammate for this event. You will be registered under the same team code and gain access to the shared project workspace.
            </div>
          </CardContent>

          <CardFooter className="border-t border-slate-850/60 pt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/participant" className="w-full sm:flex-1 order-2 sm:order-1">
              <Button variant="outline" className="w-full border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs h-11">
                Decline
              </Button>
            </Link>
            <form action={handleJoin} className="w-full sm:flex-1 order-1 sm:order-2">
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-750 text-slate-100 font-semibold h-11 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 text-xs">
                Accept & Join Team
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
