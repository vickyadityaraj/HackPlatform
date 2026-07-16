'use client';

import { QRCodeSVG } from 'qrcode.react';
import { LucideUser } from 'lucide-react';

interface QRGeneratorProps {
    profileId: string;
    name: string;
}

export default function QRGenerator({ profileId, name }: QRGeneratorProps) {
    return (
        <div className="flex flex-col items-center gap-4 p-4 md:p-8 bg-white rounded-2xl shadow-sm border border-zinc-100 w-full max-w-[280px] md:max-w-none">
            <div className="p-2 md:p-4 bg-zinc-50 rounded-xl w-full flex justify-center">
                <QRCodeSVG
                    value={profileId}
                    size={200}
                    level="H"
                    includeMargin={true}
                    className="w-full h-auto max-w-[180px] md:max-w-[200px]"
                />
            </div>
            <div className="text-center w-full">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <LucideUser className="w-4 h-4 text-zinc-400 shrink-0" />
                    <h3 className="text-base md:text-lg font-bold text-zinc-900 truncate">{name}</h3>
                </div>
                <p className="text-[10px] md:text-xs font-mono text-zinc-500 break-all">{profileId}</p>
            </div>
        </div>
    );
}
