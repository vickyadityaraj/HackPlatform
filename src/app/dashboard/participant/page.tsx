import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getParticipantRegistrations } from "@/actions/registration";
import { getPendingInvitations } from "@/actions/invitations";
import { getProfile } from "@/actions/profile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  Mail,
  Award,
  ArrowRight,
  User as UserIcon,
  Compass,
  Trophy
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParticipantDashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // Load participant's specific data in parallel
  const [registrations, invitations, profile, events] = await Promise.all([
    getParticipantRegistrations(session.user.id),
    getPendingInvitations(session.user.id),
    getProfile(session.user.id),
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
      },
      orderBy: {
        eventStart: "asc",
      },
    }),
  ]);

  const teamsCount = registrations.filter((r) => r.teamId).length;

  // Calculate profile completion percentage
  let filledFields = 0;
  const fieldsToTrack = ["bio", "college", "country", "experience", "resumeUrl", "githubUrl", "linkedInUrl"];
  fieldsToTrack.forEach((field) => {
    if (profile[field as keyof typeof profile]) filledFields++;
  });
  if (profile.skills && profile.skills.length > 0) filledFields++;
  const completionPercentage = Math.round((filledFields / (fieldsToTrack.length + 1)) * 100);

  return (
    <div className="space-y-8 font-sans pb-10 text-neutral-100">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 via-neutral-100 to-neutral-300 bg-clip-text text-transparent">
              Welcome back, {session.user.name || "Builder"}! 👋
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-xl leading-relaxed">
              Track your registered events, manage your teams, and find open hackathons to build and win.
            </p>
          </div>
          <Link href="/dashboard/participant/profile">
            <Button className="bg-violet-600 hover:bg-violet-750 text-neutral-100 text-xs font-semibold h-10 px-4 shadow-lg shadow-violet-500/15 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Complete Profile ({completionPercentage}%)
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-neutral-900/50 border-neutral-800 text-neutral-100 hover:border-neutral-750 transition-all shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Registrations</p>
              <h3 className="text-2xl font-black text-white">{registrations.length}</h3>
              <p className="text-[10px] text-neutral-400">Total applied events</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/50 border-neutral-800 text-neutral-100 hover:border-neutral-750 transition-all shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">My Teams</p>
              <h3 className="text-2xl font-black text-white">{teamsCount}</h3>
              <p className="text-[10px] text-neutral-400">Active team memberships</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/50 border-neutral-800 text-neutral-100 hover:border-neutral-750 transition-all shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Pending Invites</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white">{invitations.length}</h3>
                {invitations.length > 0 && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-400">Received team invitations</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Mail className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/50 border-neutral-800 text-neutral-100 hover:border-neutral-750 transition-all shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5 flex-1">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Profile Setup</p>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-white">{completionPercentage}%</h3>
                <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-neutral-400">Complete info for matchmaking</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 ml-4 shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: My Registered Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-violet-400" />
              My Registered Events
            </h2>
            <Link href="/dashboard/participant/teams" className="text-xs text-violet-400 hover:underline">
              Manage Teams →
            </Link>
          </div>

          {registrations.length === 0 ? (
            <Card className="bg-neutral-900/40 border-neutral-800 border-dashed py-12 text-center text-neutral-400">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <Calendar className="w-12 h-12 text-neutral-750 animate-pulse" />
                <h3 className="text-sm font-semibold text-neutral-350">{"You haven't registered for any events yet"}</h3>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Register for active hackathons or challenges below to kickstart your journey.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {registrations.map((reg) => {
                const isApproved = reg.status === "APPROVED";
                return (
                  <Card key={reg.id} className="bg-neutral-900 border-neutral-800 text-neutral-100 flex flex-col justify-between hover:border-neutral-750 transition-all shadow-md group">
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <Badge
                          variant={isApproved ? "default" : reg.status === "PENDING" ? "secondary" : "outline"}
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                              : reg.status === "PENDING"
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                              : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/10"
                          }`}
                        >
                          {reg.status}
                        </Badge>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-neutral-100 group-hover:text-violet-400 transition-colors">
                          {reg.event.title}
                        </h4>
                      </div>

                      <div className="pt-3 border-t border-neutral-850/60 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Team Status:</span>
                          {reg.team ? (
                            <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px]">
                              {reg.team.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-neutral-800 bg-neutral-950 text-neutral-400 text-[10px]">
                              No Team
                            </Badge>
                          )}
                        </div>

                        {reg.team ? (
                          <Link href="/dashboard/participant/teams" className="block">
                            <Button variant="ghost" className="w-full text-left justify-between h-8 text-[11px] px-2 text-violet-400 hover:text-violet-300 hover:bg-violet-950/10">
                              <span>Go to Team Workspace</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        ) : (
                          <Link href="/dashboard/participant/teams" className="block">
                            <Button variant="ghost" className="w-full text-left justify-between h-8 text-[11px] px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-950/10">
                              <span>Form/Join Team to Submit</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <Link href={`/dashboard/participant/events/${reg.event.slug}`}>
                        <Button className="w-full bg-neutral-950 border border-neutral-850 hover:bg-neutral-850 text-neutral-300 text-xs h-9 font-semibold">
                          Enter Hackathon Room
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Column: Quick Summary & Invitations */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-400" />
            Pending Invitations
          </h2>

          {invitations.length === 0 ? (
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 p-5 text-center">
              <CardContent className="p-0 py-4 flex flex-col items-center justify-center space-y-2">
                <Mail className="w-8 h-8 text-neutral-750" />
                <p className="text-xs font-semibold text-neutral-350">No Pending Invites</p>
                <p className="text-[10px] text-neutral-500 leading-normal max-w-[200px]">
                  When team leaders invite you to join them, they will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invitations.slice(0, 3).map((invite) => {
                const leader = invite.team.members[0];
                return (
                  <Card key={invite.teamId} className="bg-neutral-900 border-neutral-800 text-neutral-100 hover:border-neutral-750 transition-all shadow-md">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-neutral-100 truncate">{invite.team.name}</h4>
                          <p className="text-[10px] text-violet-400 font-medium truncate">{invite.team.event.title}</p>
                        </div>
                        <Badge className="bg-neutral-950 border-neutral-800 text-[9px] text-neutral-400 shrink-0">
                          Invite
                        </Badge>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Invited by <span className="font-semibold text-neutral-300">{leader?.user.name || leader?.user.email}</span>.
                      </p>
                      <Link href="/dashboard/participant/invites">
                        <Button className="w-full bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-[10px] h-7 font-bold">
                          Review Invitation
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
              {invitations.length > 3 && (
                <Link href="/dashboard/participant/invites" className="block text-center text-xs text-violet-400 hover:underline">
                  View all ({invitations.length}) invitations
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Explore/Recommended Events Feed */}
      <div className="space-y-6 pt-6 border-t border-neutral-850/60">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <Compass className="w-4 h-4 text-violet-400" />
            Explore Active Hackathons
          </h2>
          <Link href="/dashboard/participant/events" className="text-xs text-violet-400 hover:underline">
            View All →
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/10">
            <p className="text-neutral-500 text-xs">No active hackathons open at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.slice(0, 6).map((event) => {
              const isUserRegistered = registrations.some((r) => r.eventId === event.id);
              const prizesList = event.prizes ? (typeof event.prizes === "string" ? JSON.parse(event.prizes) : event.prizes) : [];
              const topPrize = prizesList.find((p: any) => p.rank === 1)?.reward || "Swag & Perks";

              return (
                <Card key={event.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-slate-100 shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center gap-2">
                      {isUserRegistered ? (
                        <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 text-[9px] uppercase tracking-wider font-bold">
                          ✓ Registered
                        </Badge>
                      ) : (
                        <Badge className="bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/10 text-[9px] uppercase tracking-wider font-bold">
                          Open
                        </Badge>
                      )}
                      <span className="text-[10px] text-neutral-500 font-mono">
                        By {new Date(event.registrationEnd).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">
                      {event.title}
                    </h3>

                    <p className="text-neutral-400 text-xs leading-relaxed line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-1.5 pt-3 border-t border-neutral-850/60 text-[11px] text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                        <span>Grand Prize: <strong className="text-neutral-200">{topPrize}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span>Run: {new Date(event.eventStart).toLocaleDateString()} - {new Date(event.eventEnd).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link href={`/dashboard/participant/events/${event.slug}`}>
                      <Button className="w-full bg-neutral-950 border border-neutral-850 hover:bg-neutral-850 text-neutral-300 text-xs h-9 font-semibold flex items-center justify-center gap-1">
                        <span>{isUserRegistered ? "Enter Room" : "View Details"}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

