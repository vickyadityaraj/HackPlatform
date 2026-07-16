import { auth } from "@/auth";

export type UserRole = 'admin' | 'judge' | 'team' | 'coordinator' | 'mentor';

export async function getSession() {
    const session = await auth();
    if (!session || !session.user) return null;

    const nextAuthRole = session.user.role || 'PARTICIPANT';
    let mappedRole: UserRole = 'team';

    if (nextAuthRole === 'SUPER_ADMIN' || nextAuthRole === 'ORGANIZER') {
        mappedRole = 'admin';
    } else if (nextAuthRole === 'JUDGE') {
        mappedRole = 'judge';
    } else if (nextAuthRole === 'COORDINATOR') {
        mappedRole = 'coordinator';
    }

    return {
        userId: session.user.id,
        role: mappedRole,
        name: session.user.name || 'Staff User',
        loginId: session.user.email,
        sessionId: 'mock-session-id'
    };
}
