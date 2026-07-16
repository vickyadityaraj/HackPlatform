'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentSession } from '@/lib/authClient';

export default function Heartbeat() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname.includes('/auth/login')) {
            // Reset the guard when on the login page
            if (typeof window !== 'undefined') {
                (window as any).__session_invalidated = false;
            }
            return;
        }

        // 2. Setup Presence
        const room = supabase.channel('global-presence');

        room
            .on('presence', { event: 'sync' }, () => {
                const state = room.presenceState();
                console.log('Current online users:', state);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Prevent multiple simultaneous checks during reconnection
                    if ((window as any).__session_checking || (window as any).__session_invalidated) return;
                    (window as any).__session_checking = true;

                    try {
                        const data = await getCurrentSession();
                        if (!data || !data.user) return; // Not signed in or already handled

                        const { user } = data;

                        if (user && !(window as any).__session_invalidated) {
                            await room.track({
                                user_id: user.userId, // Notice: your endpoint uses 'userId'
                                user_name: user.name, // Notice: your endpoint uses 'name'
                                user_role: user.role, // Notice: your endpoint uses 'role'
                                user_login_id: user.loginId, // Newly added to identify duplicate logins
                                online_at: new Date().toISOString(),
                                current_page: pathname,
                            });
                        }
                    } catch (err) {
                        console.error("Failed to get user for presence track");
                    } finally {
                        (window as any).__session_checking = false;
                    }
                }
            });

        return () => {
            room.unsubscribe();
        };
    }, [pathname]);

    return null;
}
