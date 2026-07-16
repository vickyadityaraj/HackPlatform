import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { shortlistedIds, commit } = body;

        const now = new Date().toISOString();

        if (shortlistedIds !== undefined) {
            const { error: shortlistError } = await supabase
                .from('system_configs')
                .upsert({
                    key: 'shortlisted_teams',
                    value: shortlistedIds,
                    updated_at: now
                }, { onConflict: 'key' });

            if (shortlistError) throw shortlistError;
        }

        if (commit) {
            const { error: commitError } = await supabase
                .from('system_configs')
                .upsert({
                    key: 'shortlist_committed',
                    value: now,
                    updated_at: now
                }, { onConflict: 'key' });

            if (commitError) throw commitError;
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date().toISOString();

        // 1. Clear shortlisted_teams
        const { error: shortlistError } = await supabase
            .from('system_configs')
            .upsert({
                key: 'shortlisted_teams',
                value: [],
                updated_at: now
            }, { onConflict: 'key' });

        if (shortlistError) throw shortlistError;

        // 2. Clear shortlist_committed
        const { error: commitError } = await supabase
            .from('system_configs')
            .upsert({
                key: 'shortlist_committed',
                value: false,
                updated_at: now
            }, { onConflict: 'key' });

        if (commitError) throw commitError;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
