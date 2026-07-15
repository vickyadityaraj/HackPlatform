import { getOrganizerEvents } from "@/actions/events";
import { getLeaderboard } from "@/actions/evaluation";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award, Medal, Star, Calendar } from "lucide-react";
import EventSelector from "./event-selector";

interface EvaluationsPageProps {
  searchParams: Promise<{ eventId?: string }>;
}

export default async function OrganizerEvaluationsPage({ searchParams }: EvaluationsPageProps) {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const events = await getOrganizerEvents(session.user.id);
  const { eventId } = await searchParams;

  let leaderboard: any[] = [];
  let selectedEventName = "";

  if (eventId) {
    const selectedEvent = events.find((ev) => ev.id === eventId);
    if (selectedEvent) {
      selectedEventName = selectedEvent.title;
      leaderboard = await getLeaderboard(eventId);
    }
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-300 bg-clip-text text-transparent">
          Judge Evaluations & Leaderboard
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Monitor the live leaderboard and inspect scores submitted by assigned judges.
        </p>
      </div>

      {/* Select Event */}
      <Card className="bg-neutral-900 border-neutral-800 shadow-md">
        <CardContent className="py-6">
          <EventSelector events={events} selectedEventId={eventId} />
        </CardContent>
      </Card>

      {/* Leaderboard Grid */}
      {eventId ? (
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 shadow-xl">
          <CardHeader className="border-b border-neutral-850/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Live Standings: {selectedEventName}</CardTitle>
              <p className="text-neutral-500 text-xs mt-1">Teams ranked by average evaluation scores</p>
            </div>
            <Trophy className="w-5 h-5 text-yellow-450 shrink-0" />
          </CardHeader>
          <CardContent className="py-6">
            {leaderboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-500">
                <Award className="w-12 h-12 mb-3 text-neutral-600 animate-pulse" />
                <p className="font-semibold">No submissions evaluated yet</p>
                <p className="text-sm mt-1">Assigned judges will record evaluations inside their workspaces.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-semibold pb-3 text-xs uppercase tracking-wider">
                      <th className="py-4 px-3">Rank</th>
                      <th className="py-4 px-3">Team Name</th>
                      <th className="py-4 px-3">Project Title</th>
                      <th className="py-4 px-3 text-center">Judges</th>
                      <th className="py-4 px-3 text-right">Average Score</th>
                      <th className="py-4 px-3 text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {leaderboard.map((item, index) => {
                      const rank = index + 1;
                      return (
                        <tr key={item.submissionId} className="hover:bg-neutral-850/20 transition-colors">
                          <td className="py-4 px-3 font-bold text-neutral-300">
                            {rank === 1 ? (
                              <span className="flex items-center gap-1 text-yellow-450">
                                <Medal className="w-4 h-4 fill-yellow-450" />
                                1st
                              </span>
                            ) : rank === 2 ? (
                              <span className="flex items-center gap-1 text-slate-300">
                                <Medal className="w-4 h-4 fill-slate-400" />
                                2nd
                              </span>
                            ) : rank === 3 ? (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Medal className="w-4 h-4 fill-amber-700" />
                                3rd
                              </span>
                            ) : (
                              <span>#{rank}</span>
                            )}
                          </td>
                          <td className="py-4 px-3 font-semibold text-neutral-100">{item.teamName}</td>
                          <td className="py-4 px-3 text-neutral-400">{item.projectTitle}</td>
                          <td className="py-4 px-3 text-center font-medium text-indigo-400">
                            {item.judgeCount} {item.judgeCount === 1 ? "Judge" : "Judges"}
                          </td>
                          <td className="py-4 px-3 text-right font-extrabold text-neutral-50 flex items-center justify-end gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 shrink-0" />
                            {item.averageScore.toFixed(2)}
                          </td>
                          <td className="py-4 px-3 text-right font-medium text-emerald-400">
                            {item.percentage}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-xl p-16 text-center text-neutral-500 bg-neutral-900/10">
          <Calendar className="w-12 h-12 text-neutral-700 mb-3" />
          <p className="font-semibold text-sm">No Event Selected</p>
          <p className="text-xs mt-1">Please select a hackathon from the dropdown menu above to view evaluation standings.</p>
        </div>
      )}
    </div>
  );
}
