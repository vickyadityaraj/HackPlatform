import Link from "next/link";
import { auth } from "@/auth";
import { ArrowRight, BrainCircuit, Code2, Trophy, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[40%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[40%] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/15">
              <span className="text-base font-bold text-white">H</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Hackathon Portal</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
            <Link href="/matchmaking" className="hover:text-slate-200 transition-colors">
              Matchmaking Hub
            </Link>
            <Link href="/events/global-hackathon-2026" className="hover:text-slate-200 transition-colors">
              Featured Event
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-md shadow-blue-500/10"
                )}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors mr-4">
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-md shadow-blue-500/10"
                  )}
                >
                  Register Now
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center py-20 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/25 bg-blue-500/5 text-xs text-blue-400 mb-6 font-medium tracking-wide">
          <BrainCircuit className="h-3.5 w-3.5" />
          <span>Next-Generation Hackathon Experience</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mb-6 leading-tight">
          Where Developers{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
            Collaborate, Build,
          </span>{" "}
          and Win
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Create teams, connect with top-tier developers, submit dynamic projects, and compete on transparent, real-time leaderboard grids.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "w-full sm:w-auto px-8 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/15"
              )}
            >
              Go to Workspace
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/register"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "w-full sm:w-auto px-8 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/15"
                )}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/matchmaking"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto px-8 border-slate-800 text-slate-300 hover:bg-slate-900/60 hover:text-slate-100"
                )}
              >
                Find Teammates
              </Link>
            </>
          )}
        </div>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-24">
          <div className="border border-slate-900 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl text-left hover:border-slate-800 transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 shadow-sm shadow-blue-500/5">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Team Matchmaking</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Find partners based on skill sets, colleges, or experience levels. Send and manage cryptographically secured team invites.
            </p>
          </div>

          <div className="border border-slate-900 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl text-left hover:border-slate-800 transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 shadow-sm shadow-indigo-500/5">
              <Trophy className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Real-time Leaderboards</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track your hackathon progress, view scores from professional evaluators, and watch live team stats as they update.
            </p>
          </div>

          <div className="border border-slate-900 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl text-left hover:border-slate-800 transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 shadow-sm shadow-violet-500/5">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Organizer Dashboard</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Custom question form builders, judge allocation grids, announcements manager, and fee structures all in one central location.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <p>© 2026 Hackathon Portal. Built with Next.js 15, Prisma & Supabase.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
