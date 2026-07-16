'use client';

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { getSubmissionIdForUser } from "@/actions/evaluation";
import { Button } from "@/components/ui/button";
import { LucideScan, LucideX, LucideCamera, LucideStopCircle, LucideLoader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface JudgeQRScannerTriggerProps {
  eventId: string;
}

export function JudgeQRScannerTrigger({ eventId }: JudgeQRScannerTriggerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "judge-reader";

  const checkCameraSupport = () => {
    const isSecure = window.isSecureContext;
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isSecure && !isLocalhost) {
      return {
        supported: false,
        message: "Camera access requires HTTPS connection."
      };
    }

    if (!hasMediaDevices) {
      return {
        supported: false,
        message: "No camera streaming support in this browser/device."
      };
    }

    return { supported: true, message: null };
  };

  const startScanner = async () => {
    const support = checkCameraSupport();
    if (!support.supported) {
      setError(support.message);
      return;
    }

    setError(null);
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10 },
        onScanSuccess,
        () => {}
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error(err);
      setError("Unable to access camera. Check device permissions.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Scanned text is the participant's user ID
    await stopScanner();
    setIsOpen(false);
    setLoading(true);
    setError(null);

    try {
      const res = await getSubmissionIdForUser(eventId, decodedText);
      alert(`Scanned Team: "${res.teamName}". Redirecting to submission...`);
      router.push(`/dashboard/judge?eventId=${eventId}&submissionId=${res.submissionId}`);
    } catch (err: any) {
      alert(err.message || "Failed to locate submission for the scanned user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs h-10 shadow-lg shadow-violet-500/10"
      >
        {loading ? (
          <LucideLoader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LucideScan className="w-4 h-4" />
        )}
        Scan Participant QR
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-850 transition-colors z-20"
            >
              <LucideX className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center gap-4 text-center">
              <div>
                <h3 className="text-base font-extrabold text-neutral-100 uppercase tracking-wider">Scan Attendee QR</h3>
                <p className="text-neutral-400 text-[10px] mt-1 uppercase tracking-widest">Hold the attendee&apos;s QR code up to your camera</p>
              </div>

              <div className="w-full aspect-square relative bg-black rounded-xl overflow-hidden border border-neutral-800">
                <div id={scannerId} className="w-full h-full"></div>

                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6 bg-black/80 z-10">
                    <LucideCamera className="w-10 h-10 text-neutral-400" />
                    <div>
                      <p className="text-xs font-bold text-neutral-300">{error || 'Camera access pending'}</p>
                      <p className="text-[10px] text-neutral-500 mt-1">Accept permissions when prompted</p>
                    </div>
                    <button
                      onClick={startScanner}
                      className="px-4 py-2 border border-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-850 text-neutral-200 transition-all"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}
              </div>

              {isScanning && (
                <button
                  onClick={stopScanner}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all"
                >
                  <LucideStopCircle className="w-4 h-4" />
                  Stop Camera
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
