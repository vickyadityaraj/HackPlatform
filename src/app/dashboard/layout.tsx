import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Award, 
  FileText, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  Menu,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const { name, email, role } = session.user;

  // Determine sidebar links based on user role
  const getSidebarLinks = () => {
    const base = [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ];

    if (role === "SUPER_ADMIN") {
      return [
        ...base,
        { href: "/dashboard/admin/users", label: "Manage Users", icon: Users },
        { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
      ];
    }

    if (role === "ORGANIZER") {
      return [
        ...base,
        { href: "/dashboard/organizer/events", label: "My Events", icon: Calendar },
        { href: "/dashboard/organizer/evaluations", label: "Evaluations", icon: Award },
      ];
    }

    if (role === "JUDGE") {
      return [
        ...base,
        { href: "/dashboard/judge", label: "Submissions Review", icon: FileText },
      ];
    }

    // Participant default
    return [
      ...base,
      { href: "/dashboard/participant/profile", label: "My Profile", icon: UserIcon },
      { href: "/dashboard/participant/teams", label: "My Teams", icon: Users },
      { href: "/dashboard/participant/invites", label: "Invites", icon: Mail },
      { href: "/dashboard/participant/matchmaking", label: "Matchmaking Hub", icon: Users },
      { href: "/dashboard/participant/events", label: "Explore Events", icon: Calendar },
    ];
  };

  const links = getSidebarLinks();

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Sidebar Panel */}
      <aside className="hidden md:flex flex-col w-64 border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-md">
        {/* Platform Brand */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <Link href="/" className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            HackPlatform
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60 transition-all duration-200"
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Session Info Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold uppercase">
              {name ? name.substring(0, 2) : "US"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{name || "User"}</p>
              <p className="text-xs text-neutral-500 truncate capitalize">{role.toLowerCase().replace("_", " ")}</p>
            </div>
          </div>
          
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/login" });
            }}
          >
            <Button
              type="submit"
              variant="destructive"
              className="w-full flex items-center justify-center gap-2 border border-red-950/50 bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-red-300 text-xs h-9 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/30">
          <button className="md:hidden text-neutral-400 hover:text-neutral-100">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 capitalize">
              {role.toLowerCase().replace("_", " ")} Workspace
            </span>
          </div>
        </header>

        {/* Workspace Scroll Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-neutral-950">
          {children}
        </main>
      </div>
    </div>
  );
}
