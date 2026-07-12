"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitProject } from "@/actions/evaluation";
import { useRouter } from "next/navigation";

const submissionFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  projectUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  repoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type SubmissionFormValues = z.infer<typeof submissionFormSchema>;

interface ProjectSubmissionDialogProps {
  teamId: string;
  eventId: string;
  trigger: React.ReactElement;
  initialValues?: {
    title: string;
    description: string;
    projectUrl?: string | null;
    repoUrl?: string | null;
    videoUrl?: string | null;
  } | null;
}

export function ProjectSubmissionDialog({
  teamId,
  eventId,
  trigger,
  initialValues,
}: ProjectSubmissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      title: initialValues?.title || "",
      description: initialValues?.description || "",
      projectUrl: initialValues?.projectUrl || "",
      repoUrl: initialValues?.repoUrl || "",
      videoUrl: initialValues?.videoUrl || "",
    },
  });

  const onSubmit = async (values: SubmissionFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await submitProject(teamId, eventId, {
        title: values.title,
        description: values.description,
        projectUrl: values.projectUrl || null,
        repoUrl: values.repoUrl || null,
        videoUrl: values.videoUrl || null,
      });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[550px] bg-neutral-900 border-neutral-800 text-neutral-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialValues ? "Update Project Submission" : "Submit Hackathon Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Project Name</Label>
            <Input
              id="title"
              className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
              placeholder="e.g. HealthTracker AI"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Project Description</Label>
            <textarea
              id="description"
              rows={4}
              placeholder="Describe your project, the problem it solves, and how you built it..."
              className="w-full rounded-md bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-neutral-100 text-sm p-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="repoUrl">GitHub / Code Repository URL</Label>
            <Input
              id="repoUrl"
              className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
              placeholder="https://github.com/username/project"
              {...form.register("repoUrl")}
            />
            {form.formState.errors.repoUrl && (
              <p className="text-xs text-red-500">{form.formState.errors.repoUrl.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectUrl">Live Demo URL</Label>
            <Input
              id="projectUrl"
              className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
              placeholder="https://project.vercel.app"
              {...form.register("projectUrl")}
            />
            {form.formState.errors.projectUrl && (
              <p className="text-xs text-red-500">{form.formState.errors.projectUrl.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="videoUrl">Pitch Video / Demo Video URL (optional)</Label>
            <Input
              id="videoUrl"
              className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
              placeholder="https://youtube.com/watch?v=..."
              {...form.register("videoUrl")}
            />
            {form.formState.errors.videoUrl && (
              <p className="text-xs text-red-500">{form.formState.errors.videoUrl.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-850">
            <Button
              type="button"
              variant="outline"
              className="border-neutral-850 bg-neutral-950 text-neutral-450 hover:text-neutral-200"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold px-6 shadow-md shadow-violet-500/15"
            >
              {loading ? "Submitting..." : "Submit Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
