"use client";

import React, { useState } from "react";
import { registerForEvent } from "@/actions/registration";
import { uploadFile } from "@/actions/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";

interface CustomQuestion {
  id: string;
  type: "text" | "select" | "checkbox";
  label: string;
  required: boolean;
  options?: string[];
}

interface RegisterDialogProps {
  eventId: string;
  customQuestions: CustomQuestion[];
  trigger: React.ReactElement;
  paymentQrUrl?: string | null;
}

export function RegisterDialog({ eventId, customQuestions, trigger, paymentQrUrl }: RegisterDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>(() => {
    const record: Record<string, string | boolean> = {};
    customQuestions.forEach((q) => {
      record[q.id] = q.type === "checkbox" ? false : "";
    });
    return record;
  });

  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTextChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: checked }));
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScreenshot(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "payment-screenshots");
      const res = await uploadFile(data);
      setScreenshotUrl(res.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload payment screenshot");
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required custom questions
      for (const q of customQuestions) {
        const ans = answers[q.id];
        if (q.required) {
          if (q.type === "checkbox" && !ans) {
            throw new Error(`You must accept or check: "${q.label}"`);
          }
          if (q.type !== "checkbox" && (!ans || String(ans).trim() === "")) {
            throw new Error(`Please answer the question: "${q.label}"`);
          }
        }
      }

      // Enforce payment screenshot uploading if paymentQrUrl is present
      if (paymentQrUrl && !screenshotUrl) {
        throw new Error("Please upload the screenshot of your payment to proceed.");
      }

      // Convert answers dictionary to array format for database
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: String(answer),
      }));

      await registerForEvent(eventId, answersArray, screenshotUrl || null);
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to complete registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[500px] bg-neutral-900 border-neutral-800 text-neutral-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Hackathon Registration</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="font-bold text-neutral-50 text-base">Registration Confirmed!</h3>
            <p className="text-neutral-500 text-xs">
              Redirecting you to the participant dashboards...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {error && (
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            {customQuestions.length === 0 ? (
              <p className="text-sm text-neutral-400 leading-relaxed py-2">
                Click register below to confirm your signup for this event. No custom questions are required.
              </p>
            ) : (
              <div className="space-y-4">
                {customQuestions.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <Label className="font-semibold text-neutral-200">
                      {q.label}
                      {q.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    {q.type === "text" && (
                      <Input
                        value={String(answers[q.id] || "")}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="Write your answer..."
                        className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
                      />
                    )}

                    {q.type === "select" && (
                      <select
                        value={String(answers[q.id] || "")}
                        onChange={(e) => handleSelectChange(q.id, e.target.value)}
                        className="w-full h-10 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      >
                        <option value="">Select option...</option>
                        {q.options?.map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {q.type === "checkbox" && (
                      <div className="flex items-center gap-2.5 pt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(answers[q.id])}
                          onChange={(e) => handleCheckboxChange(q.id, e.target.checked)}
                          className="w-4 h-4 rounded border-neutral-800 bg-neutral-950 text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-xs text-neutral-400">Confirmation accepted</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {paymentQrUrl && (
              <div className="space-y-4 pt-2 border-t border-neutral-850/60">
                <div className="space-y-1.5 bg-neutral-950 border border-neutral-850 p-4 rounded-xl text-center">
                  <Label className="font-bold text-neutral-400 text-[10px] uppercase tracking-wider block">Scan QR Code to Pay</Label>
                  <img
                    src={paymentQrUrl}
                    alt="Payment QR"
                    className="mx-auto max-h-[180px] object-contain rounded border border-neutral-800 p-1 bg-white"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Please pay the registration fee before submitting screenshot proof.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-neutral-200">
                    Upload Payment Screenshot <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-col gap-2 p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs">
                    <input
                      type="file"
                      id="screenshot-file-input"
                      onChange={handleScreenshotUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {screenshotUrl ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-violet-400">
                          <ImageIcon className="w-5 h-5 shrink-0" />
                          <span className="truncate max-w-[200px]">Screenshot Uploaded</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setScreenshotUrl("")}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20 h-7"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <ImageIcon className="w-8 h-8 text-neutral-600 mb-2" />
                        <p className="text-xs text-neutral-400 mb-2">Upload payment receipt/screenshot (PNG, JPG, WEBP)</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingScreenshot}
                          onClick={() => document.getElementById("screenshot-file-input")?.click()}
                          className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 text-[11px] h-8"
                        >
                          {uploadingScreenshot ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 mr-1.5" />
                              Upload Screenshot
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <Button
                type="button"
                variant="outline"
                className="border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold px-6 shadow-md shadow-violet-500/10"
              >
                {loading ? "Registering..." : "Confirm Signup"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
