import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.json();

        const { data: newUser, error: userErr } = await supabase
            .from('users')
            .insert([{
                full_name: formData.full_name,
                login_id: formData.login_id,
                password: formData.password,
                phone: formData.phone,
                role: formData.role
            }])
            .select()
            .single();

        if (userErr) throw userErr;

        if (formData.role === 'team') {
            const membersArray = formData.team_members.split(',').map((m: string) => m.trim()).filter((m: string) => m);
            const { error: teamErr } = await supabase
                .from('teams')
                .update({ team_members: membersArray, table_no: formData.table_no, full_name: formData.full_name })
                .eq('id', newUser.id);

            if (teamErr) throw teamErr;
        }

        return NextResponse.json({ success: true, data: newUser });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.json();

        const { error: userErr } = await supabase
            .from('users')
            .update({
                full_name: formData.full_name,
                login_id: formData.login_id,
                password: formData.password,
                phone: formData.phone,
                role: formData.role
            })
            .eq('id', formData.id);

        if (userErr) throw userErr;

        if (formData.role === 'team') {
            const membersArray = formData.team_members.split(',').map((m: string) => m.trim()).filter((m: string) => m);
            const { error: teamErr } = await supabase
                .from('teams')
                .upsert({
                    id: formData.id,
                    team_members: membersArray,
                    table_no: formData.table_no,
                    full_name: formData.full_name
                });

            if (teamErr) throw teamErr;
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

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
