"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEvent } from "@/actions/events";
import { useRouter } from "next/navigation";

const eventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  registrationStart: z.string().min(1, "Required"),
  registrationEnd: z.string().min(1, "Required"),
  eventStart: z.string().min(1, "Required"),
  eventEnd: z.string().min(1, "Required"),
  rules: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export function CreateEventDialog({ trigger }: { trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      registrationStart: "",
      registrationEnd: "",
      eventStart: "",
      eventEnd: "",
      rules: "",
    },
  });

  const onSubmit = async (values: EventFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await createEvent({
        ...values,
        registrationStart: new Date(values.registrationStart),
        registrationEnd: new Date(values.registrationEnd),
        eventStart: new Date(values.eventStart),
        eventEnd: new Date(values.eventEnd),
      });
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[600px] bg-neutral-900 border-neutral-800 text-neutral-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Configure New Hackathon</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
              placeholder="e.g. Global AI Hackathon 2026"
              {...form.register("title", {
                onChange: (e) => {
                  const suggestedSlug = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
                  form.setValue("slug", suggestedSlug);
                },
              })}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Event URL Slug</Label>
            <Input
              id="slug"
              className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 font-mono text-xs"
              placeholder="e.g. global-ai-hackathon-2026"
              {...form.register("slug")}
            />
            {form.formState.errors.slug && (
              <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={4}
              className="w-full rounded-md bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-neutral-100 text-sm p-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Detailed introduction of the hackathon theme..."
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="registrationStart">Registration Start Date</Label>
              <Input
                id="registrationStart"
                type="datetime-local"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                {...form.register("registrationStart")}
              />
              {form.formState.errors.registrationStart && (
                <p className="text-xs text-red-500">{form.formState.errors.registrationStart.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="registrationEnd">Registration End Date</Label>
              <Input
                id="registrationEnd"
                type="datetime-local"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                {...form.register("registrationEnd")}
              />
              {form.formState.errors.registrationEnd && (
                <p className="text-xs text-red-500">{form.formState.errors.registrationEnd.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="eventStart">Hackathon Start Date</Label>
              <Input
                id="eventStart"
                type="datetime-local"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                {...form.register("eventStart")}
              />
              {form.formState.errors.eventStart && (
                <p className="text-xs text-red-500">{form.formState.errors.eventStart.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="eventEnd">Hackathon End Date</Label>
              <Input
                id="eventEnd"
                type="datetime-local"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                {...form.register("eventEnd")}
              />
              {form.formState.errors.eventEnd && (
                <p className="text-xs text-red-500">{form.formState.errors.eventEnd.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rules">Hackathon Rules & Guidelines</Label>
            <textarea
              id="rules"
              rows={3}
              className="w-full rounded-md bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-neutral-100 text-sm p-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Configure criteria for disqualification, team sizes, and submission guidelines..."
              {...form.register("rules")}
            />
          </div>

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
              {loading ? "Creating..." : "Save Draft"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
