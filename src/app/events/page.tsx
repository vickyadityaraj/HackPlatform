import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Award, Users, ArrowRight, Hourglass, MapPin, Globe } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ExploreEventsPage() {
  // Fetch all published, non-deleted events
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
    },
    orderBy: {
      eventStart: "asc",
    },
    include: {
      registrations: {
        select: { id: true },
      },
    },
  });

  const getEventRegistrationStatus = (registrationStart: Date, registrationEnd: Date) => {
    const now = new Date();
    if (now < registrationStart) {
      return { label: "Upcoming", variant: "secondary" as const };
    }
    if (now > registrationEnd) {
      return { label: "Registration Closed", variant: "outline" as const };
    }
    return { label: "Open for Registration", variant: "default" as const };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/15">
              <span className="text-base font-bold text-white">H</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">HackPlatform</span>
          </Link>
          
          <nav className="flex items-center gap-6 text-sm text-slate-400 font-medium">
            <Link href="/matchmaking" className="hover:text-slate-200 transition-colors">
              Matchmaking Hub
            </Link>
            <Link href="/events" className="text-slate-100 transition-colors">
              Events
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Active Technical Challenges
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Discover coding challenges, innovation hackathons, cybersecurity contests, and technical workshops. Form teams, build products, and win grand rewards.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <Calendar className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-350">No events active right now</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Check back soon! Event organizers are coordinating new schedules and setup parameters in their control dashboards.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => {
              const regStatus = getEventRegistrationStatus(event.registrationStart, event.registrationEnd);
              // Parse prizes for headline value
              const prizes = event.prizes ? (typeof event.prizes === "string" ? JSON.parse(event.prizes) : event.prizes) : [];
              const grandPrize = prizes.find((p: any) => p.rank === 1)?.reward || "Goodies & Swag";

              return (
                <Card key={event.id} className="bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-100 shadow-xl hover:shadow-violet-600/5 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  <div>
                    {/* Event Card Header */}
                    <CardHeader className="p-6 border-b border-slate-850 pb-4 space-y-2 relative">
                      <div className="flex justify-between items-start gap-3">
                        <Badge variant={regStatus.variant} className="text-[10px] font-semibold uppercase tracking-wider">
                          {regStatus.label}
                        </Badge>
                        <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-violet-400" />
                          <span>{event.registrations.length} Joined</span>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors mt-2">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="text-slate-500 text-[11px] font-mono mt-1">
                        Slug: <code className="bg-slate-950/80 px-1 py-0.5 rounded text-slate-400">{event.slug}</code>
                      </CardDescription>
                    </CardHeader>

                    {/* Card Content body */}
                    <CardContent className="p-6 space-y-5 text-sm">
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                        {event.description}
                      </p>

                      <div className="space-y-2 border-t border-slate-850/60 pt-4 text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>Event Run: {new Date(event.eventStart).toLocaleDateString()} - {new Date(event.eventEnd).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Hourglass className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>Apply By: {new Date(event.registrationEnd).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Award className="w-4 h-4 text-yellow-500 shrink-0" />
                          <span className="font-semibold text-slate-200">Grand Prize: {grandPrize}</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Footer action */}
                  <CardFooter className="p-6 pt-0">
                    <Link href={`/events/${event.slug}`} className="w-full">
                      <Button className="w-full bg-slate-950 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 text-slate-350 hover:text-slate-100 text-xs font-semibold h-10 flex items-center justify-center gap-2 transition-all">
                        View Hackathon Room
                        <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
