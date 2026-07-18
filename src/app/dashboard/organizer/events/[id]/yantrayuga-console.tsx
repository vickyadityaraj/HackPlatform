'use client';

import { useState, useMemo } from 'react';
import {
    updateEventYantraYugaConfig,
    commitEventShortlist,
    clearEventShortlist,
    createMentorGroup,
    deleteMentorGroup,
    assignCoordinatorToTeam,
    unassignCoordinatorFromTeam,
    // New Actions
    updateOnlineRoundConfig,
    updateEventBrandingConfig,
    updateTeamOnlineScore,
    updateTeamTableNumber
} from "@/actions/yantrayuga";
import {
    LucideSettings, LucideTrophy, LucideUsers, LucideShieldAlert,
    LucideRefreshCcw, LucideCheckCircle2, LucideClock, LucideAlertTriangle,
    LucideSave, LucidePlus, LucideTrash2, LucideLoader2, LucideExternalLink,
    LucideX, LucideSearch, LucideGlobe, LucideFileText, LucideLayout
} from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Coordinator {
    id: string;
    name: string | null;
    email: string;
    mentorGroupId: string | null;
}

interface MentorGroup {
    id: string;
    name: string;
    coordinators: Coordinator[];
}

interface Team {
    id: string;
    name: string;
    coordinatorId: string | null;
    coordinator: Coordinator | null;
    tableNo: string | null;
    onlineScore: number | null;
    onlineSubmissionUrl: string | null;
    onlineSubmissionText: string | null;
    onlineSubmissionStatus: string;
    submissions: {
        id: string;
        evaluations: {
            id: string;
            feedback: string | null;
            scores: {
                points: number;
            }[];
            judge: {
                user: {
                    name: string | null;
                };
            };
        }[];
    }[];
}

interface YantraYugaConsoleProps {
    eventId: string;
    initialEvent: {
        reviewPhases: any;
        githubSubmissionActive: boolean;
        shortlistCommitted: boolean;
        shortlistedTeams: string[];
        hasOnlineRound: boolean;
        onlineRoundType: string;
        onlineRoundDeadline: any;
        onlineCutoffScore: number;
        collegeName: string;
        organizedBy: string;
    };
    coordinators: Coordinator[];
    teams: Team[];
    mentorGroups: MentorGroup[];
}

