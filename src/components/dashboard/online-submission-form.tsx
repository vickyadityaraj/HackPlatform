'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitTeamOnlineRound } from "@/actions/yantrayuga";

interface OnlineSubmissionFormProps {
  teamId: string;
}

export function OnlineSubmissionForm({ teamId }: OnlineSubmissionFormProps) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      alert("Please provide your proposal or slide link.");
      return;
    }
    setLoading(true);
    try {
      await submitTeamOnlineRound(teamId, url, text);
      alert("Online round materials submitted successfully!");
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to submit online round materials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">PPT / Slide URL *</label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/presentation/d/... or canva link"
          className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Proposal Summary (Optional)</label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Briefly summarize your idea, tech stack, and roadmap..."
          className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-550 resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs h-10 shadow-lg shadow-violet-500/10"
      >
        {loading ? "Submitting..." : "Submit Materials"}
      </Button>
    </form>
  );
}
