import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, Trophy, ExternalLink, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function CoordinatorDashboardPage() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "COORDINATOR") {
    redirect("/auth/login");
  }

  // Fetch assigned teams
  const teams = await prisma.team.findMany({
    where: {
      coordinatorId: session.user.id,
      deletedAt: null,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      submissions: {
        where: { deletedAt: null },
        include: {
          evaluations: {
            include: {
              scores: { select: { points: true } },
              judge: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 font-sans text-neutral-200">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-300 bg-clip-text text-transparent">
          Coordinator Panel
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Monitor your assigned team units, inspect members, and track evaluation scores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-neutral-800 bg-neutral-900/10 rounded-2xl">
            <Users className="w-12 h-12 text-neutral-600 mx-auto mb-4 animate-pulse" />
            <p className="font-semibold text-neutral-400">No teams assigned yet</p>
            <p className="text-xs text-neutral-500 mt-1">
              You will see assigned teams here once the event organizer maps them to your account.
            </p>
          </div>
        ) : (
          teams.map((team) => {
            // Aggregate score points
            let totalScore = 0;
            team.submissions.forEach((sub) => {
              sub.evaluations.forEach((evalRecord) => {
                evalRecord.scores.forEach((s) => {
                  totalScore += s.points;
                });
              });
            });

            return (
              <Card key={team.id} className="bg-neutral-900 border-neutral-800 text-neutral-100 shadow-md">
                <CardHeader className="pb-3 border-b border-neutral-850">
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span>{team.name}</span>
                    <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-300 capitalize text-[10px]">
                      {team.event.title}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 space-y-4">
                  {/* Roster & Contacts */}
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-500 font-semibold flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-violet-400" />
                      Team Members:
                    </p>
                    <div className="space-y-1.5">
                      {team.members.map((m) => (
                        <div key={m.id} className="bg-neutral-950 p-2.5 rounded border border-neutral-850 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-neutral-200">{m.user.name || "Anonymous Member"}</p>
                            <p className="text-[10px] text-neutral-500 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-neutral-600" />
                              {m.user.email}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-extrabold">
                            {m.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission detail */}
                  {team.submissions.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-neutral-850">
                      <p className="text-xs text-neutral-500 font-semibold flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-indigo-400" />
                        Project Submission:
                      </p>
                      <div className="bg-neutral-950 p-3 rounded border border-neutral-850 text-xs space-y-1.5">
                        <p className="font-bold text-neutral-200">{team.submissions[0].title}</p>
                        <p className="text-neutral-400 text-[11px] leading-relaxed">{team.submissions[0].description}</p>
                        <div className="flex gap-4 pt-1.5">
                          {team.submissions[0].repoUrl && (
                            <a
                              href={team.submissions[0].repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Repository
                            </a>
                          )}
                          {team.submissions[0].projectUrl && (
                            <a
                              href={team.submissions[0].projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Live Demo
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-neutral-500 italic bg-neutral-950/40 rounded border border-neutral-850/50">
                      No project submission uploaded yet.
                    </div>
                  )}

                  {/* Evaluation Reviews Status */}
                  <div className="space-y-2 pt-2 border-t border-neutral-850 text-xs">
                    <p className="text-neutral-500 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Evaluation Review Progress:
                    </p>
                    {team.submissions.length > 0 ? (
                      team.submissions[0].evaluations.length > 0 ? (
                        <div className="space-y-1.5">
                          {team.submissions[0].evaluations.map((ev) => {
                            const scoreSum = ev.scores.reduce((sum, s) => sum + s.points, 0);
                            return (
                              <div key={ev.id} className="bg-neutral-950 p-2 rounded border border-neutral-850 flex justify-between items-center px-3 py-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-neutral-300 truncate">
                                    Graded by: {ev.judge.user.name || ev.judge.user.email}
                                  </p>
                                  <p className="text-[10px] text-neutral-505 truncate italic">
                                    &ldquo;{ev.feedback || 'No comments left.'}&rdquo;
                                  </p>
                                </div>
                                <Badge variant="secondary" className="font-mono text-emerald-400 font-extrabold bg-emerald-500/5 ml-2">
                                  {scoreSum} pts
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-amber-500 font-bold italic bg-amber-500/5 p-2.5 rounded border border-amber-500/10 text-center">
                          ⚠️ Evaluation Pending (No judges have reviewed this team).
                        </p>
                      )
                    ) : (
                      <p className="text-neutral-500 font-bold italic bg-neutral-950/40 p-2.5 rounded border border-neutral-850/50 text-center">
                        Waiting for team submission.
                      </p>
                    )}
                  </div>

                  {/* Scores Summary */}
                  <div className="bg-neutral-950/60 p-3 rounded border border-neutral-850 flex justify-between items-center text-xs">
                    <span className="text-neutral-400 font-medium">Evaluation Score Summary</span>
                    <span className="font-black text-violet-400 font-mono text-sm">{totalScore} pts</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
