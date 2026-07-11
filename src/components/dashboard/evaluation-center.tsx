"use client";

import React, { useState } from "react";
import { submitEvaluation } from "@/actions/evaluation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Code, ExternalLink } from "lucide-react";

interface Criteria {
  name: string;
  maxPoints: number;
}

interface Submission {
  id: string;
  title: string;
  description: string;
  projectUrl?: string | null;
  repoUrl?: string | null;
  videoUrl?: string | null;
  team: {
    name: string;
  };
}

interface EvaluationCenterProps {
  submission: Submission;
  initialScores?: { criteriaName: string; points: number; maxPoints: number }[];
  initialFeedback?: string;
  onSuccess?: () => void;
}

const defaultCriteria: Criteria[] = [
  { name: "Innovation & Impact", maxPoints: 10 },
  { name: "Technical Execution", maxPoints: 10 },
  { name: "Design & UX", maxPoints: 10 },
  { name: "Feasibility & Pitch", maxPoints: 10 },
];

export function EvaluationCenter({
  submission,
  initialScores = [],
  initialFeedback = "",
  onSuccess,
}: EvaluationCenterProps) {
  // Initialize scores state
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const record: Record<string, number> = {};
    defaultCriteria.forEach((crit) => {
      const match = initialScores.find((sc) => sc.criteriaName === crit.name);
      record[crit.name] = match ? match.points : 5; // Default score is 5
    });
    return record;
  });

  const [feedback, setFeedback] = useState(initialFeedback);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScoreChange = (criteriaName: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [criteriaName]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const scorePayload = Object.entries(scores).map(([name, points]) => {
        const crit = defaultCriteria.find((c) => c.name === name);
        return {
          criteriaName: name,
          points,
          maxPoints: crit ? crit.maxPoints : 10,
        };
      });

      await submitEvaluation(submission.id, scorePayload, feedback);
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit scores");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans">
      {/* Submission Details Card */}
      <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 flex flex-col h-full justify-between">
        <div>
          <CardHeader className="border-b border-neutral-850/60 pb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Badge variant="outline" className="border-neutral-800 text-neutral-400 text-xs">
                Team: {submission.team.name}
              </Badge>
              <Award className="w-5 h-5 text-violet-400" />
            </div>
            <CardTitle className="text-xl font-bold mt-2">{submission.title}</CardTitle>
          </CardHeader>
          <CardContent className="py-6 space-y-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Project Summary</h4>
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {submission.description}
              </p>
            </div>

            {/* Links Block */}
            <div className="space-y-3 pt-4 border-t border-neutral-850/40">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Submission Assets</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {submission.repoUrl && (
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-violet-500/50 text-neutral-300 hover:text-neutral-100 text-xs transition-colors"
                  >
                    <Code className="w-4 h-4 text-violet-400" />
                    <span>View Repository</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
                  </a>
                )}
                {submission.projectUrl && (
                  <a
                    href={submission.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-violet-500/50 text-neutral-300 hover:text-neutral-100 text-xs transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-indigo-400" />
                    <span>Live Demo</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Scoring Card Panel */}
      <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 flex flex-col justify-between">
        <CardHeader className="border-b border-neutral-850/60 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Evaluation Rubric
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              Evaluation scores submitted and processed!
            </div>
          )}

          {/* Criteria List */}
          <div className="space-y-5">
            {defaultCriteria.map((crit) => (
              <div key={crit.name} className="space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-neutral-200">{crit.name}</span>
                  <span className="text-violet-400 font-bold">{scores[crit.name]} / {crit.maxPoints}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={crit.maxPoints}
                  value={scores[crit.name]}
                  onChange={(e) => handleScoreChange(crit.name, parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-lg bg-neutral-950 accent-violet-500 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* Feedback Section */}
          <div className="space-y-1.5 pt-4 border-t border-neutral-850/40">
            <Label htmlFor="feedback" className="text-xs font-semibold text-neutral-400">Written Feedback / Notes</Label>
            <textarea
              id="feedback"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What makes this submission distinct? Constructive feedback for the team..."
              className="w-full rounded-md bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-neutral-100 text-sm p-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <Button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="w-full bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold h-11 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/15"
          >
            {loading ? "Submitting Scores..." : "Submit Score Matrix"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
