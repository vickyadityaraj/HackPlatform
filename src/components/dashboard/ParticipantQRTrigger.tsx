'use client';

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { LucideQrCode, LucideUser, LucideX } from "lucide-react";

interface ParticipantQRTriggerProps {
  userId: string;
  name: string;
}

export function ParticipantQRTrigger({ userId, name }: ParticipantQRTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-md shadow-indigo-500/10"
      >
        <LucideQrCode className="w-4 h-4" />
        My Attendee QR
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-850 transition-colors"
            >
              <LucideX className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center gap-6 pt-4 text-center">
              <div>
                <h3 className="text-base font-extrabold text-neutral-100 uppercase tracking-wider">Attendee QR Code</h3>
                <p className="text-neutral-400 text-[10px] mt-1 uppercase tracking-widest">Present to the judge for evaluation scan</p>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow-inner border border-neutral-800">
                <QRCodeSVG
                  value={userId}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="w-full">
                <div className="flex items-center justify-center gap-2 mb-1 bg-neutral-950 p-3 rounded-xl border border-neutral-850">
                  <LucideUser className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="text-xs font-bold text-neutral-200 truncate">{name}</span>
                </div>
                <p className="text-[9px] font-mono text-neutral-500 break-all select-all select-none">ID: {userId}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
