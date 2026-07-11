"use client";

import React, { useState } from "react";
import { updatePlatformSettings } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Check } from "lucide-react";

interface AdminSettingsFormProps {
  initialSettings: {
    platformFeePercentage: number | any;
    maintenanceMode: boolean;
  };
}

export function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  // Handle Decimal string parsing from Prisma
  const parsedFee = typeof initialSettings.platformFeePercentage === "object"
    ? parseFloat(initialSettings.platformFeePercentage.toString())
    : parseFloat(initialSettings.platformFeePercentage || 0);

  const [fee, setFee] = useState(parsedFee);
  const [maintenance, setMaintenance] = useState(initialSettings.maintenanceMode);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await updatePlatformSettings(fee, maintenance);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update platform settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-xl">
      <CardHeader className="border-b border-neutral-850/50 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Global Platform Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6 space-y-6">
        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="fee">Platform Commission Fee (%)</Label>
          <Input
            id="fee"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={fee}
            onChange={(e) => setFee(parseFloat(e.target.value) || 0)}
            className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
          />
          <p className="text-xs text-neutral-500">Commission rate subtracted from paid ticket/hackathon configurations.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            id="maintenance"
            type="checkbox"
            checked={maintenance}
            onChange={(e) => setMaintenance(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-800 bg-neutral-950 text-violet-600 focus:ring-violet-500"
          />
          <div>
            <Label htmlFor="maintenance" className="font-semibold">Maintenance Mode</Label>
            <p className="text-[10px] text-neutral-500 mt-0.5">Redirect public paths to holding page and lock DB modifications.</p>
          </div>
        </div>

        <Button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="w-full bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold h-10 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/15"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving Changes..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
