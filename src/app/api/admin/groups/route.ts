import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: groups, error } = await supabase
        .from('mentor_groups')
        .select('*')
        .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(groups);
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, coordinatorIds } = await req.json();

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    // 1. Create group
    const { data: group, error: groupError } = await supabase
        .from('mentor_groups')
        .insert({ name })
        .select()
        .single();

    if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 });

    // 2. Assign coordinators if any
    if (coordinatorIds && coordinatorIds.length > 0) {
        const { error: updateError } = await supabase
            .from('users')
            .update({ mentor_group_id: group.id })
            .in('id', coordinatorIds);

        if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(group);
}

export async function DELETE(req: Request) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabase
        .from('mentor_groups')
        .delete()
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, coordinatorIds } = await req.json();

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    // Clear existing members of this group
    await supabase.from('users').update({ mentor_group_id: null }).eq('mentor_group_id', id);

    // Assign new coordinators
    if (coordinatorIds && coordinatorIds.length > 0) {
        const { error } = await supabase
            .from('users')
            .update({ mentor_group_id: id })
            .in('id', coordinatorIds);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
