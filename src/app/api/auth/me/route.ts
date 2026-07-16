import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Map NextAuth roles (uppercase) to Yantra Yugam roles (lowercase)
    const nextAuthRole = session.user.role || 'PARTICIPANT';
    let mappedRole = 'team';

    if (nextAuthRole === 'SUPER_ADMIN' || nextAuthRole === 'ORGANIZER') {
        mappedRole = 'admin';
    } else if (nextAuthRole === 'JUDGE') {
        mappedRole = 'judge';
    } else if (nextAuthRole === 'COORDINATOR') {
        mappedRole = 'coordinator';
    }

    return NextResponse.json({
        authenticated: true,
        user: {
            userId: session.user.id,
            role: mappedRole,
            name: session.user.name || 'Staff User',
            loginId: session.user.email
        }
    });
}