export default function YantraYugaConsole({
    eventId,
    initialEvent,
    coordinators,
    teams: initialTeams,
    mentorGroups: initialGroups
}: YantraYugaConsoleProps) {
    const [activeSubTab, setActiveSubTab] = useState<'leaderboard' | 'online' | 'configs' | 'assignments' | 'groups'>('leaderboard');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic states
    const [eventState, setEventState] = useState(initialEvent);
    const [teams, setTeams] = useState(initialTeams);
    const [groups, setGroups] = useState(initialGroups);

    // Form inputs
    const [reviewPhases, setReviewPhases] = useState<Record<string, { active: boolean }>>(
        eventState.reviewPhases || {
            'Review 1': { active: true },
            'Review 2': { active: false },
            'Review 3': { active: false }
        }
    );
    const [githubSubmissionActive, setGithubSubmissionActive] = useState(eventState.githubSubmissionActive);
    const [shortlistedTeamsList, setShortlistedTeamsList] = useState<string[]>(eventState.shortlistedTeams || []);

    const [newGroupName, setNewGroupName] = useState('');
    const [selectedGroupCoordinators, setSelectedGroupCoordinators] = useState<string[]>([]);
    const [selectedCoordinatorForAssignment, setSelectedCoordinatorForAssignment] = useState('');
    const [selectedTeamsForAssignment, setSelectedTeamsForAssignment] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Online Round states
    const [hasOnlineRound, setHasOnlineRound] = useState(eventState.hasOnlineRound);
    const [onlineRoundType, setOnlineRoundType] = useState(eventState.onlineRoundType || 'PROPOSAL');
    const [onlineRoundDeadline, setOnlineRoundDeadline] = useState(
        eventState.onlineRoundDeadline ? new Date(eventState.onlineRoundDeadline).toISOString().split('T')[0] : ''
    );
    const [onlineCutoffScore, setOnlineCutoffScore] = useState(eventState.onlineCutoffScore || 0);

    // Branding states
    const [collegeName, setCollegeName] = useState(eventState.collegeName || 'HackPlatform');
    const [organizedBy, setOrganizedBy] = useState(eventState.organizedBy || 'Organized by Department of CS, IoT & ECE');

    // Dynamic list of coordinators currently assigned to groups
    const assignedCoordinatorIds = useMemo(() => {
        return groups.flatMap(g => g.coordinators.map(c => c.id));
    }, [groups]);

    // Save configurations
    async function saveReviewPhases() {
        setIsSubmitting(true);
        try {
            await updateEventYantraYugaConfig(eventId, reviewPhases, githubSubmissionActive);
            setEventState(prev => ({
                ...prev,
                reviewPhases,
                githubSubmissionActive
            }));
            alert('Settings updated successfully.');
        } catch (err) {
            alert('Failed to save settings.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Save online round configuration
    async function saveOnlineRoundConfigSettings() {
        setIsSubmitting(true);
        try {
            const deadlineDate = onlineRoundDeadline ? new Date(onlineRoundDeadline) : null;
            await updateOnlineRoundConfig(eventId, hasOnlineRound, onlineRoundType, deadlineDate, Number(onlineCutoffScore));
            setEventState(prev => ({
                ...prev,
                hasOnlineRound,
                onlineRoundType,
                onlineRoundDeadline: deadlineDate,
                onlineCutoffScore: Number(onlineCutoffScore)
            }));
            alert('Online Round configuration updated.');
        } catch (err) {
            alert('Failed to save Online Round settings.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Save branding config
    async function saveBrandingConfig() {
        setIsSubmitting(true);
        try {
            await updateEventBrandingConfig(eventId, collegeName, organizedBy);
            setEventState(prev => ({
                ...prev,
                collegeName,
                organizedBy
            }));
            alert('Branding configurations updated.');
        } catch (err) {
            alert('Failed to save branding config.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Update individual team online score
    async function handleTeamOnlineScoreChange(teamId: string, score: number) {
        try {
            await updateTeamOnlineScore(eventId, teamId, score);
            setTeams(prev => prev.map(t => t.id === teamId ? { ...t, onlineScore: score, onlineSubmissionStatus: 'EVALUATED' } : t));
        } catch (err) {
            alert('Failed to update team score.');
        }
    }

    // Update table assignment
    async function handleTableNoChange(teamId: string, tableNo: string) {
        try {
            await updateTeamTableNumber(eventId, teamId, tableNo);
            setTeams(prev => prev.map(t => t.id === teamId ? { ...t, tableNo: tableNo || null } : t));
        } catch (err) {
            alert('Failed to update table number.');
        }
    }

    // Bulk Shortlist teams by Cutoff Score
    async function handleBulkShortlist() {
        if (!confirm(`Are you sure you want to shortlist all teams with an online score of at least ${onlineCutoffScore}?`)) return;
        const eligibleTeamIds = teams
            .filter(t => t.onlineScore !== null && t.onlineScore >= onlineCutoffScore)
            .map(t => t.id);
        
        if (eligibleTeamIds.length === 0) {
            alert('No teams meet the cutoff score criteria.');
            return;
        }

        setShortlistedTeamsList(prev => {
            const next = new Set([...prev, ...eligibleTeamIds]);
            return Array.from(next);
        });
        alert(`Shortlisted ${eligibleTeamIds.length} teams based on cutoff score. Make sure to commit the shortlist to lock it.`);
    }

    // Save shortlist config
    async function commitShortlist() {
        if (!confirm('Are you sure you want to lock and commit this shortlist? Un-shortlisted teams will be locked.')) return;
        setIsSubmitting(true);
        try {
            await commitEventShortlist(eventId, shortlistedTeamsList, true);
            setEventState(prev => ({
                ...prev,
                shortlistCommitted: true,
                shortlistedTeams: shortlistedTeamsList
            }));
            alert('Shortlist committed successfully.');
        } catch (err) {
            alert('Failed to commit shortlist.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Clear shortlisted
    async function clearShortlistLockdown() {
        if (!confirm('Are you sure you want to clear the shortlist? This resets the lockdown status.')) return;
        setIsSubmitting(true);
        try {
            await clearEventShortlist(eventId);
            setEventState(prev => ({
                ...prev,
                shortlistCommitted: false,
                shortlistedTeams: []
            }));
            setShortlistedTeamsList([]);
            alert('Shortlist cleared successfully.');
        } catch (err) {
            alert('Failed to clear shortlist.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Handle shortlist check/uncheck
    function handleShortlistToggle(teamId: string) {
        setShortlistedTeamsList(prev =>
            prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
        );
    }

    // Assign Coordinator
    async function handleAssignTeams() {
        if (!selectedCoordinatorForAssignment || selectedTeamsForAssignment.length === 0) {
            alert('Please select both a coordinator and at least one team.');
            return;
        }

        setIsSubmitting(true);
        try {
            await assignCoordinatorToTeam(eventId, selectedCoordinatorForAssignment, selectedTeamsForAssignment);
            const assignedCoord = coordinators.find(c => c.id === selectedCoordinatorForAssignment) || null;

            setTeams(prev =>
                prev.map(t =>
                    selectedTeamsForAssignment.includes(t.id)
                        ? { ...t, coordinatorId: selectedCoordinatorForAssignment, coordinator: assignedCoord }
                        : t
                )
            );

            setSelectedTeamsForAssignment([]);
            alert('Teams assigned successfully.');
        } catch (err) {
            alert('Failed to assign teams.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Unassign coordinator
    async function handleUnassign(teamId: string, coordId: string) {
        setIsSubmitting(true);
        try {
            await unassignCoordinatorFromTeam(eventId, teamId, coordId);
            setTeams(prev =>
                prev.map(t => (t.id === teamId ? { ...t, coordinatorId: null, coordinator: null } : t))
            );
            alert('Assignment removed successfully.');
        } catch (err) {
            alert('Failed to remove assignment.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Create Mentor Group
    async function handleCreateGroup() {
        if (!newGroupName) {
            alert('Group name is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const newGroup = await createMentorGroup(eventId, newGroupName, selectedGroupCoordinators);
            const addedCoords = coordinators.filter(c => selectedGroupCoordinators.includes(c.id));

            setGroups(prev => [...prev, {
                id: newGroup.id,
                name: newGroup.name,
                coordinators: addedCoords
            }]);

            setNewGroupName('');
            setSelectedGroupCoordinators([]);
            alert('Mentor group created successfully.');
        } catch (err: any) {
            alert(err.message || 'Failed to create mentor group.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Delete Mentor Group
    async function handleDeleteGroup(groupId: string) {
        if (!confirm('Are you sure you want to delete this group? Coordinators in it will be unassigned.')) return;

        setIsSubmitting(true);
        try {
            await deleteMentorGroup(eventId, groupId);
            setGroups(prev => prev.filter(g => g.id !== groupId));
            alert('Mentor group deleted successfully.');
        } catch (err) {
            alert('Failed to delete mentor group.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Calculate score logic for rankings
    const leaderboardData = useMemo(() => {
        return teams.map(team => {
            let total = 0;
            // Sum points across all evaluations for team submissions
            team.submissions.forEach(sub => {
                sub.evaluations.forEach(evalRecord => {
                    evalRecord.scores.forEach(s => {
                        total += s.points;
                    });
                });
            });

            return {
                ...team,
                totalScore: total
            };
        }).sort((a, b) => b.totalScore - a.totalScore);
    }, [teams]);

    const filteredLeaderboard = useMemo(() => {
        return leaderboardData.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [leaderboardData, searchTerm]);

    return (
        <div className="space-y-6">
            {/* Sub Tabs Selection */}
            <div className="flex border-b border-neutral-850 gap-4 mb-6 bg-neutral-900/20 p-2 rounded-xl">
                {[
                    { id: 'leaderboard', label: 'Leaderboard', icon: LucideTrophy },
                    { id: 'online', label: 'Online Round', icon: LucideGlobe },
                    { id: 'configs', label: 'Branding & Lockdown', icon: LucideSettings },
                    { id: 'assignments', label: 'Table Assignments', icon: LucideShieldAlert },
                    { id: 'groups', label: 'Mentor Groups', icon: LucideUsers }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs tracking-wider transition-all uppercase ${activeSubTab === tab.id
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: Leaderboard */}
            {activeSubTab === 'leaderboard' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wide">Dynamic Evaluation Rankings</h2>
                        <div className="relative w-full sm:w-72">
                            <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Search team..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-violet-500 transition-all placeholder:text-neutral-700"
                            />
                        </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-800 text-[10px] font-black tracking-widest text-neutral-400 uppercase bg-neutral-950/40">
                                    <th className="py-4 px-6">Rank</th>
                                    <th className="py-4 px-6">Team Name</th>
                                    <th className="py-4 px-6">Table No</th>
                                    <th className="py-4 px-6">Assigned Coordinator</th>
                                    <th className="py-4 px-6 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-850 text-neutral-300">
                                {filteredLeaderboard.map((team, idx) => (
                                    <tr key={team.id} className="hover:bg-neutral-850/40 transition-colors">
                                        <td className="py-4 px-6 font-mono font-bold">
                                            #{idx + 1}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="font-bold text-neutral-200">{team.name}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono font-bold text-amber-500">
                                            {team.tableNo || 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 font-semibold">
                                            {team.coordinator ? (
                                                <span className="text-violet-400">{team.coordinator.name || team.coordinator.email}</span>
                                            ) : (
                                                <span className="text-neutral-600">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right font-black text-violet-400 font-mono">
                                            {team.totalScore} pts
                                        </td>
                                    </tr>
                                ))}
                                {filteredLeaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-neutral-500 font-semibold">
                                            No teams or score metrics recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: Online Round Management */}
            {activeSubTab === 'online' && (
                <div className="space-y-6">
                    {/* Setup Config & Cutoff */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Config card */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 md:col-span-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 border-b border-neutral-800 pb-2">Online Round Setup</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-400 uppercase font-bold">Selection Round Status</label>
                                    <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-850 p-2.5 rounded-xl">
                                        <input
                                            type="checkbox"
                                            checked={hasOnlineRound}
                                            onChange={(e) => setHasOnlineRound(e.target.checked)}
                                            className="w-4 h-4 accent-violet-600 rounded bg-neutral-950 border-neutral-800 cursor-pointer"
                                            id="hasOnlineRound"
                                        />
                                        <label htmlFor="hasOnlineRound" className="text-xs font-semibold text-neutral-200 cursor-pointer">
                                            Enable Online Selection Round
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-400 uppercase font-bold">Assessment Type</label>
                                    <select
                                        value={onlineRoundType}
                                        onChange={(e) => setOnlineRoundType(e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
                                    >
                                        <option value="PROPOSAL">Proposal / PPT Submission</option>
                                        <option value="QUIZ">MCQ / Online Assessment</option>
                                        <option value="CODING">Online Coding Challenge</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-400 uppercase font-bold">Online Submission Deadline</label>
                                    <input
                                        type="date"
                                        value={onlineRoundDeadline}
                                        onChange={(e) => setOnlineRoundDeadline(e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-2 text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-400 uppercase font-bold">Cutoff Score (Shortlist Threshold)</label>
                                    <input
                                        type="number"
                                        value={onlineCutoffScore}
                                        onChange={(e) => setOnlineCutoffScore(Number(e.target.value))}
                                        className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-2 text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={saveOnlineRoundConfigSettings}
                                disabled={isSubmitting}
                                className="w-full bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs h-10 mt-2"
                            >
                                Save Online Round Config
                            </Button>
                        </div>

                        {/* Cutoff action card */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 md:col-span-1 flex flex-col justify-between">
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 border-b border-neutral-800 pb-2">Bulk Shortlisting</h3>
                                <p className="text-[10px] text-neutral-400 leading-relaxed">
                                    Shortlist all teams that scored greater than or equal to the threshold score of <strong className="text-violet-400">{onlineCutoffScore}</strong>.
                                </p>
                            </div>
                            <Button
                                onClick={handleBulkShortlist}
                                disabled={isSubmitting || !hasOnlineRound}
                                className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs h-10 mt-4 shadow-md shadow-indigo-500/10"
                            >
                                Apply Cutoff Filter
                            </Button>
                        </div>
                    </div>

                    {/* Team Submissions list */}
                    {hasOnlineRound && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 border-b border-neutral-800 pb-2">Registered Teams Online Performance</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-800 text-[10px] font-black tracking-widest text-neutral-400 uppercase bg-neutral-950/40">
                                            <th className="py-3 px-4">Team</th>
                                            <th className="py-3 px-4">Round Status</th>
                                            <th className="py-3 px-4">PPT / Proposal Slide</th>
                                            <th className="py-3 px-4 w-40">Score</th>
                                            <th className="py-3 px-4 text-right">Shortlist for Offline</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-850 text-neutral-300">
                                        {teams.map(t => (
                                            <tr key={t.id} className="hover:bg-neutral-850/20 transition-colors">
                                                <td className="py-3.5 px-4 font-semibold text-neutral-100">
                                                    <div>
                                                        <p>{t.name}</p>
                                                        <p className="text-[9px] font-mono text-neutral-550 mt-0.5">{t.id}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                                        t.onlineSubmissionStatus === "EVALUATED" 
                                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                                                            : t.onlineSubmissionStatus === "SUBMITTED"
                                                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                                                            : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                                                    }`}>
                                                        {t.onlineSubmissionStatus}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {t.onlineSubmissionUrl ? (
                                                        <a 
                                                            href={t.onlineSubmissionUrl} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="text-violet-400 hover:underline flex items-center gap-1.5 font-bold"
                                                        >
                                                            <LucideExternalLink className="w-3.5 h-3.5" />
                                                            View Material
                                                        </a>
                                                    ) : (
                                                        <span className="text-neutral-500 font-mono italic">No Material</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <input
                                                        type="number"
                                                        value={t.onlineScore !== null ? t.onlineScore : ''}
                                                        onChange={(e) => handleTeamOnlineScoreChange(t.id, Number(e.target.value))}
                                                        placeholder="N/A"
                                                        className="w-20 bg-neutral-950 border border-neutral-850 rounded-lg p-1.5 text-center text-xs font-semibold focus:outline-none focus:border-violet-500 text-white"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <input
                                                        type="checkbox"
                                                        checked={shortlistedTeamsList.includes(t.id)}
                                                        onChange={() => handleShortlistToggle(t.id)}
                                                        className="w-4 h-4 accent-violet-600 rounded bg-neutral-950 border-neutral-800 cursor-pointer"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        {teams.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-neutral-500 italic">No registered teams found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: Branding & Lockdown */}
            {activeSubTab === 'configs' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Branding settings */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 md:col-span-1">
                        <h3 className="text-sm font-bold tracking-widest text-neutral-300 uppercase border-b border-neutral-850 pb-3">Microsite Branding</h3>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-400 tracking-[0.2em] uppercase">Institution / Host Logo Text</label>
                                <input
                                    type="text"
                                    value={collegeName}
                                    onChange={(e) => setCollegeName(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
                                    placeholder="e.g. Malla Reddy University"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-400 tracking-[0.2em] uppercase">Organized By Subtext</label>
                                <input
                                    type="text"
                                    value={organizedBy}
                                    onChange={(e) => setOrganizedBy(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
                                    placeholder="e.g. Organized by Department of CS, IoT & ECE"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={saveBrandingConfig}
                            disabled={isSubmitting}
                            className="w-full py-6 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs tracking-wider"
                        >
                            Save Branding Config
                        </Button>
                    </div>

                    {/* Review phases toggle */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 md:col-span-1">
                        <h3 className="text-sm font-bold tracking-widest text-neutral-300 uppercase border-b border-neutral-850 pb-3">Evaluation Phase Control</h3>
                        <div className="space-y-4">
                            {Object.keys(reviewPhases).map((phase) => (
                                <div key={phase} className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-850 rounded-xl">
                                    <div>
                                        <p className="font-bold text-neutral-200 text-xs">{phase}</p>
                                        <p className="text-[9px] text-neutral-500 uppercase">Status: {reviewPhases[phase]?.active ? 'Active' : 'Closed'}</p>
                                    </div>
                                    <button
                                        onClick={() => setReviewPhases(prev => ({
                                            ...prev,
                                            [phase]: { active: !prev[phase]?.active }
                                        }))}
                                        className={`px-3 py-1.5 rounded-lg font-bold text-[9px] tracking-widest uppercase transition-all ${reviewPhases[phase]?.active
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            }`}
                                    >
                                        Toggle
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-850 rounded-xl">
                            <div>
                                <p className="font-bold text-neutral-200 text-xs">GitHub Repository Submissions</p>
                                <p className="text-[9px] text-neutral-500 uppercase">Status: {githubSubmissionActive ? 'Open' : 'Closed'}</p>
                            </div>
                            <button
                                onClick={() => setGithubSubmissionActive(!githubSubmissionActive)}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[9px] tracking-widest uppercase transition-all ${githubSubmissionActive
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}
                            >
                                Toggle
                            </button>
                        </div>

                        <Button
                            onClick={saveReviewPhases}
                            disabled={isSubmitting}
                            className="w-full py-6 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs tracking-wider"
                        >
                            Save Phase Controls
                        </Button>
                    </div>

                    {/* Shortlist lockdown */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 md:col-span-1">
                        <h3 className="text-sm font-bold tracking-widest text-neutral-300 uppercase border-b border-neutral-850 pb-3">Final Shortlist Lockdown</h3>

                        <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl space-y-3">
                            <p className="text-[9px] font-black text-neutral-400 tracking-widest uppercase">System Lockdown Status</p>
                            <div className="flex items-center gap-3">
                                <div className={`w-3.5 h-3.5 rounded-full ${eventState.shortlistCommitted ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                <span className="text-xs font-black uppercase tracking-wider text-neutral-200">
                                    {eventState.shortlistCommitted ? 'Lockdown Status: Committed' : 'Standby / Configuration Idle'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[9px] font-black text-neutral-400 tracking-widest uppercase">Shortlisted Teams</p>
                            <div className="max-h-48 overflow-y-auto pr-1 border border-neutral-850 rounded-xl p-3 bg-neutral-950/40 space-y-2">
                                {teams.map(team => {
                                    const checked = shortlistedTeamsList.includes(team.id);
                                    return (
                                        <label key={team.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-900 transition-all cursor-pointer">
                                            <span className="text-xs font-semibold text-neutral-300">{team.name}</span>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleShortlistToggle(team.id)}
                                                className="w-4 h-4 rounded accent-violet-500 cursor-pointer bg-neutral-950 border-neutral-800"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-850">
                            <button
                                onClick={clearShortlistLockdown}
                                disabled={isSubmitting}
                                className="py-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 font-semibold rounded-xl text-xs"
                            >
                                Clear Shortlist
                            </button>
                            <button
                                onClick={commitShortlist}
                                disabled={isSubmitting}
                                className="py-3 bg-violet-600 hover:bg-violet-750 text-white font-semibold rounded-xl text-xs"
                            >
                                Commit Lockdown
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: Assignments */}
            {activeSubTab === 'assignments' && (
                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                            <h3 className="text-sm font-bold tracking-widest text-neutral-300 uppercase">Team Assignments & Physical Setup</h3>
                            <p className="text-[10px] text-neutral-500 uppercase font-mono">Assign Tables & Coordinators</p>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-800 text-[10px] font-black tracking-widest text-neutral-400 uppercase bg-neutral-950/40">
                                        <th className="py-3 px-4">Team</th>
                                        <th className="py-3 px-4">Table Number / Desk</th>
                                        <th className="py-3 px-4">Assigned Coordinator</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-850 text-neutral-300">
                                    {teams.map(team => (
                                        <tr key={team.id} className="hover:bg-neutral-850/20 transition-colors">
                                            <td className="py-4 px-4 font-semibold text-neutral-100">
                                                {team.name}
                                                <p className="text-[9px] text-neutral-500 font-mono mt-0.5">ID: {team.id}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <input
                                                    type="text"
                                                    value={team.tableNo || ''}
                                                    onChange={(e) => handleTableNoChange(team.id, e.target.value)}
                                                    placeholder="Assign Table (e.g. loo2-yy1)"
                                                    className="bg-neutral-950 border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-violet-500 w-48 font-semibold"
                                                />
                                            </td>
                                            <td className="py-4 px-4">
                                                <select
                                                    value={team.coordinatorId || ''}
                                                    onChange={(e) => {
                                                        const coordId = e.target.value;
                                                        if (coordId) {
                                                            assignCoordinatorToTeam(eventId, coordId, [team.id])
                                                                .then(() => {
                                                                    const assignedCoord = coordinators.find(c => c.id === coordId) || null;
                                                                    setTeams(prev => prev.map(t => t.id === team.id ? { ...t, coordinatorId: coordId, coordinator: assignedCoord } : t));
                                                                })
                                                                .catch(() => alert('Failed to assign coordinator'));
                                                        } else {
                                                            unassignCoordinatorFromTeam(eventId, team.id, team.coordinatorId!)
                                                                .then(() => {
                                                                    setTeams(prev => prev.map(t => t.id === team.id ? { ...t, coordinatorId: null, coordinator: null } : t));
                                                                })
                                                                .catch(() => alert('Failed to unassign coordinator'));
                                                        }
                                                    }}
                                                    className="bg-neutral-950 border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer font-semibold"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {coordinators.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name || c.email}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                    {teams.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center py-8 text-neutral-500 italic">No teams formed yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: Mentor Groups */}
            {activeSubTab === 'groups' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Create group form */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 md:col-span-1 h-fit">
                        <h3 className="text-sm font-bold tracking-widest text-neutral-300 uppercase border-b border-neutral-850 pb-3">Create Mentor Group</h3>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 tracking-[0.2em] uppercase">Group Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Group A"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-neutral-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 tracking-[0.2em] uppercase">Add Coordinators</label>
                            <div className="max-h-60 overflow-y-auto pr-1 border border-neutral-850 rounded-xl p-3 bg-neutral-950/40 space-y-2">
                                {coordinators.filter(c => !assignedCoordinatorIds.includes(c.id)).map(c => {
                                    const isChecked = selectedGroupCoordinators.includes(c.id);
                                    return (
                                        <label key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900 transition-all cursor-pointer">
                                            <span className="text-xs font-semibold text-neutral-300">{c.name || c.email}</span>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {
                                                    setSelectedGroupCoordinators(prev =>
                                                        prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                                                    );
                                                }}
                                                className="w-4 h-4 accent-violet-500 cursor-pointer bg-neutral-950 border-neutral-800"
                                            />
                                        </label>
                                    );
                                })}
                                {coordinators.filter(c => !assignedCoordinatorIds.includes(c.id)).length === 0 && (
                                    <p className="text-[10px] text-center text-neutral-500 py-4">No unassigned coordinators available</p>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleCreateGroup}
                            disabled={isSubmitting}
                            className="w-full py-6 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs tracking-wider"
                        >
                            Create Group
                        </Button>
                    </div>

                    {/* List of current groups */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 md:col-span-2">
                        <h3 className="text-sm font-bold tracking-widest text-neutral-300 uppercase border-b border-neutral-850 pb-3">Active Mentor Groupings</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {groups.map(group => (
                                <div key={group.id} className="p-5 bg-neutral-950 border border-neutral-850 rounded-xl flex flex-col justify-between gap-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-extrabold text-neutral-250">{group.name}</h4>
                                            <button
                                                onClick={() => handleDeleteGroup(group.id)}
                                                disabled={isSubmitting}
                                                className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20 text-red-500"
                                            >
                                                <LucideTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-neutral-500 tracking-widest uppercase">Assigned Coordinators</p>
                                            <p className="text-xs font-semibold text-neutral-300 leading-normal">
                                                {group.coordinators.map(c => c.name || c.email).join(', ') || 'No coordinators assigned'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {groups.length === 0 && (
                                <div className="col-span-full text-center py-12 border border-dashed border-neutral-850 rounded-xl">
                                    <p className="text-xs font-bold tracking-widest text-neutral-500">NO MENTOR GROUPS CONFIGURED</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
