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
        const { updatedPhases, githubSubmissionActive } = body;

        if (!updatedPhases && githubSubmissionActive === undefined) {
            return NextResponse.json({ success: false, error: 'Missing configuration data' }, { status: 400 });
        }

        if (updatedPhases) {
            const { error: phasesError } = await supabase
                .from('system_configs')
                .upsert({
                    key: 'review_phases',
                    value: updatedPhases,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
            if (phasesError) throw phasesError;
        }

        if (githubSubmissionActive !== undefined) {
            const { error: githubError } = await supabase
                .from('system_configs')
                .upsert({
                    key: 'github_submission_active',
                    value: { active: githubSubmissionActive },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
            if (githubError) throw githubError;
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
