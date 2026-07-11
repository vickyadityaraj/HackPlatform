"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateProfile } from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Check } from "lucide-react";

const profileFormSchema = z.object({
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  experience: z.string().optional().nullable(),
  resumeUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  githubUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  linkedInUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  portfolioUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  college: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  avatarUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  initialProfile: {
    id: string;
    userId: string;
    skills: string[];
    experience: string | null;
    resumeUrl: string | null;
    githubUrl: string | null;
    linkedInUrl: string | null;
    portfolioUrl: string | null;
    bio: string | null;
    college: string | null;
    country: string | null;
    avatarUrl: string | null;
    version: number;
  };
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [skills, setSkills] = useState<string[]>(initialProfile.skills);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      bio: initialProfile.bio || "",
      experience: initialProfile.experience || "",
      resumeUrl: initialProfile.resumeUrl || "",
      githubUrl: initialProfile.githubUrl || "",
      linkedInUrl: initialProfile.linkedInUrl || "",
      portfolioUrl: initialProfile.portfolioUrl || "",
      college: initialProfile.college || "",
      country: initialProfile.country || "",
      avatarUrl: initialProfile.avatarUrl || "",
    },
  });

  const addSkill = () => {
    const trimmed = skillInput.trim().toLowerCase();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        ...values,
        skills,
        version: initialProfile.version,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 font-sans">
      <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
        <CardHeader className="border-b border-neutral-850/50">
          <CardTitle className="text-xl font-bold">Personal Profile Setup</CardTitle>
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
              Profile updated successfully!
            </div>
          )}

          {/* Bio Description */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Professional Bio</Label>
            <textarea
              id="bio"
              rows={4}
              placeholder="Tell other developers about your journey, interests, or project goals..."
              className="w-full rounded-md bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-neutral-100 text-sm p-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
              {...form.register("bio")}
            />
            {form.formState.errors.bio && (
              <p className="text-xs text-red-500">{form.formState.errors.bio.message}</p>
            )}
          </div>

          {/* Academic & Geographic details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="college">College / University</Label>
              <Input
                id="college"
                placeholder="e.g. Stanford University"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
                {...form.register("college")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="e.g. United States"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
                {...form.register("country")}
              />
            </div>
          </div>

          {/* Experience level */}
          <div className="space-y-1.5">
            <Label htmlFor="experience">Experience Level</Label>
            <select
              id="experience"
              className="w-full h-10 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
              {...form.register("experience")}
            >
              <option value="">Select experience level...</option>
              <option value="Beginner (0-1 yrs)">Beginner (0-1 yrs)</option>
              <option value="Intermediate (2-4 yrs)">Intermediate (2-4 yrs)</option>
              <option value="Advanced (5+ yrs)">Advanced (5+ yrs)</option>
            </select>
          </div>

          {/* Social and Portfolio links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-850/40">
            <div className="space-y-1.5">
              <Label htmlFor="resumeUrl">Resume Link (Supabase/Drive URL)</Label>
              <Input
                id="resumeUrl"
                placeholder="https://drive.google.com/..."
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                {...form.register("resumeUrl")}
              />
              {form.formState.errors.resumeUrl && (
                <p className="text-xs text-red-500">{form.formState.errors.resumeUrl.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="portfolioUrl">Portfolio Website</Label>
              <Input
                id="portfolioUrl"
                placeholder="https://mywebsite.dev"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                {...form.register("portfolioUrl")}
              />
              {form.formState.errors.portfolioUrl && (
                <p className="text-xs text-red-500">{form.formState.errors.portfolioUrl.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="githubUrl">GitHub Profile URL</Label>
              <Input
                id="githubUrl"
                placeholder="https://github.com/myusername"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                {...form.register("githubUrl")}
              />
              {form.formState.errors.githubUrl && (
                <p className="text-xs text-red-500">{form.formState.errors.githubUrl.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="linkedInUrl">LinkedIn Profile URL</Label>
              <Input
                id="linkedInUrl"
                placeholder="https://linkedin.com/in/myusername"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                {...form.register("linkedInUrl")}
              />
              {form.formState.errors.linkedInUrl && (
                <p className="text-xs text-red-500">{form.formState.errors.linkedInUrl.message}</p>
              )}
            </div>
          </div>

          {/* Skills Tag Area */}
          <div className="space-y-3 pt-4 border-t border-neutral-850/40">
            <Label>Skills & Languages</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g. typescript, nextjs, postgresql (Press enter to add)"
                className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100"
              />
              <Button type="button" onClick={addSkill} className="bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200">
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-neutral-950 border border-neutral-850/60 rounded-lg">
              {skills.length === 0 ? (
                <span className="text-xs text-neutral-600 self-center px-1">No tags configured...</span>
              ) : (
                skills.map((tag) => (
                  <Badge key={tag} className="bg-violet-950/40 hover:bg-violet-950/60 text-violet-300 border border-violet-800/40 flex items-center gap-1 px-2.5 py-0.5 capitalize text-xs">
                    {tag}
                    <button type="button" onClick={() => removeSkill(tag)} className="hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 text-neutral-100 font-semibold h-11 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/15"
      >
        <Save className="w-5 h-5" />
        {loading ? "Updating Profile..." : "Save Profile Details"}
      </Button>
    </form>
  );
}
