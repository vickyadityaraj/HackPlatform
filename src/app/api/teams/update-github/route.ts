import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session || !session.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { github_link } = await request.json();

        const { error } = await supabase
            .from('teams')
            .update({ github_link })
            .eq('id', session.userId);

        if (error) {
            console.error('Error updating github link:', error);
            return NextResponse.json({ success: false, error: 'Failed to update database' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('API Error updating github link:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
