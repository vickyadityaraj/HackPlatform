let sessionPromise: Promise<any> | null = null;

export async function getCurrentSession() {
    if (typeof window === 'undefined') return null;

    if ((window as any).__session_invalidated) {
        return null;
    }

    if (sessionPromise) {
        return sessionPromise;
    }

    sessionPromise = (async () => {
        try {
            const res = await fetch('/api/auth/me');
            
            if (res.status === 401) {
                (window as any).__session_invalidated = true;
                if (!window.location.pathname.includes('/auth/login')) {
                    window.location.href = '/auth/login?error=session_invalidated';
                }
                return null;
            }

            if (!res.ok) return null;
            
            const data = await res.json();
            return data;
        } catch (err) {
            console.error('Session fetch error:', err);
            return null;
        } finally {
            setTimeout(() => {
                sessionPromise = null;
            }, 500);
        }
    })();

    return sessionPromise;
}
