import { getOrganizerEvents } from "@/actions/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, Trophy } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const CreateEventDialog = dynamic(
  () => import("@/components/dashboard/create-event-dialog").then((mod) => mod.CreateEventDialog),
  {
    ssr: false,
    loading: () => <Button className="flex items-center gap-2 bg-neutral-800 text-neutral-400 font-semibold h-10 px-5" disabled>Loading...</Button>,
  }
);

export default async function OrganizerDashboardPage() {
  const session = await auth();

  if (!session || !session.user || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/auth/login");
  }

  const events = await getOrganizerEvents(session.user.id);

  // Statistics aggregates
  const totalEvents = events.length;
  const totalRegistrations = events.reduce((acc, ev) => acc + ev.registrations.length, 0);
  const totalTeams = events.reduce((acc, ev) => acc + ev.teams.length, 0);

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner and Quick Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-300 bg-clip-text text-transparent">
            Organizer Panel
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Build hackathons, manage participants registration, judge evaluations, and publish final leaderboards.
          </p>
        </div>

        {/* Create Event Dialog Action */}
        {(session.user.role === "SUPER_ADMIN" || events.length === 0) ? (
          <CreateEventDialog trigger={
            <Button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold h-10 px-5 shadow-lg shadow-violet-500/20 transition-all duration-300">
              <Plus className="w-5 h-5" />
              New Event
            </Button>
          } />
        ) : (
          <span className="text-neutral-500 text-xs font-semibold bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
            Organizers are limited to 1 active event.
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-800 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-400">Total Hackathons</CardTitle>
            <Calendar className="w-5 h-5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-50">{totalEvents}</div>
            <p className="text-xs text-neutral-500 mt-1">Hackathons configured</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-400">Total Registrations</CardTitle>
            <Users className="w-5 h-5 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-50">{totalRegistrations}</div>
            <p className="text-xs text-neutral-500 mt-1">Approved/Pending applicants</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-400">Teams Formed</CardTitle>
            <Trophy className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-50">{totalTeams}</div>
            <p className="text-xs text-neutral-500 mt-1">Active team configurations</p>
          </CardContent>
        </Card>
      </div>

      {/* Events Table / Configurations */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-100">Live & Draft Hackathons</h2>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Calendar className="w-12 h-12 text-neutral-600 mb-4" />
            <p className="text-neutral-300 font-semibold">No events configured yet</p>
            <p className="text-neutral-500 text-sm mt-1 max-w-sm">
              Click on the &quot;New Event&quot; button in the top right to build your first developer hackathon.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {events.map((event) => (
              <div key={event.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-850/40 transition-all duration-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-neutral-50 text-base">{event.title}</h3>
                    <Badge variant={
                      event.status === "PUBLISHED" ? "default" :
                      event.status === "DRAFT" ? "secondary" : "outline"
                    } className="capitalize text-xs font-medium">
                      {event.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Slug: <code className="bg-neutral-950 px-1 py-0.5 rounded text-neutral-400 font-mono">{event.slug}</code>
                  </p>
                  <p className="text-xs text-neutral-400">
                    Registration: {new Date(event.registrationStart).toLocaleDateString()} - {new Date(event.registrationEnd).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/organizer/events/${event.id}`}>
                    <Button variant="outline" className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs h-9 px-4">
                      Control Room
                    </Button>
                  </Link>
                  <Link href={`/dashboard/participant/events/${event.slug}`} target="_blank">
                    <Button variant="outline" className="border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 text-xs h-9 px-4">
                      View Page
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
