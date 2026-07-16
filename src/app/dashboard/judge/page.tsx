import { prisma } from "@/lib/prisma";
import { getJudgeSubmissions } from "@/actions/evaluation";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, ChevronRight, FileText, Calendar, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { JudgeQRScannerTrigger } from "@/components/dashboard/JudgeQRScannerTrigger";

const EvaluationCenter = dynamic(
  () => import("@/components/dashboard/evaluation-center").then((mod) => mod.EvaluationCenter),
  {
    ssr: false,
    loading: () => <div className="p-8 text-center text-neutral-500 text-xs">Loading evaluation rubric...</div>,
  }
);

interface JudgeDashboardPageProps {
  searchParams: Promise<{ eventId?: string; submissionId?: string }>;
}

export default async function JudgeDashboardPage({ searchParams }: JudgeDashboardPageProps) {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "JUDGE" && session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const { eventId, submissionId } = await searchParams;

  // 1. Fetch events assigned to this judge
  const judgeMappings = await prisma.judge.findMany({
    where: { userId: session.user.id },
    include: { event: true },
  });
  const events = judgeMappings.map((m) => m.event).filter((e) => !e.deletedAt);

  // 2. Fetch submissions if an event is selected
  let submissions: any[] = [];
  let selectedEventName = "";
  if (eventId) {
    const ev = events.find((e) => e.id === eventId);
    if (ev) {
      selectedEventName = ev.title;
      submissions = await getJudgeSubmissions(eventId, session.user.id);
    }
  }

  // 3. Get active submission & evaluation details if selected
  let activeSubmission = null;
  let initialScores: any[] = [];
  let initialFeedback = "";

  if (submissionId && submissions.length > 0) {
    const sub = submissions.find((s) => s.id === submissionId);
    if (sub) {
      activeSubmission = sub;
      const myEval = sub.evaluations[0]; // Filtered to current judge in getJudgeSubmissions
      if (myEval) {
        initialFeedback = myEval.feedback || "";
        initialScores = myEval.scores.map((sc: any) => ({
          criteriaName: sc.criteriaName,
          points: sc.points,
          maxPoints: sc.maxPoints,
        }));
      }
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50">Judge Workspace</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Review hackathon submissions, grade them against core criteria, and record feedback.
        </p>
      </div>

      {/* 3-Pane Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pane 1: Assigned Events Sidebar (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader className="pb-3 border-b border-neutral-850">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" />
                Assigned Events
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 px-2 space-y-1.5">
              {events.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">No assigned hackathons.</p>
              ) : (
                events.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/dashboard/judge?eventId=${ev.id}`}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all duration-200",
                      eventId === ev.id
                        ? "bg-violet-600/10 border border-violet-500/30 text-violet-400"
                        : "border border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                    )}
                  >
                    <span className="truncate">{ev.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-1.5" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pane 2: Submissions List (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {eventId ? (
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
              <CardHeader className="pb-3 border-b border-neutral-850">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Submissions
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4 px-2 space-y-1.5 max-h-[500px] overflow-y-auto">
                <div className="px-1 pb-2 border-b border-neutral-850">
                  <JudgeQRScannerTrigger eventId={eventId} />
                </div>
                {submissions.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-4 text-center">No submissions recorded yet.</p>
                ) : (
                  submissions.map((sub) => {
                    const isEvaluated = sub.evaluations.length > 0;
                    return (
                      <Link
                        key={sub.id}
                        href={`/dashboard/judge?eventId=${eventId}&submissionId=${sub.id}`}
                        className={cn(
                          "block w-full p-3 rounded-lg border text-left transition-all duration-200 space-y-2",
                          submissionId === sub.id
                            ? "bg-indigo-600/10 border-indigo-500/30"
                            : "border-neutral-850 hover:bg-neutral-800/40"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-neutral-200 text-xs line-clamp-1">{sub.title}</h4>
                          {isEvaluated ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] px-1 py-0 flex items-center gap-0.5 select-none font-medium shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Graded
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] px-1 py-0 select-none font-medium shrink-0">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-neutral-500">
                          <span className="truncate">Team: {sub.team.name}</span>
                          {isEvaluated && (
                            <span className="text-neutral-400 font-bold flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500 shrink-0" />
                              {(
                                sub.evaluations[0].scores.reduce((acc: number, s: any) => acc + s.points, 0) /
                                sub.evaluations[0].scores.length
                              ).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="border border-dashed border-neutral-800 rounded-xl p-8 text-center text-neutral-500 bg-neutral-900/10 text-xs">
              Select an assigned event to view project submissions.
            </div>
          )}
        </div>

        {/* Pane 3: Evaluation grading (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {activeSubmission ? (
            <EvaluationCenter
              key={activeSubmission.id}
              submission={{
                id: activeSubmission.id,
                title: activeSubmission.title,
                description: activeSubmission.description,
                projectUrl: activeSubmission.projectUrl,
                repoUrl: activeSubmission.repoUrl,
                videoUrl: activeSubmission.videoUrl,
                team: {
                  name: activeSubmission.team.name,
                },
              }}
              initialScores={initialScores}
              initialFeedback={initialFeedback}
            />
          ) : (
            <div className="border border-dashed border-neutral-800 rounded-xl p-8 text-center text-neutral-500 bg-neutral-900/10 text-xs">
              Select a project submission to record grading points and written feedback.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
