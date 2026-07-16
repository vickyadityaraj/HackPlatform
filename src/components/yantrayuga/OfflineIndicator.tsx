'use client';

import { useState, useEffect } from 'react';
import { LucideWifiOff, LucideAlertTriangle } from 'lucide-react';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        if (!navigator.onLine) setShowBanner(true);

        const handleOnline = () => {
            setIsOnline(true);
            // Keep showing for a moment to indicate sync
            setTimeout(() => setShowBanner(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showBanner) return null;

    return (
        <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 transform ${isOnline ? 'bg-green-600' : 'bg-amber-600'
            } text-white py-2 px-4 shadow-lg flex items-center justify-center gap-3`}>
            {isOnline ? (
                <>
                    <LucideWifiOff className="w-4 h-4 animate-pulse" />
                    <p className="text-sm font-medium">Back online! Syncing changes...</p>
                </>
            ) : (
                <>
                    <LucideAlertTriangle className="w-4 h-4" />
                    <p className="text-sm font-medium">You are currently offline. Changes will sync once connection is restored.</p>
                </>
            )}
        </div>
    );
}
