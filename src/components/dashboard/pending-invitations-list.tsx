"use client";

import React, { useState } from "react";
import { respondToTeamInvitation } from "@/actions/invitations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Users, Megaphone, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PendingInvitation {
  id: string;
  teamId: string;
  userId: string;
  team: {
    name: string;
    eventId: string;
    event: {
      title: string;
    };
    members: {
      userId: string;
      user: {
        name: string | null;
        email: string;
      };
    }[];
  };
}

interface PendingInvitationsListProps {
  initialInvites: PendingInvitation[];
}

export function PendingInvitationsList({ initialInvites }: PendingInvitationsListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResponse = async (teamId: string, accept: boolean) => {
    setLoadingId(teamId);
    setError(null);
    setSuccess(null);

    try {
      await respondToTeamInvitation(teamId, accept);
      setSuccess(accept ? "Successfully joined team!" : "Invitation declined.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to respond to invitation");
    } finally {
      setLoadingId(null);
    }
  };

  if (initialInvites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-800 rounded-xl bg-neutral-900/10 text-neutral-500 font-sans">
        <HelpCircle className="w-12 h-12 text-neutral-600 mb-4" />
        <p className="font-semibold text-sm">No Pending Invitations</p>
        <p className="text-xs mt-1">
          When team leaders invite you to their hackathon teams, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {error && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialInvites.map((invite) => {
          const leader = invite.team.members[0]; // Leader filtered in query
          return (
            <Card key={invite.teamId} className="bg-neutral-900/40 border-neutral-800 text-neutral-100 shadow-xl hover:border-neutral-750 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
              <CardContent className="p-6 space-y-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="font-extrabold text-neutral-50 text-lg truncate group-hover:text-violet-400 transition-colors">
                      {invite.team.name}
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-violet-500/30 bg-violet-500/10 text-violet-300 uppercase tracking-wider font-semibold">
                      {invite.team.event.title}
                    </Badge>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0 shadow-inner">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850/60 space-y-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 text-xs font-bold shrink-0">
                    {leader?.user.name ? leader.user.name.substring(0, 2).toUpperCase() : "LD"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Team Leader</p>
                    <p className="text-neutral-200 font-semibold text-xs truncate">
                      {leader?.user.name || "Leader"}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate font-mono">
                      {leader?.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    disabled={loadingId !== null}
                    onClick={() => handleResponse(invite.teamId, false)}
                    className="flex-1 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-450 hover:text-red-400 text-xs h-10 font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </Button>
                  <Button
                    disabled={loadingId !== null}
                    onClick={() => handleResponse(invite.teamId, true)}
                    className="flex-1 bg-violet-600 hover:bg-violet-750 text-neutral-100 text-xs h-10 font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-violet-500/15 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Accept Invite
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
