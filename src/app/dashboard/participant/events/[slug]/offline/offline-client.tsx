'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { 
  LucideRefreshCcw, 
  LucideUser, 
  LucideExternalLink, 
  LucideCheckCircle2, 
  LucideLogOut, 
  LucideSparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Coordinator {
  id: string;
  name: string | null;
  email: string;
}

interface Team {
  id: string;
  name: string;
  tableNo: string | null;
  coordinator: Coordinator | null;
  members: {
    id: string;
    user: {
      name: string | null;
      email: string;
    };
  }[];
  submissions: {
    id: string;
    repoUrl: string | null;
  }[];
}

interface OfflineConsoleClientProps {
  event: {
    title: string;
    collegeName: string;
    organizedBy: string;
    reviewPhases: any;
  };
  team: Team;
}

export function OfflineConsoleClient({ event, team }: OfflineConsoleClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    });
  };

  const reviewPhases = event.reviewPhases || {
    'Review 1': { active: true },
    'Review 2': { active: false },
    'Review 3': { active: false }
  };

  return (
    <div className="min-h-screen bg-[#02040a] bg-[linear-gradient(to_right,#09101f_1px,transparent_1px),linear-gradient(to_bottom,#09101f_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden p-6 md:p-10 select-none">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      {/* Header bar */}
      <header className="flex justify-between items-center border-b border-neutral-850 pb-5 mb-8">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black tracking-widest text-white uppercase font-mono mr-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            {event.collegeName || "HackPlatform"}
          </span>
          <div className="h-6 w-px bg-neutral-800 hidden sm:block"></div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-amber-500 tracking-wider uppercase italic">
              {event.title}
            </h1>
            <p className="text-[9px] text-neutral-500 font-mono tracking-widest uppercase mt-0.5">
              {event.organizedBy || "Organized by Department of CS, IoT & ECE"}
            </p>
          </div>
        </div>

        <button 
          onClick={() => window.close()}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-red-500/40 text-neutral-400 hover:text-red-400 text-xs font-semibold transition-all shadow-lg shadow-black/40"
        >
          <LucideLogOut className="w-3.5 h-3.5" />
          Exit
        </button>
      </header>

      {/* Welcome banner */}
      <div className="mb-10 space-y-2">
        <p className="text-cyan-400 text-[10px] font-black tracking-[0.4em] uppercase">Sector Phase Active</p>
        <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase">
          Welcome Team{" "}
          <span className="text-cyan-400 italic bg-cyan-950/20 px-4 py-1.5 rounded-2xl border border-cyan-500/25 drop-shadow-[0_0_15px_rgba(34,211,238,0.55)]">
            {team.name}
          </span>
        </h2>
      </div>

      {/* Primary two-column layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
        
        {/* Left Column: Huge QR Code Card */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative group w-full max-w-sm">
            {/* Pulsing card glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-amber-500 rounded-3xl blur opacity-60 group-hover:opacity-85 transition duration-1000"></div>
            
            <div className="relative bg-neutral-950 border border-neutral-850 rounded-[2.5rem] p-8 flex flex-col items-center shadow-2xl">
              <div className="bg-white p-6 rounded-3xl shadow-inner border border-neutral-800 flex flex-col items-center justify-center w-full aspect-square">
                <QRCodeSVG 
                  value={team.id} 
                  size={240} 
                  level="H" 
                  includeMargin={true}
                  className="w-full h-full"
                />
              </div>

              <div className="w-full mt-6 space-y-2">
                <div className="flex items-center justify-center gap-1.5 bg-[#080d1a] border border-blue-550/20 py-2.5 px-4 rounded-2xl text-center">
                  <LucideUser className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-black text-cyan-300 uppercase tracking-wider truncate">{team.name}</span>
                </div>
                <p className="text-[9px] font-mono text-neutral-500 text-center select-all tracking-wider break-all">{team.id}</p>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black tracking-[0.4em] text-neutral-450 uppercase mt-4 text-center block">
            Scan for Reviews
          </span>
        </div>

        {/* Right Column: Profile & Submissions */}
        <div className="lg:col-span-7 space-y-6 w-full">
          
          {/* Team Profile Card */}
          <div className="relative bg-neutral-950 border border-neutral-850 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-3.5">
              <h3 className="text-sm font-extrabold text-neutral-100 uppercase tracking-widest font-mono">Team Profile</h3>
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 bg-[#0c0d12] border border-neutral-850 hover:border-violet-500/50 rounded-lg text-neutral-450 hover:text-white transition-all shadow-inner"
              >
                <LucideRefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Team Name and Table No */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-black block">Team Name</span>
                  <p className="text-lg font-black text-cyan-400 uppercase truncate mt-1">{team.name}</p>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-black block">Table No</span>
                  <div className="mt-1 px-4 py-1.5 bg-amber-500/10 border border-amber-500/35 rounded-xl text-amber-400 text-xs font-black uppercase w-fit tracking-wider animate-pulse shadow-md shadow-amber-500/5">
                    {team.tableNo || "TBD"}
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div>
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-black block mb-2">Team Members</span>
                <div className="flex flex-wrap gap-2">
                  {team.members.map(member => (
                    <span key={member.id} className="px-3.5 py-2 bg-neutral-900 border border-neutral-850 rounded-xl text-xs font-extrabold text-neutral-300 shadow-sm">
                      {member.user.name || member.user.email}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assigned Coordinator info */}
              <div className="border-t border-neutral-850 pt-4">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-black block mb-2">Assigned Coordinator</span>
                {team.coordinator ? (
                  <div className="flex items-center justify-between p-3.5 bg-neutral-900 border border-neutral-850 rounded-2xl shadow-sm">
                    <div>
                      <p className="text-sm font-extrabold text-amber-500 uppercase">{team.coordinator.name || "Coordinator"}</p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{team.coordinator.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Online
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 italic">No coordinator assigned yet</p>
                )}
              </div>

              {/* Evaluation reviews phases list */}
              <div className="border-t border-neutral-850 pt-4">
                <span className="text-[9px] text-neutral-505 uppercase tracking-widest font-black block mb-3">Evaluation Phase</span>
                <div className="grid grid-cols-3 gap-3">
                  {Object.keys(reviewPhases).map((phase) => {
                    const isActive = reviewPhases[phase]?.active;
                    return (
                      <div 
                        key={phase}
                        className={`p-3.5 border rounded-2xl text-center flex flex-col justify-center transition-all ${
                          isActive
                            ? "bg-emerald-950/20 border-emerald-500 text-emerald-450 shadow-[0_0_15px_rgba(16,185,129,0.25)] animate-pulse"
                            : "bg-neutral-900 border-neutral-850 text-neutral-600"
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider block">{phase}</span>
                        <span className="text-[8px] uppercase tracking-widest font-black block mt-0.5 font-mono">
                          {isActive ? "Active" : "Closed"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Submission / Project Link Card */}
          <div className="relative bg-neutral-950 border border-neutral-850 rounded-3xl p-6 shadow-2xl overflow-hidden space-y-4">
            {/* GitHub logo watermark background */}
            <div className="absolute right-4 bottom-4 text-white/[0.02] pointer-events-none">
              <svg className="w-28 h-28" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-amber-500 uppercase tracking-widest font-black block">Submission</span>
              <h3 className="text-xl font-extrabold text-neutral-100 tracking-tight">Project Link</h3>
            </div>

            <div className="space-y-3 relative z-10">
              <div>
                <span className="text-[9px] text-neutral-500 uppercase font-mono tracking-wider block">GitHub Repository</span>
                <div className="flex items-center gap-2.5 bg-neutral-900 border border-neutral-850 p-3.5 rounded-2xl mt-1.5 text-xs text-neutral-300 font-semibold select-all">
                  <svg className="w-4 h-4 text-violet-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.167 22 16.418 22 12.017c0-5.533-4.477-10.017-10-10.017z" />
                  </svg>
                  <span className="truncate">{team.submissions[0]?.repoUrl || "No Repository Submitted"}</span>
                </div>
              </div>

              <Button
                disabled
                className="w-full bg-[#0a0a0c] hover:bg-[#0a0a0c] text-neutral-500 border border-neutral-850 text-xs font-black h-11 uppercase tracking-wider"
              >
                Submissions Closed
              </Button>
              <p className="text-[9px] text-center text-neutral-550 font-bold uppercase tracking-wide">Ensure your repository is public or access is shared.</p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-neutral-850 text-center">
        <p className="text-[9px] font-black text-neutral-500 tracking-[0.25em] uppercase leading-relaxed">
          © {event.title} 2026 • Organized by {event.collegeName || "HackPlatform"}
        </p>
      </footer>

    </div>
  );
}
