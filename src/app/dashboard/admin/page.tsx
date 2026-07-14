import { getPlatformSettings, getUsersList, getAuditLogs } from "@/actions/admin";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Settings, ScrollText, Calendar, Lock } from "lucide-react";
import dynamic from "next/dynamic";

const UserManagementTable = dynamic(
  () => import("@/components/dashboard/user-management-table").then((mod) => mod.UserManagementTable),
  {
    ssr: false,
    loading: () => <div className="p-8 text-center text-neutral-500 text-xs">Loading user management...</div>,
  }
);

const AdminSettingsForm = dynamic(
  () => import("@/components/dashboard/admin-settings-form").then((mod) => mod.AdminSettingsForm),
  {
    ssr: false,
    loading: () => <div className="p-8 text-center text-neutral-500 text-xs">Loading settings...</div>,
  }
);

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Load admin panels data in parallel
  const [settings, users, logs] = await Promise.all([
    getPlatformSettings(),
    getUsersList(),
    getAuditLogs(),
  ]);

  const totalUsers = users.length;
  const suspendedUsers = users.filter((u) => u.status === "SUSPENDED").length;
  const organizers = users.filter((u) => u.role === "ORGANIZER").length;

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-300 bg-clip-text text-transparent">
          Super Admin Console
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Perform administrative configurations, assign roles, audit user actions, and modify platform settings.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-800 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-400">Total Platform Users</CardTitle>
            <Users className="w-5 h-5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-50">{totalUsers}</div>
            <p className="text-xs text-neutral-500 mt-1">Active registered user accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-400">Organizers Approved</CardTitle>
            <Calendar className="w-5 h-5 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-50">{organizers}</div>
            <p className="text-xs text-neutral-500 mt-1">Hackathon organizer accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-400">Locked / Suspended</CardTitle>
            <Lock className="w-5 h-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-50">{suspendedUsers}</div>
            <p className="text-xs text-neutral-500 mt-1">Accounts suspended for terms violations</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-lg flex max-w-lg mb-8">
          <TabsTrigger
            value="users"
            className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            User Management
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="flex-1 py-2 text-xs font-semibold rounded-md text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
          >
            <ScrollText className="w-3.5 h-3.5" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Users Management */}
        <TabsContent value="users">
          <UserManagementTable users={users as any} currentUserId={session.user.id} />
        </TabsContent>

        {/* settings */}
        <TabsContent value="settings">
          <AdminSettingsForm initialSettings={settings as any} />
        </TabsContent>

        {/* Audit Log list */}
        <TabsContent value="logs">
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader className="border-b border-neutral-850/50">
              <CardTitle className="text-lg font-bold">Recent System Audit Trails</CardTitle>
            </CardHeader>
            <CardContent className="py-6 space-y-4">
              {logs.length === 0 ? (
                <p className="text-sm text-neutral-500 py-8 text-center">Audit log is currently empty.</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 bg-neutral-950 border border-neutral-850/60 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-violet-400">{log.action}</span>
                          <span className="text-neutral-500">by {log.user?.email || "System"}</span>
                        </div>
                        {log.details && (
                          <pre className="text-[10px] text-neutral-400 font-mono bg-neutral-900 p-1.5 rounded mt-1 overflow-x-auto max-w-full">
                            {JSON.stringify(log.details)}
                          </pre>
                        )}
                      </div>
                      <span className="text-neutral-600 self-start sm:self-center">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
