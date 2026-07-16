'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { LucideTrophy, LucidePartyPopper, LucideXCircle, LucideLogOut, LucideArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentSession } from '@/lib/authClient';
import confetti from 'canvas-confetti';

export default function ShortlistLockdown() {
    const [isShortlisted, setIsShortlisted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [teamName, setTeamName] = useState('');
    const confettiTriggered = useRef(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    useEffect(() => {
        if (pathname?.includes('/auth/login')) return;

        async function checkStatus() {
            try {
                const session = await getCurrentSession();
                if (!session || !session.user) {
                    setIsVisible(false);
                    confettiTriggered.current = false;
                    return;
                }
                const userId = session.user.userId;

                if (!userId) return;

                // Fetch team name
                const { data: teamData } = await supabase
                    .from('teams')
                    .select('full_name')
                    .eq('id', userId)
                    .single();

                if (teamData) {
                    setTeamName(teamData.full_name);
                }

                // Fetch configs
                const { data: configsData } = await supabase
                    .from('system_configs')
                    .select('key, value')
                    .in('key', ['shortlisted_teams', 'shortlist_committed']);

                const shortlistedTeams = configsData?.find((c: any) => c.key === 'shortlisted_teams')?.value || [];
                const isCommitted = !!configsData?.find((c: any) => c.key === 'shortlist_committed')?.value;

                if (isCommitted) {
                    const selected = Array.isArray(shortlistedTeams) && shortlistedTeams.includes(userId);
                    setIsShortlisted(selected);

                    // Check dismissal status ONLY for shortlisted teams
                    const dismissed = sessionStorage.getItem('shortlist_dismissed') === 'true';
                    if (dismissed && selected) {
                        setIsDismissed(true);
                    } else if (!selected) {
                        setIsDismissed(false); // Ensure non-shortlisted teams cannot bypass
                    }

                    setIsVisible(true);

                    // Trigger celebration
                    if (selected && !confettiTriggered.current) {
                        confettiTriggered.current = true;

                        const duration = 5 * 1000;
                        const animationEnd = Date.now() + duration;
                        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

                        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                        const interval: any = setInterval(function () {
                            const timeLeft = animationEnd - Date.now();

                            if (timeLeft <= 0) {
                                return clearInterval(interval);
                            }

                            const particleCount = 50 * (timeLeft / duration);
                            // since particles fall down, start a bit higher than random
                            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                        }, 250);
                    }
                } else {
                    setIsVisible(false);
                    confettiTriggered.current = false;
                }
            } catch (error) {
                console.error('Error fetching auth status:', error);
            }
        }

        checkStatus();

        // Realtime subscription
        const channel = supabase
            .channel('shortlist_lockdown')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'system_configs'
            }, () => {
                checkStatus();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (!isVisible || isDismissed) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-700 pointer-events-auto overflow-x-hidden">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Subtle Tints */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-blue/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-orange/10 blur-[120px] rounded-full"></div>

                <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isShortlisted ? 'bg-brand-blue/20' : 'bg-red-500/30'} blur-[100px] rounded-full animate-pulse`}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${isShortlisted ? 'bg-brand-orange/20' : 'bg-brand-orange/20'} blur-[100px] rounded-full animate-pulse delay-700`}></div>
            </div>

            <div className="relative w-full max-w-2xl mx-auto">
                {/* Border Glow */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${isShortlisted ? 'from-brand-blue via-brand-orange to-brand-blue' : 'from-red-600 via-brand-orange to-red-600'} rounded-[2.5rem] sm:rounded-[3rem] blur-xl opacity-50 animate-pulse`}></div>

                <div className={`relative bg-[#050505] rounded-[2rem] sm:rounded-[3rem] border border-white/5 p-6 sm:p-10 md:p-16 text-center space-y-8 sm:space-y-10 overflow-hidden shadow-2xl mx-auto w-full max-w-[95vw] ${isShortlisted ? 'shadow-[-20px_0_50px_-20px_rgba(0,102,255,0.4),20px_0_50px_-20px_rgba(255,102,0,0.4)]' : 'shadow-[0_0_50px_-10px_rgba(239,68,68,0.3)]'}`}>
                    {/* Top Accent Line */}
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isShortlisted ? 'from-brand-blue via-brand-orange to-brand-blue' : 'from-red-600 via-zinc-800 to-red-600'}`}></div>

                    <div className="flex justify-center relative pt-4 sm:pt-0">
                        <div className={`w-20 h-20 sm:w-32 sm:h-32 rounded-[1.5rem] sm:rounded-[2rem] bg-black/40 border ${isShortlisted ? 'border-brand-blue/20' : 'border-red-500/20'} flex items-center justify-center animate-bounce relative z-10 mx-auto`}>
                            {isShortlisted ? (
                                <LucideTrophy className="w-10 h-10 sm:w-16 sm:h-16 text-brand-blue drop-shadow-[0_0_10px_rgba(0,102,255,0.8)]" />
                            ) : (
                                <LucideXCircle className="w-10 h-10 sm:w-16 sm:h-16 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                            )}
                        </div>
                        {/* Decorative Icons */}
                        {isShortlisted ? (
                            <>
                                <LucidePartyPopper className="absolute -top-1 -left-1 w-5 h-5 sm:w-8 sm:h-8 text-brand-orange animate-bounce delay-100" />
                                <LucidePartyPopper className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-8 sm:h-8 text-brand-blue animate-bounce delay-300" />
                            </>
                        ) : (
                            <>
                                <LucideXCircle className="absolute -top-1 -left-1 w-5 h-5 sm:w-8 sm:h-8 text-red-500 animate-bounce delay-100 opacity-50" />
                                <LucideXCircle className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-8 sm:h-8 text-brand-orange animate-bounce delay-300 opacity-50" />
                            </>
                        )}
                    </div>

                    <div className="space-y-4 sm:space-y-6 px-1 flex flex-col items-center w-full">
                        <div className="space-y-1 w-full flex flex-col items-center text-center">
                            <p className={`${isShortlisted ? 'text-brand-orange' : 'text-red-500'} text-[9px] sm:text-xs font-black tracking-[0.4em] uppercase w-full`}>
                                {isShortlisted ? 'Victory Achieved' : 'Sector Update'}
                            </p>
                            <h2 className="text-[7vw] sm:text-4xl md:text-6xl font-black italic tracking-tighter leading-tight sm:leading-none w-full flex flex-col items-center">
                                <span className="text-white block uppercase whitespace-nowrap">{isShortlisted ? 'CONGRATULATIONS' : 'STATUS UPDATE'}</span>
                                <span className={`${isShortlisted ? 'text-brand-blue-light' : 'text-red-500'} block mt-1 uppercase break-words w-full text-center`}>{isShortlisted ? (teamName || 'TEAM') : 'NOT SHORTLISTED'}</span>
                            </h2>
                        </div>

                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-zinc-800 to-transparent mx-auto"></div>

                        <div className="space-y-4 max-w-md mx-auto">
                            <p className="text-white text-sm font-bold tracking-tight leading-relaxed">
                                {isShortlisted ? (
                                    <>You have been <span className="text-brand-blue-light font-black">Shortlisted</span> for the final phase of Yantra Yugam 2026.</>
                                ) : (
                                    <>We regret to inform you that <span className="text-red-500 font-bold uppercase">{teamName || 'Your Team'}</span> has not been shortlisted for the final phase.</>
                                )}
                            </p>
                            <p className="text-white text-[10px] font-black tracking-[0.2em] leading-relaxed">
                                {isShortlisted
                                    ? 'All dashboard actions are currently locked while we prepare for the next sector. Please report to the main stage area immediately.'
                                    : 'Thank you for your incredible participation and the effort you put into your project. We hope to see you again next year!'}
                            </p>
                        </div>
                    </div>

                    {/* Progress / Action Indicator */}
                    <div className="pt-8 space-y-6">
                        {isShortlisted ? (
                            <>
                                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-blue w-1/3 animate-pulse"></div>
                                </div>
                                <div className="flex flex-col gap-4 mt-6">
                                    <button
                                        onClick={() => {
                                            setIsDismissed(true);
                                            sessionStorage.setItem('shortlist_dismissed', 'true');
                                        }}
                                        className="px-8 py-3 bg-brand-blue/10 border border-brand-blue/30 rounded-xl hover:bg-brand-blue/20 hover:border-brand-blue/50 transition-all text-brand-blue-light font-black text-[10px] tracking-[0.3em] uppercase flex items-center justify-center gap-2 group"
                                    >
                                        Go back to dashboard
                                        <LucideArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                    <p className="text-[9px] font-black text-brand-blue/50 tracking-[0.3em] animate-pulse uppercase">
                                        Awaiting Final Briefing...
                                    </p>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-red-500/50 transition-all text-white hover:text-red-500 font-black text-[10px] tracking-[0.3em] uppercase inline-flex items-center gap-2 group"
                            >
                                <LucideLogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Logout Dashboard
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
