import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Assign Teams to a Mentor
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { coordinatorId, teamIds } = body;

        if (!coordinatorId || !teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
            return NextResponse.json({ success: false, error: 'Missing coordinatorId or teamIds' }, { status: 400 });
        }

        for (const teamId of teamIds) {
            // Enforce single coordinator by always assigning to assigned_mentor_id
            // and clearing assigned_mentor_2_id
            const { error: updateErr } = await supabase
                .from('teams')
                .update({
                    assigned_mentor_id: coordinatorId,
                    assigned_mentor_2_id: null
                })
                .eq('id', teamId);

            if (updateErr) throw updateErr;
        }

        return NextResponse.json({ success: true, message: `Successfully processed ${teamIds.length} teams` });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// Unassign a Mentor from a Team
export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const teamId = url.searchParams.get('teamId');
        const coordinatorId = url.searchParams.get('coordinatorId');

        if (!teamId) {
            return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 });
        }

        const { data: team, error: fetchErr } = await supabase
            .from('teams')
            .select('assigned_mentor_id, assigned_mentor_2_id')
            .eq('id', teamId)
            .single();

        if (fetchErr) throw fetchErr;

        let updateData: any = {};
        if (team.assigned_mentor_id === coordinatorId || !coordinatorId) {
            updateData.assigned_mentor_id = null;
        }
        
        // Also clear secondary slot if it matches or if clearing all, to clean up legacy data
        if (team.assigned_mentor_2_id === coordinatorId || !coordinatorId) {
            updateData.assigned_mentor_2_id = null;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: 'Coordinator not assigned to this team' }, { status: 400 });
        }

        const { error: updateErr } = await supabase
            .from('teams')
            .update(updateData)
            .eq('id', teamId);

        if (updateErr) throw updateErr;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
