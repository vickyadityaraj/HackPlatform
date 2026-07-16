'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LucideWifi, LucideWifiOff, LucideRefreshCw, LucideCheckCircle, LucideAlertCircle, LucideScanQrCode, LucideCamera, LucideStopCircle } from 'lucide-react';
import OfflineIndicator from './OfflineIndicator';

interface QueuedScan {
    userId: string;
    timestamp: string;
}

interface QRScannerProps {
    onScan?: (decodedText: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
    const [isOnline, setIsOnline] = useState(true);
    const [lastScan, setLastScan] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isTransitioning = useRef(false);
    const isMounted = useRef(true);
    const scannerId = "reader";

    const checkCameraSupport = (): { supported: boolean; message: string | null } => {
        const isSecure = window.isSecureContext;
        const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (!isSecure && !isLocalhost) {
            return {
                supported: false,
                message: "Camera access requires HTTPS. If testing on a local network, use 'localhost' or configure your browser to treat this IP as secure."
            };
        }

        if (!hasMediaDevices) {
            return {
                supported: false,
                message: "Camera streaming is not supported by this browser or device."
            };
        }

        return { supported: true, message: null };
    };

    useEffect(() => {
        isMounted.current = true;
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const support = checkCameraSupport();
        if (!support.supported) {
            setError(support.message);
        } else {
            startScanner();
        }

        return () => {
            isMounted.current = false;
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        if (!isMounted.current || isTransitioning.current) return;

        const support = checkCameraSupport();
        if (!support.supported) {
            setError(support.message);
            return;
        }

        setError(null);
        try {
            // Ensure any previous instance is stopped
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
            }

            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(scannerId);
            }

            isTransitioning.current = true;

            // Wait for DOM to be ready
            const element = document.getElementById(scannerId);
            if (!element) {
                throw new Error("Scanner mount point not found.");
            }

            await scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                },
                onScanSuccess,
                (errorMessage) => { /* ignore minor noise */ }
            );

            if (isMounted.current) {
                setIsScanning(true);
            } else {
                await scannerRef.current.stop();
            }
        } catch (err: any) {
            console.error("Camera start error:", err);
            if (isMounted.current) {
                let msg = "Could not access camera.";
                const errMsg = err?.message || String(err);

                if (errMsg.includes("Permission")) msg = "Camera permission denied.";
                else if (errMsg.includes("NotFound")) msg = "No camera found on this device.";
                else if (errMsg.includes("NotSupported")) msg = "Camera streaming not supported (requires HTTPS).";
                else if (errMsg.includes("not supported by the browser")) msg = "Camera not supported on this insecure context (HTTP). Use HTTPS.";

                setError(msg);
                setIsScanning(false);
            }
        } finally {
            isTransitioning.current = false;
        }
    };

    const stopScanner = async () => {
        if (isTransitioning.current) return;
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                isTransitioning.current = true;
                await scannerRef.current.stop();
                if (isMounted.current) {
                    setIsScanning(false);
                }
            } catch (err) {
                console.error("Stop error:", err);
            } finally {
                isTransitioning.current = false;
            }
        }
    };


    // TanStack Query Mutation for Attendance
    const checkInMutation = useMutation({
        mutationFn: async (data: QueuedScan) => {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamIdOrLoginId: data.userId,
                    timestamp: data.timestamp
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Check-in failed');
            }

            return res.json();
        },
        onMutate: async (newScan) => {
            await queryClient.cancelQueries({ queryKey: ['attendance'] });
            const previousAttendance = queryClient.getQueryData(['attendance']);
            setLastScan(newScan.userId);
            return { previousAttendance };
        },
        onError: (err) => {
            console.error('Check-in failed:', err);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });

    async function onScanSuccess(decodedText: string) {
        if (lastScan === decodedText) return;
        setLastScan(decodedText);

        if (onScan) {
            onScan(decodedText);
            return;
        }

        const scanData: QueuedScan = {
            userId: decodedText,
            timestamp: new Date().toISOString(),
        };
        checkInMutation.mutate(scanData);
    }

    return (
        <div className="space-y-4">
            <OfflineIndicator />

            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isScanning ? 'bg-brand-blue/10 text-brand-blue-light' : 'bg-brand-orange/10 text-brand-orange'}`}>
                        <LucideScanQrCode className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">{isScanning ? 'Scanner Active' : 'Scanner Ready'}</h3>
                        <p className="text-xs text-white">{isOnline ? 'Cloud Sync Enabled' : 'Local Queue Active'}</p>
                    </div>
                </div>
                {!isScanning ? (
                    <button
                        onClick={startScanner}
                        className="p-2 bg-brand-orange rounded-lg hover:bg-brand-orange/80 transition-all text-white shadow-lg shadow-brand-orange/20"
                        title="Start Camera"
                    >
                        <LucideCamera className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={stopScanner}
                        className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-all text-white"
                        title="Stop Camera"
                    >
                        <LucideStopCircle className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-zinc-800 bg-black aspect-square relative">
                {/* 
                    This is the dedicated mount point for html5-qrcode.
                    We keep it persistent and avoid React children to prevent reconcile errors.
                */}
                <div id={scannerId} className="w-full h-full"></div>

                {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6 text-center bg-black/80 z-10">
                        <LucideCamera className="w-12 h-12 text-white" />
                        <div>
                            <p className="text-sm font-bold text-white">{error || 'Camera is off'}</p>
                            <p className="text-xs text-white mt-1">Enable camera access to scan</p>
                        </div>
                        <button
                            onClick={startScanner}
                            className="px-6 py-2 bg-brand-orange/10 border border-brand-orange/50 rounded-xl text-brand-orange font-bold hover:bg-brand-orange/20 transition-all"
                        >
                            Start Camera
                        </button>
                    </div>
                )}
            </div>

            {!onScan && checkInMutation.status !== 'idle' && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${checkInMutation.isSuccess ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                    checkInMutation.isError ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                        'bg-blue-500/10 border-blue-500/50 text-blue-400 animate-pulse'
                    }`}>
                    {checkInMutation.isPending ? <LucideRefreshCw className="w-5 h-5 animate-spin" /> :
                        checkInMutation.isSuccess ? <LucideCheckCircle className="w-5 h-5" /> :
                            <LucideAlertCircle className="w-5 h-5" />}

                    <div className="flex-1">
                        <p className="text-sm font-bold">
                            {checkInMutation.isPending ? 'Syncing...' :
                                checkInMutation.isSuccess ? 'Checked In!' : 'Check-in Failed'}
                        </p>
                        <p className="text-xs opacity-80 truncate">{lastScan}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
