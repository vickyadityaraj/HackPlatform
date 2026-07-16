import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const session = await getSession();

        // 1. Auth check
        if (!session || !session.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Only coordinators and admins should log attendance
        if (session.role !== 'coordinator' && session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { teamIdOrLoginId, timestamp } = body;

        if (!teamIdOrLoginId) {
            return NextResponse.json({ success: false, error: 'Team identifier is required' }, { status: 400 });
        }

        // 2. Resolve Team ID (handle both UUID and Login ID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamIdOrLoginId);
        let finalTeamId = teamIdOrLoginId;

        if (!isUUID) {
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('id')
                .eq('team_login_id', teamIdOrLoginId)
                .maybeSingle();

            if (teamError) throw teamError;
            if (!teamData) {
                return NextResponse.json({ success: false, error: `Team not found: ${teamIdOrLoginId}` }, { status: 404 });
            }
            finalTeamId = teamData.id;
        }

        // 3. Record Attendance
        // We set both logged_by_coord and logged_by_mentor depending on the table definition
        const { error: upsertError } = await supabase
            .from('attendance')
            .upsert({
                team_id: finalTeamId,
                check_in_time: timestamp || new Date().toISOString(),
                logged_by_coord: session.userId,
                logged_by_mentor: session.userId
            }, { onConflict: 'team_id' });

        if (upsertError) {
            // Fallback in case one of the columns doesn't exist
            const { error: fallbackError } = await supabase
                .from('attendance')
                .upsert({
                    team_id: finalTeamId,
                    check_in_time: timestamp || new Date().toISOString(),
                    logged_by_mentor: session.userId
                }, { onConflict: 'team_id' });
                
            if (fallbackError) throw fallbackError;
        }

        return NextResponse.json({
            success: true,
            teamId: finalTeamId,
            timestamp: timestamp || new Date().toISOString()
        });
    } catch (err: any) {
        console.error('Attendance API Error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
