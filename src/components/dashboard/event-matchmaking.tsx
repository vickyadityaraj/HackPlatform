"use client";

import React, { useState, useTransition } from "react";
import { toggleEventInterest, sendTeamUpContactRequest } from "@/actions/matchmaking";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Github, Linkedin, Briefcase, Globe, GraduationCap, UserPlus, Heart, MessageSquare, Loader2, Sparkles, Users } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  profile: {
    bio: string | null;
    college: string | null;
    country: string | null;
    experience: string | null;
    skills: string[];
    githubUrl: string | null;
    linkedInUrl: string | null;
    portfolioUrl: string | null;
  } | null;
}

interface EventMatchmakingProps {
  eventId: string;
  eventTitle: string;
  initialIsInterested: boolean;
  interestedUsers: UserProfile[];
}

export function EventMatchmaking({ eventId, eventTitle, initialIsInterested, interestedUsers }: EventMatchmakingProps) {
  const [isPending, startTransition] = useTransition();
  const [isInterested, setIsInterested] = useState(initialIsInterested);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pitch modal states
  const [pitchTarget, setPitchTarget] = useState<UserProfile | null>(null);
  const [pitchMessage, setPitchMessage] = useState("");
  const [sendingPitch, setSendingPitch] = useState(false);
  const [pitchSuccess, setPitchSuccess] = useState(false);
  const [pitchError, setPitchError] = useState<string | null>(null);

  const handleInterestToggle = () => {
    startTransition(async () => {
      try {
        await toggleEventInterest(eventId);
        setIsInterested(!isInterested);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleOpenPitch = (user: UserProfile) => {
    setPitchTarget(user);
    setPitchMessage(`Hey ${user.name || "there"}, I saw your profile on the interested candidate list for "${eventTitle}". I'd love to connect and team up together for this hackathon!`);
    setPitchSuccess(false);
    setPitchError(null);
  };

  const handleSendPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchTarget) return;

    setSendingPitch(true);
    setPitchError(null);
    try {
      await sendTeamUpContactRequest(eventId, pitchTarget.id, pitchMessage);
      setPitchSuccess(true);
      setTimeout(() => {
        setPitchTarget(null);
      }, 1500);
    } catch (err: any) {
      setPitchError(err.message || "Failed to send contact pitch request");
    } finally {
      setSendingPitch(false);
    }
  };

  // Client-side search filtering
  const filteredUsers = interestedUsers.filter((user) => {
    const term = searchQuery.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(term);
    const bioMatch = user.profile?.bio?.toLowerCase().includes(term);
    const collegeMatch = user.profile?.college?.toLowerCase().includes(term);
    const skillsMatch = user.profile?.skills?.some(s => s.toLowerCase().includes(term));
    return nameMatch || bioMatch || collegeMatch || skillsMatch;
  });

  return (
    <div className="space-y-6 font-sans">
      {!isInterested ? (
        <Card className="relative overflow-hidden border border-neutral-800 bg-neutral-900/30 p-8 md:p-12 text-center rounded-2xl shadow-2xl group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-550 pointer-events-none" />
          <div className="max-w-xl mx-auto space-y-5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-neutral-50">Find Teammates & Collaborate</h2>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Declare your interest in this event to view other participants looking for team members. You will be able to search profiles, view bios/skills, and send direct teammate pitches or invitations.
            </p>
            <Button
              disabled={isPending}
              onClick={handleInterestToggle}
              className="bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold h-11 px-8 shadow-lg shadow-violet-500/15 rounded-xl transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2 fill-current" />
                  Show Interest
                </>
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900/40 p-4 border border-neutral-850 rounded-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Active Interest Declared</span>
              </div>
              <p className="text-[11px] text-neutral-500">Your profile is visible to other team leaders and participants looking for co-founders.</p>
            </div>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={handleInterestToggle}
              className="border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-red-400 hover:bg-red-950/20 text-xs h-8 px-3 rounded-lg"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Withdraw Interest"}
            </Button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skills, bio, or college..."
              className="pl-10 bg-neutral-900 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs h-10 rounded-xl placeholder:text-neutral-600"
            />
          </div>

          {/* Candidates grid */}
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center bg-neutral-900/10 border border-neutral-850/60 border-dashed rounded-2xl">
              <Users className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-400">No interested developers found</p>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto mt-1">Try broadening your search criteria or write different skill keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => {
                const init = user.name ? user.name.substring(0, 2).toUpperCase() : "DV";
                return (
                  <Card key={user.id} className="bg-neutral-900/40 border-neutral-800 text-neutral-100 shadow-xl hover:border-neutral-750 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                    <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                      <div className="space-y-4">
                        {/* Upper Section */}
                        <div className="flex items-start gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt="Avatar"
                              className="w-10 h-10 rounded-xl object-cover border border-neutral-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-extrabold text-xs">
                              {init}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-neutral-100 text-sm truncate group-hover:text-violet-400 transition-colors">
                              {user.name || "Teammate"}
                            </h3>
                            {user.profile?.college && (
                              <p className="text-[10px] text-neutral-500 truncate flex items-center gap-1 mt-0.5">
                                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                                {user.profile.college}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Experience Level */}
                        {user.profile?.experience && (
                          <div className="inline-flex items-center gap-1 text-[9px] text-violet-400 font-bold bg-violet-500/5 px-2 py-0.5 rounded border border-violet-500/10 uppercase tracking-wide">
                            <Briefcase className="w-3 h-3" />
                            {user.profile.experience}
                          </div>
                        )}

                        {/* Bio snippet */}
                        {user.profile?.bio && (
                          <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                            {user.profile.bio}
                          </p>
                        )}

                        {/* Skills */}
                        {user.profile?.skills && user.profile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {user.profile.skills.slice(0, 4).map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="text-[8px] border-neutral-800 bg-neutral-950 text-neutral-450 uppercase py-0 px-1.5 font-bold">
                                {skill}
                              </Badge>
                            ))}
                            {user.profile.skills.length > 4 && (
                              <span className="text-[9px] text-neutral-500 font-bold ml-1">+{user.profile.skills.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Lower Actions Section */}
                      <div className="pt-3 border-t border-neutral-850/60 flex items-center justify-between gap-3 mt-auto">
                        {/* Social Links */}
                        <div className="flex gap-2">
                          {user.profile?.githubUrl && (
                            <a href={user.profile.githubUrl} target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-300">
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {user.profile?.linkedInUrl && (
                            <a href={user.profile.linkedInUrl} target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-300">
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {user.profile?.portfolioUrl && (
                            <a href={user.profile.portfolioUrl} target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-300">
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Recruitment Actions */}
                        <div className="flex gap-1.5 shrink-0">
                          <Link href={`/dashboard/participant/invite?userId=${user.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 px-2.5 rounded-lg border border-neutral-850 bg-neutral-950 text-neutral-400 hover:text-violet-400 text-[10px] font-bold flex items-center gap-1">
                              <UserPlus className="w-3 h-3" />
                              Invite
                            </Button>
                          </Link>
                          
                          <Button
                            size="sm"
                            onClick={() => handleOpenPitch(user)}
                            className="h-8 px-2.5 rounded-lg bg-violet-600 hover:bg-violet-750 text-neutral-100 text-[10px] font-bold flex items-center gap-1 shadow shadow-violet-500/10"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Team Up
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Team Pitch dialog */}
      <Dialog open={!!pitchTarget} onOpenChange={() => setPitchTarget(null)}>
        <DialogContent className="sm:max-w-[480px] bg-neutral-900 border-neutral-800 text-neutral-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Recruit {pitchTarget?.name || "Developer"}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Send a team-up pitch. We will email this pitch and create a system notification to help them coordinate.
            </DialogDescription>
          </DialogHeader>

          {pitchSuccess ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-base font-bold">
                ✓
              </div>
              <h3 className="font-bold text-neutral-50 text-sm">Teammate Pitch Dispatched!</h3>
              <p className="text-[11px] text-neutral-500">
                Email and system alerts have been sent to their inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendPitch} className="space-y-4 pt-2">
              {pitchError && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
                  {pitchError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Your Pitch Message</label>
                <textarea
                  required
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs p-3 focus:outline-none focus:ring-1 focus:ring-violet-500 leading-relaxed"
                  placeholder="Tell them about your project idea, stack, or target prizes..."
                />
              </div>

              <DialogFooter className="pt-2 border-t border-neutral-850 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPitchTarget(null)}
                  className="border-neutral-800 bg-neutral-950 text-neutral-450 hover:text-neutral-200 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendingPitch}
                  className="bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold text-xs shadow-md shadow-violet-500/10"
                >
                  {sendingPitch ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Pitch Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
