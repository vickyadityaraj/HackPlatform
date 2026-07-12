"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTeam } from "@/actions/teams";
import { useRouter } from "next/navigation";

const teamFormSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters").max(30, "Team name must be less than 30 characters"),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

interface CreateTeamDialogProps {
  eventId: string;
  trigger: React.ReactElement;
}

export function CreateTeamDialog({ eventId, trigger }: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: TeamFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await createTeam(values.name, eventId);
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[420px] bg-neutral-900 border-neutral-800 text-neutral-100">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create a New Team</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-3">
          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-neutral-300">Team Name</Label>
            <Input
              id="name"
              className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
              placeholder="e.g. ByteBusters"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-850">
            <Button
              type="button"
              variant="outline"
              className="border-neutral-850 bg-neutral-950 text-neutral-450 hover:text-neutral-200 text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold px-5 shadow-md shadow-violet-500/15 text-xs"
            >
              {loading ? "Creating..." : "Confirm & Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
