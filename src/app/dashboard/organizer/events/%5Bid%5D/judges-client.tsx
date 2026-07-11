"use client";

import { useState } from "react";
import { addJudge, removeJudge } from "@/actions/organizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Loader2 } from "lucide-react";

interface Judge {
  id: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface JudgesClientProps {
  eventId: string;
  initialJudges: Judge[];
}

export default function JudgesClient({ eventId, initialJudges }: JudgesClientProps) {
  const [judges, setJudges] = useState<Judge[]>(initialJudges);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setAdding(true);
    setError(null);

    try {
      const mapping = await addJudge(eventId, email.trim());
      // Re-fetch or add to UI list manually if data returned contains user detail
      // Since mapping returned has target user mapped, we can query it or simply push to state.
      // For simplicity, we can alert the user to reload, or update state if targetUser is resolved.
      // Wait, addJudge returns the judge mapping with ID. We need targetUser info.
      // Let's reload page to show fresh database relation or update state.
      alert(`Judge assigned successfully! Please reload the page to refresh the view.`);
      window.location.reload();
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add judge.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveJudge = async (id: string) => {
    setRemovingId(id);
    try {
      await removeJudge(eventId, id);
      setJudges((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to remove judge.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Assign Judge Form */}
      <form onSubmit={handleAddJudge} className="max-w-md space-y-3">
        <Label htmlFor="judge-email" className="text-neutral-300">Assign Judge by Email</Label>
        <div className="flex gap-2">
          <Input
            id="judge-email"
            type="email"
            placeholder="judge@hackathon.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={adding}
            className="bg-neutral-950 border-neutral-850"
            required
          />
          <Button type="submit" disabled={adding} className="bg-violet-600 hover:bg-violet-700 shrink-0">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Assign
          </Button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>

      {/* Judges List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-300">Assigned Evaluators</h3>
        {judges.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4 bg-neutral-900/10 rounded border border-neutral-800 text-center">
            No judges assigned yet. Assign a user as a judge to start evaluations.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {judges.map((j) => (
              <div 
                key={j.id} 
                className="p-3 bg-neutral-900 border border-neutral-850 rounded-lg flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-neutral-200">{j.user.name || "Unnamed Evaluator"}</p>
                  <p className="text-neutral-500 font-mono mt-0.5">{j.user.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  disabled={removingId === j.id}
                  onClick={() => handleRemoveJudge(j.id)}
                >
                  {removingId === j.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
