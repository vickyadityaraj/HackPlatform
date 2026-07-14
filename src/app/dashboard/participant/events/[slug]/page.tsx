import { getEventBySlug } from "@/actions/events";
import { checkUserRegistration } from "@/actions/registration";
import { getLeaderboard } from "@/actions/evaluation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Award, ShieldAlert, Trophy, Users, Megaphone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

const RegisterDialog = dynamic(
  () => import("@/components/dashboard/register-dialog").then((mod) => mod.RegisterDialog),
  {
    ssr: false,
    loading: () => <Button className="w-full bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold h-11" disabled>Registering...</Button>
  }
);

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  // Parse JSON configs from DB
  const faq = event.faq ? (typeof event.faq === "string" ? JSON.parse(event.faq) : event.faq) : [];
  const prizes = event.prizes ? (typeof event.prizes === "string" ? JSON.parse(event.prizes) : event.prizes) : [];
  const sponsors = event.sponsors ? (typeof event.sponsors === "string" ? JSON.parse(event.sponsors) : event.sponsors) : [];
  const schedule = event.schedule ? (typeof event.schedule === "string" ? JSON.parse(event.schedule) : event.schedule) : [];
  const timeline = event.timeline ? (typeof event.timeline === "string" ? JSON.parse(event.timeline) : event.timeline) : [];
  const customQuestions = event.customQuestions ? (typeof event.customQuestions === "string" ? JSON.parse(event.customQuestions) : event.customQuestions) : [];

  const [registration, leaderboard] = await Promise.all([
    checkUserRegistration(event.id),
    getLeaderboard(event.id),
  ]);
  const isRegistered = !!registration;
  const inTeam = !!registration?.teamId;

  return (
    <div className="space-y-8 font-sans">
      {/* Event Hero */}
      <div className="relative border border-neutral-850 rounded-2xl bg-neutral-900/40 p-8 md:p-12 overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-300 capitalize text-xs">
                {event.status.toLowerCase()}
              </Badge>
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Event: {new Date(event.eventStart).toLocaleDateString()} - {new Date(event.eventEnd).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-300 bg-clip-text text-transparent">
              {event.title}
            </h1>
            <p className="text-neutral-400 text-sm md:text-base max-w-2xl leading-relaxed">
              {event.description.substring(0, 180)}...
            </p>
          </div>

          {/* Registration CTA Trigger */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            {!isRegistered ? (
              <RegisterDialog
                eventId={event.id}
                customQuestions={customQuestions}
                trigger={
                  <Button className="w-full bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold h-11 shadow-lg shadow-violet-500/15">
                    Register for Event
                  </Button>
                }
              />
            ) : !inTeam ? (
              <div className="space-y-2">
                <div className="text-xs text-center text-emerald-400 font-semibold">✓ Registered</div>
                <Link href="/dashboard/participant">
                  <Button className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-750 text-xs h-10">
                    Form or Join Team
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-center text-emerald-400 font-semibold">✓ Team Joined: {registration.team?.name}</div>
                <Link href="/dashboard/participant">
                  <Button className="w-full bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs h-10">
                    Go to Workspace
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs panels */}
      <div className="max-w-6xl">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-lg flex flex-wrap max-w-2xl">
            <TabsTrigger value="overview" className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100">Overview</TabsTrigger>
            <TabsTrigger value="rules" className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100">Rules</TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100">Schedule</TabsTrigger>
            <TabsTrigger value="faq" className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100">FAQ</TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100">Leaderboard</TabsTrigger>
            <TabsTrigger value="announcements" className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100">Announcements</TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
                  <CardContent className="py-6 space-y-4">
                    <h3 className="text-lg font-bold text-neutral-100">About the Hackathon</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Timeline display */}
                {timeline.length > 0 && (
                  <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
                    <CardContent className="py-6 space-y-4">
                      <h3 className="text-lg font-bold text-neutral-100">Milestone Timeline</h3>
                      <div className="space-y-4">
                        {timeline.map((t: any, i: number) => (
                          <div key={i} className="flex gap-4 items-start">
                            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 mt-1.5" />
                            <div>
                              <p className="text-sm font-semibold text-neutral-200">{t.label}</p>
                              <p className="text-xs text-neutral-500">{t.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar: Prizes & Sponsors */}
              <div className="space-y-6">
                {prizes.length > 0 && (
                  <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
                    <CardContent className="py-6 space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-500">
                        <Trophy className="w-5 h-5" />
                        Prizes & Rewards
                      </h3>
                      <div className="space-y-3">
                        {prizes.map((p: any, i: number) => (
                          <div key={i} className="p-3 bg-neutral-950 border border-neutral-850/60 rounded-lg flex items-center justify-between">
                            <div>
                              <p className="text-xs text-neutral-500">Rank #{p.rank}</p>
                              <p className="text-sm font-bold text-neutral-200">{p.title}</p>
                            </div>
                            <span className="text-sm font-extrabold text-violet-400">{p.reward}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Judges names list */}
                {event.judges.length > 0 && (
                  <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
                    <CardContent className="py-6 space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-400" />
                        Judges Panels
                      </h3>
                      <div className="space-y-3">
                        {event.judges.map((j) => (
                          <div key={j.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-semibold">
                              {j.user.name ? j.user.name.substring(0, 2) : "JD"}
                            </div>
                            <span className="text-sm font-medium text-neutral-300">{j.user.name || "Judge"}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {sponsors.length > 0 && (
                  <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
                    <CardContent className="py-6 space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-400" />
                        Sponsors
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {sponsors.map((sp: any, idx: number) => (
                          <div key={idx} className="p-3 bg-neutral-950 border border-neutral-850/60 rounded-lg flex flex-col items-center justify-center text-center gap-2">
                            <span className="text-xs font-bold text-neutral-200">{sp.name}</span>
                            <Badge variant="outline" className="text-[9px] uppercase font-semibold text-neutral-500 border-neutral-850">
                              {sp.tier}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Rules Tab Content */}
          <TabsContent value="rules">
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
              <CardContent className="py-6 space-y-4">
                <h3 className="text-lg font-bold">Hackathon Rules & Code of Conduct</h3>
                <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
                  {event.rules || "Standard hackathon rules apply. Be respectful, build original projects, and submit before deadlines."}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab Content */}
          <TabsContent value="faq">
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
              <CardContent className="py-6 space-y-4">
                <h3 className="text-lg font-bold">Frequently Asked Questions</h3>
                {faq.length === 0 ? (
                  <p className="text-sm text-neutral-500">No questions configured yet.</p>
                ) : (
                  <div className="space-y-4">
                    {faq.map((item: any, i: number) => (
                      <div key={i} className="p-4 rounded-lg bg-neutral-950 border border-neutral-850/60 space-y-2">
                        <h4 className="font-bold text-neutral-200 text-sm flex items-start gap-2">
                          <span className="text-violet-400 font-extrabold">Q.</span>
                          {item.q}
                        </h4>
                        <p className="text-xs text-neutral-400 leading-relaxed pl-5 whitespace-pre-wrap">
                          {item.a}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab Content */}
          <TabsContent value="schedule">
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
              <CardContent className="py-6 space-y-4">
                <h3 className="text-lg font-bold">Event Schedule</h3>
                {schedule.length === 0 ? (
                  <p className="text-sm text-neutral-500">No schedule items configured yet.</p>
                ) : (
                  <div className="space-y-4">
                    {schedule.map((sch: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-3 bg-neutral-950 border border-neutral-850/60 rounded-lg">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-violet-950/40 text-violet-300 border border-violet-850">{sch.time}</span>
                        <span className="text-sm font-semibold text-neutral-200 mt-0.5">{sch.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab Content */}
          <TabsContent value="leaderboard">
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
              <CardContent className="py-6 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Live Leaderboard
                </h3>
                {leaderboard.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500">
                    <ShieldAlert className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
                    <p className="text-sm">Leaderboard is currently empty</p>
                    <p className="text-xs text-neutral-600">Scores will display once judges begin evaluations.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((team, index) => (
                      <div key={team.teamId} className="p-4 bg-neutral-950 border border-neutral-850/60 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-neutral-500 w-5">#{index + 1}</span>
                          <div>
                            <p className="text-sm font-bold text-neutral-200">{team.teamName}</p>
                            <p className="text-xs text-neutral-500">Project: {team.projectTitle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-emerald-400">{team.averageScore} pts</span>
                          <p className="text-[10px] text-neutral-600">{team.judgeCount} judge(s) evaluated</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab Content */}
          <TabsContent value="announcements">
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
              <CardContent className="py-6 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-400" />
                  Announcements Log
                </h3>
                {event.announcements.length === 0 ? (
                  <p className="text-sm text-neutral-500">No announcements broadcasted yet.</p>
                ) : (
                  <div className="space-y-4">
                    {event.announcements.map((ann) => (
                      <div key={ann.id} className="p-4 rounded-lg bg-neutral-950 border border-neutral-850/60 space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-neutral-200 text-sm">{ann.title}</h4>
                          <span className="text-[10px] text-neutral-500">{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-wrap">
                          {ann.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
