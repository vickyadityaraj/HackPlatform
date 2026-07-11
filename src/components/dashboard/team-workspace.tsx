"use client";

import React, { useState } from "react";
import { leaveTeam, removeMember, transferOwnership } from "@/actions/teams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link as LinkIcon, Trash, RefreshCw, ArrowRightLeft, ShieldAlert, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  userId: string;
  role: "LEADER" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Team {
  id: string;
  name: string;
  eventId: string;
  leaderId: string;
  inviteToken: string;
  inviteExpiresAt: string | Date;
  event: {
    title: string;
  };
  members: Member[];
  submissions: {
    id: string;
    title: string;
    status: string;
  }[];
}

interface TeamWorkspaceProps {
  initialTeams: {
    id: string;
    teamId: string;
    userId: string;
    team: Team;
  }[];
  currentUserId: string;
}

export function TeamWorkspace({ initialTeams, currentUserId }: TeamWorkspaceProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (token: string, teamId: string) => {
    // Generate full URL
    const url = `${window.location.origin}/join-team?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(teamId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLeave = async (teamId: string) => {
    if (!confirm("Are you sure you want to leave this team?")) return;
    setLoadingId(teamId);
    setError(null);
    try {
      await leaveTeam(teamId);
      setSuccess("Successfully left the team");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to leave team");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (teamId: string, memberUserId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setLoadingId(memberUserId);
    setError(null);
    try {
      await removeMember(teamId, memberUserId);
      setSuccess("Successfully removed member");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    } finally {
      setLoadingId(null);
    }
  };

  const handleTransfer = async (teamId: string, memberUserId: string) => {
    if (!confirm("Are you sure you want to transfer leadership to this member? You will lose leader control.")) return;
    setLoadingId(memberUserId);
    setError(null);
    try {
      await transferOwnership(teamId, memberUserId);
      setSuccess("Successfully transferred leadership");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to transfer leadership");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-300 bg-clip-text text-transparent">
          Team Workspace
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Coordinate hackathon team parameters, invite other developers, and inspect project evaluations.
        </p>
      </div>

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

      {initialTeams.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-neutral-600 mb-4" />
            <p className="font-semibold text-neutral-300">You are not in any teams yet</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Register for active hackathons, create teams inside the event control panels, or join other teams using token invite links.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {initialTeams.map((mapped) => {
            const team = mapped.team;
            const isLeader = team.leaderId === currentUserId;
            const submission = team.submissions[0];

            return (
              <Card key={team.id} className="bg-neutral-900 border-neutral-800 text-neutral-100 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-neutral-850/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      {team.name}
                      <Badge variant="outline" className="text-xs border-violet-500/30 bg-violet-500/10 text-violet-300">
                        {team.event.title}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-neutral-400 text-xs mt-1">
                      Event-wide team ID: <code className="bg-neutral-950 px-1 py-0.5 rounded font-mono text-neutral-500">{team.id}</code>
                    </CardDescription>
                  </div>

                  {/* Leave / Action Buttons */}
                  <div className="flex items-center gap-2">
                    {!isLeader && (
                      <Button
                        variant="destructive"
                        disabled={loadingId === team.id}
                        onClick={() => handleLeave(team.id)}
                        className="border border-red-950 bg-red-950/10 hover:bg-red-950/30 text-red-400 text-xs h-9 px-4 flex items-center gap-2 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Leave Team
                      </Button>
                    )}
                    {isLeader && (
                      <Button
                        type="button"
                        disabled={copiedId === team.id}
                        onClick={() => handleCopyLink(team.inviteToken, team.id)}
                        className="bg-violet-600 hover:bg-violet-750 text-neutral-100 text-xs h-9 px-4 flex items-center gap-2 shadow-md shadow-violet-500/15"
                      >
                        <LinkIcon className="w-4 h-4" />
                        {copiedId === team.id ? "Link Copied!" : "Invite Link"}
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="py-6 space-y-6">
                  {/* Submission Status widget */}
                  <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-850/50 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Project Submission</h4>
                      <p className="text-sm font-semibold mt-1">
                        {submission ? submission.title : "No project submitted yet"}
                      </p>
                    </div>
                    {submission && (
                      <Badge variant={
                        submission.status === "EVALUATED" ? "default" : "secondary"
                      } className="text-xs">
                        {submission.status}
                      </Badge>
                    )}
                  </div>

                  {/* Members Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Team Roster</h4>
                    <div className="border border-neutral-800 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-neutral-950">
                          <TableRow className="border-neutral-800 hover:bg-transparent">
                            <TableHead className="text-neutral-400 font-semibold h-10">Name</TableHead>
                            <TableHead className="text-neutral-400 font-semibold h-10">Email</TableHead>
                            <TableHead className="text-neutral-400 font-semibold h-10">Role</TableHead>
                            {isLeader && <TableHead className="text-neutral-400 font-semibold h-10 text-right">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {team.members.map((member) => (
                            <TableRow key={member.id} className="border-neutral-800 hover:bg-neutral-850/30">
                              <TableCell className="font-semibold text-neutral-200">
                                {member.user.name || "Unnamed Developer"}
                                {member.user.id === currentUserId && " (You)"}
                              </TableCell>
                              <TableCell className="text-neutral-400 text-xs">{member.user.email}</TableCell>
                              <TableCell>
                                <Badge variant={member.role === "LEADER" ? "default" : "outline"} className="capitalize text-[10px] h-5">
                                  {member.role.toLowerCase()}
                                </Badge>
                              </TableCell>
                              
                              {/* Leader Administrative controls */}
                              {isLeader && (
                                <TableCell className="text-right">
                                  {member.user.id !== currentUserId && (
                                    <div className="inline-flex gap-1.5">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        disabled={loadingId === member.userId}
                                        onClick={() => handleTransfer(team.id, member.userId)}
                                        title="Transfer Leadership"
                                        className="text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800 w-8 h-8 rounded"
                                      >
                                        <ArrowRightLeft className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        disabled={loadingId === member.userId}
                                        onClick={() => handleRemove(team.id, member.userId)}
                                        title="Remove Member"
                                        className="text-neutral-400 hover:text-red-400 hover:bg-neutral-800 w-8 h-8 rounded"
                                      >
                                        <Trash className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
