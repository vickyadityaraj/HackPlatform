"use client";

import { useState } from "react";
import { updateRegistrationStatus } from "@/actions/organizer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Image as ImageIcon } from "lucide-react";

interface Registration {
  id: string;
  status: string;
  createdAt: Date;
  answers: any;
  paymentScreenshotUrl?: string | null;
  user: {
    name: string | null;
    email: string;
  };
}

interface RegistrationsClientProps {
  initialRegistrations: Registration[];
}

export default function RegistrationsClient({ initialRegistrations }: RegistrationsClientProps) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setLoadingId(id);
    try {
      await updateRegistrationStatus(id, newStatus);
      setRegistrations((prev) =>
        prev.map((reg) => (reg.id === id ? { ...reg, status: newStatus } : reg))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {registrations.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center py-8 bg-neutral-900/10 rounded-lg">
          No registrations recorded for this event.
        </p>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-850">
          {registrations.map((reg) => (
            <div key={reg.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-neutral-100">{reg.user.name || "Anonymous User"}</span>
                  <span className="text-xs text-neutral-500 font-mono">({reg.user.email})</span>
                  <Badge
                    variant={
                      reg.status === "APPROVED" ? "default" :
                      reg.status === "REJECTED" ? "destructive" : "outline"
                    }
                    className="capitalize text-[10px]"
                  >
                    {reg.status.toLowerCase()}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500">Registered: {new Date(reg.createdAt).toLocaleString()}</p>
                {reg.answers && (Array.isArray(reg.answers) ? reg.answers.length > 0 : Object.keys(reg.answers).length > 0) && (
                  <div className="text-xs bg-neutral-950 p-2 rounded border border-neutral-850 mt-1 space-y-1">
                    <p className="text-neutral-400 font-semibold mb-1">Custom Answers:</p>
                    {Array.isArray(reg.answers) ? (
                      (reg.answers as any[]).map((ans: any, idx: number) => (
                        <div key={idx}>
                          <span className="text-neutral-500 font-medium">Question ID ({ans.questionId}):</span>{" "}
                          <span className="text-neutral-300">{typeof ans.answer === 'object' ? JSON.stringify(ans.answer) : String(ans.answer)}</span>
                        </div>
                      ))
                    ) : (
                      Object.entries(reg.answers).map(([key, val]: any) => (
                        <div key={key}>
                          <span className="text-neutral-500 font-medium">{key}:</span>{" "}
                          <span className="text-neutral-300">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {reg.paymentScreenshotUrl && (
                  <div className="text-xs bg-neutral-950 p-3 rounded-xl border border-neutral-850 mt-2 space-y-2 max-w-sm">
                    <p className="text-violet-400 font-bold flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      Payment Proof Screenshot:
                    </p>
                    <div className="relative group overflow-hidden rounded border border-neutral-800 bg-neutral-900 aspect-video max-h-[140px]">
                      <img
                        src={reg.paymentScreenshotUrl}
                        alt="Payment screenshot"
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(reg.paymentScreenshotUrl || "", "_blank")}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500 italic">Click image to view full screen in a new tab</p>
                  </div>
                )}
              </div>

              {reg.status === "PENDING" && (
                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 w-8 p-0"
                    disabled={loadingId === reg.id}
                    onClick={() => handleStatusUpdate(reg.id, "APPROVED")}
                  >
                    {loadingId === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    disabled={loadingId === reg.id}
                    onClick={() => handleStatusUpdate(reg.id, "REJECTED")}
                  >
                    {loadingId === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
