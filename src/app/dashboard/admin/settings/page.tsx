import { getPlatformSettings, getAuditLogs } from "@/actions/admin";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSettingsForm } from "@/components/dashboard/admin-settings-form";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const settings = await getPlatformSettings();
  const logs = await getAuditLogs();

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50">Settings & Audit Logs</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Configure platform parameters and audit system actions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form Column */}
        <div className="lg:col-span-1">
          <AdminSettingsForm initialSettings={settings as any} />
        </div>

        {/* Audit Logs Column */}
        <div className="lg:col-span-2">
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader className="border-b border-neutral-850/50">
              <CardTitle className="text-lg font-bold">Recent System Audit Trails</CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              {logs.length === 0 ? (
                <p className="text-sm text-neutral-500 py-8 text-center">Audit log is currently empty.</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-3 bg-neutral-950 border border-neutral-850/60 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                    >
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
        </div>
      </div>
    </div>
  );
}
