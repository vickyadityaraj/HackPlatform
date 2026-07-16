import { NextResponse } from 'next/server';

export async function POST() {
    // Simply return success since NextAuth handles logout from layouts/sidebar
    return NextResponse.json({ success: true });
}
