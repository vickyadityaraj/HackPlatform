"use client";

import React, { useState } from "react";
import { saveCustomQuestions } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Save, Eye, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Question {
  id: string;
  type: "text" | "select" | "checkbox";
  label: string;
  required: boolean;
  options?: string[];
}

interface FormBuilderProps {
  eventId: string;
  initialQuestions?: Question[];
}

export function FormBuilder({ eventId, initialQuestions = [] }: FormBuilderProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"text" | "select" | "checkbox">("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptionsStr, setNewOptionsStr] = useState(""); // comma separated for select
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = () => {
    if (!newLabel.trim()) return;

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type: newType,
      label: newLabel.trim(),
      required: newRequired,
      options: newType === "select" ? newOptionsStr.split(",").map(o => o.trim()).filter(Boolean) : undefined,
    };

    setQuestions([...questions, newQuestion]);
    setNewLabel("");
    setNewOptionsStr("");
    setNewRequired(false);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const saveForm = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      await saveCustomQuestions(eventId, questions);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save registration form fields");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans">
      {/* Editor Panel */}
      <div className="space-y-6">
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Add Question Field</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="label">Field Question / Label</Label>
              <Input
                id="label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. What is your shirt size?"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">Input Type</Label>
                <select
                  id="type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full h-10 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="text">Text Input</option>
                  <option value="select">Dropdown Select</option>
                  <option value="checkbox">Checkbox Confirmation</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  id="required"
                  type="checkbox"
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-800 bg-neutral-950 text-violet-600 focus:ring-violet-500"
                />
                <Label htmlFor="required">Required Field</Label>
              </div>
            </div>

            {newType === "select" && (
              <div className="space-y-1.5">
                <Label htmlFor="options">Dropdown Options (Comma separated)</Label>
                <Input
                  id="options"
                  value={newOptionsStr}
                  onChange={(e) => setNewOptionsStr(e.target.value)}
                  placeholder="e.g. Small, Medium, Large"
                  className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
                />
              </div>
            )}

            <Button
              type="button"
              onClick={addQuestion}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-100 flex items-center justify-center gap-2 h-10 border border-neutral-700 mt-2"
            >
              <Plus className="w-5 h-5" />
              Add to Form
            </Button>
          </CardContent>
        </Card>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            disabled={loading}
            onClick={saveForm}
            className="flex-1 bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold h-11 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/10"
          >
            <Save className="w-5 h-5" />
            {loading ? "Saving..." : "Save Configuration"}
          </Button>

          {success && (
            <div className="px-4 py-2 flex items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              Form configuration updated successfully!
            </div>
          )}

          {error && (
            <div className="px-4 py-2 flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Preview / Fields List Panel */}
      <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 flex flex-col h-full">
        <CardHeader className="border-b border-neutral-800">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-400" />
            Registration Form Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 py-6 space-y-5 overflow-y-auto">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
              <Plus className="w-10 h-10 text-neutral-600 mb-2" />
              <p className="text-sm">No custom fields defined yet</p>
              <p className="text-xs text-neutral-600 mt-0.5">Use the left editor to add questions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {questions.map((q) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="p-4 rounded-lg bg-neutral-950 border border-neutral-850/60 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-neutral-100">{q.label}</span>
                        {q.required && <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Required</Badge>}
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-neutral-800 text-neutral-400">{q.type}</Badge>
                      </div>

                      {/* Mock Render */}
                      {q.type === "text" && (
                        <div className="w-full h-9 rounded bg-neutral-900 border border-neutral-800/40 opacity-40 px-3 flex items-center text-xs text-neutral-500 select-none">
                          User answers text here...
                        </div>
                      )}

                      {q.type === "select" && (
                        <div className="space-y-1">
                          <div className="w-full h-9 rounded bg-neutral-900 border border-neutral-800/40 opacity-40 px-3 flex items-center justify-between text-xs text-neutral-500 select-none">
                            <span>Select option...</span>
                            <span>▼</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {q.options?.map((opt, i) => (
                              <span key={i} className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded">
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === "checkbox" && (
                        <div className="flex items-center gap-2 opacity-55 select-none">
                          <div className="w-4 h-4 rounded border border-neutral-800/55 bg-neutral-900" />
                          <span className="text-xs text-neutral-400">Accept confirmation option</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="text-neutral-500 hover:text-red-400 p-1 hover:bg-neutral-900 rounded transition-colors mt-0.5"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
