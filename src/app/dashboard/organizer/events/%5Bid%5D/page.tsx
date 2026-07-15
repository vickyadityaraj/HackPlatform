import { prisma } from "@/lib/prisma";
import { getEventRegistrations, getEventTeams } from "@/actions/organizer";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Users, ShieldAlert, BadgeInfo, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const FormBuilder = dynamic(
  () => import("@/components/dashboard/form-builder").then((mod) => mod.FormBuilder),
  {
    ssr: false,
    loading: () => <div className="p-8 text-center text-neutral-500 text-xs">Loading form builder...</div>,
  }
);

const RegistrationsClient = dynamic(() => import("./registrations-client"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-neutral-500 text-xs">Loading registrations...</div>,
});

const JudgesClient = dynamic(() => import("./judges-client"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-neutral-500 text-xs">Loading judges...</div>,
});

interface EventControlRoomProps {
  params: Promise<{ id: string }>;
}

export default async function EventControlRoom({ params }: EventControlRoomProps) {
  const session = await auth();
  
  if (!session || !session.user || session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: {
      judges: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!event || (event.organizerId !== session.user.id && session.user.role !== "SUPER_ADMIN")) {
    redirect("/dashboard/organizer");
  }

  // Load related tables in parallel, skipping redundant auth checks since the page has already guarded the role and organizer ID
  const [registrations, teams] = await Promise.all([
    getEventRegistrations(id, true),
    getEventTeams(id, true),
  ]);

  return (
    <div className="space-y-6 font-sans">
      {/* Event Header info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-50">{event.title}</h1>
            <Badge variant="default" className="capitalize text-xs font-semibold">
              {event.status.toLowerCase()}
            </Badge>
          </div>
          <p className="text-neutral-500 text-xs mt-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Hackathon Dates: {new Date(event.eventStart).toLocaleDateString()} - {new Date(event.eventEnd).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-lg flex max-w-2xl mb-8">
          <TabsTrigger
            value="form"
            className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Form Questions
          </TabsTrigger>
          <TabsTrigger
            value="registrations"
            className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Registrants
            {registrations.filter(r => r.status === "PENDING").length > 0 && (
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse ml-0.5" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Teams formed
          </TabsTrigger>
          <TabsTrigger
            value="judges"
            className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Judges
          </TabsTrigger>
        </TabsList>

        {/* Custom Question Builder Tab */}
        <TabsContent value="form">
          <FormBuilder eventId={event.id} initialQuestions={event.customQuestions as any || []} />
        </TabsContent>

        {/* Registrants Approvals Tab */}
        <TabsContent value="registrations">
          <RegistrationsClient initialRegistrations={registrations as any} />
        </TabsContent>

        {/* Team Rosters Tab */}
        <TabsContent value="teams">
          {teams.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8 bg-neutral-900/10 rounded-lg">
              No teams formed yet for this event.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team) => (
                <Card key={team.id} className="bg-neutral-900 border-neutral-800 text-neutral-100">
                  <CardHeader className="pb-3 border-b border-neutral-850">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span>{team.name}</span>
                      <span className="text-xs text-neutral-500 font-medium font-mono">
                        {team.members.length} Members
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-4 space-y-3">
                    {/* Leader */}
                    <div className="text-xs">
                      <p className="text-neutral-500 font-semibold mb-1 flex items-center gap-1">
                        <BadgeInfo className="h-3.5 h-3.5 text-violet-400" />
                        Team Leader:
                      </p>
                      <div className="bg-neutral-950 p-2 rounded border border-neutral-850">
                        {team.members.find(m => m.userId === team.leaderId)?.user.name || "Leader"} 
                        <span className="text-neutral-500 font-mono text-[10px] ml-1.5">
                          ({team.members.find(m => m.userId === team.leaderId)?.user.email})
                        </span>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="text-xs">
                      <p className="text-neutral-500 font-semibold mb-1 flex items-center gap-1">
                        <Users className="h-3.5 h-3.5 text-indigo-400" />
                        Roster:
                      </p>
                      <ul className="space-y-1">
                        {team.members.map((m) => (
                          <li key={m.id} className="bg-neutral-950/50 p-1.5 rounded text-[11px] flex justify-between">
                            <span>{m.user.name || "Member"}</span>
                            <span className="text-neutral-600 font-mono">{m.user.email}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Judges Tab */}
        <TabsContent value="judges">
          <JudgesClient eventId={event.id} initialJudges={event.judges as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
