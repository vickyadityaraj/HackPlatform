"use client";

import React, { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateEvent } from "@/actions/events";
import { uploadFile } from "@/actions/storage";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Save, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Calendar, 
  Sliders, 
  Info,
  Layers,
  HelpCircle,
  Trophy,
  CheckCircle
} from "lucide-react";

const eventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  bannerUrl: z.string().optional().nullable().or(z.literal("")),
  paymentQrUrl: z.string().optional().nullable().or(z.literal("")),
  registrationStart: z.string().min(1, "Required"),
  registrationEnd: z.string().min(1, "Required"),
  eventStart: z.string().min(1, "Required"),
  eventEnd: z.string().min(1, "Required"),
  rules: z.string().optional().nullable(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).optional().nullable(),
  prizes: z.array(z.object({ rank: z.number(), title: z.string(), reward: z.string() })).optional().nullable(),
  sponsors: z.array(z.object({ name: z.string(), logo: z.string(), tier: z.string() })).optional().nullable(),
  schedule: z.array(z.object({ time: z.string(), title: z.string() })).optional().nullable(),
  timeline: z.array(z.object({ date: z.string(), label: z.string() })).optional().nullable(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EditEventFormProps {
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    bannerUrl: string | null;
    paymentQrUrl: string | null;
    registrationStart: Date;
    registrationEnd: Date;
    eventStart: Date;
    eventEnd: Date;
    rules: string | null;
    faq: any;
    prizes: any;
    sponsors: any;
    schedule: any;
    timeline: any;
    version: number;
  };
}

function toLocalDatetimeString(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if the event is already completed
  const isCompleted = new Date() > new Date(event.eventEnd);

  // Parse JSON properties
  const parseJson = (val: any) => {
    if (!val) return [];
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event.title,
      slug: event.slug,
      description: event.description,
      bannerUrl: event.bannerUrl || "",
      paymentQrUrl: event.paymentQrUrl || "",
      registrationStart: toLocalDatetimeString(event.registrationStart),
      registrationEnd: toLocalDatetimeString(event.registrationEnd),
      eventStart: toLocalDatetimeString(event.eventStart),
      eventEnd: toLocalDatetimeString(event.eventEnd),
      rules: event.rules || "",
      faq: parseJson(event.faq),
      prizes: parseJson(event.prizes),
      sponsors: parseJson(event.sponsors),
      schedule: parseJson(event.schedule),
      timeline: parseJson(event.timeline),
    },
  });

  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({
    control: form.control,
    name: "faq",
  });

  const { fields: prizeFields, append: appendPrize, remove: removePrize } = useFieldArray({
    control: form.control,
    name: "prizes",
  });

  const { fields: sponsorFields, append: appendSponsor, remove: removeSponsor } = useFieldArray({
    control: form.control,
    name: "sponsors",
  });

  const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({
    control: form.control,
    name: "schedule",
  });

  const { fields: timelineFields, append: appendTimeline, remove: removeTimeline } = useFieldArray({
    control: form.control,
    name: "timeline",
  });

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "banners");
      const res = await uploadFile(data);
      form.setValue("bannerUrl", res.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload banner image");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "payment-qrs");
      const res = await uploadFile(data);
      form.setValue("paymentQrUrl", res.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload payment QR code");
    } finally {
      setUploadingQr(false);
    }
  };

  const onSubmit = async (values: EventFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateEvent(event.id, {
        ...values,
        bannerUrl: values.bannerUrl || null,
        paymentQrUrl: values.paymentQrUrl || null,
        registrationStart: new Date(values.registrationStart),
        registrationEnd: new Date(values.registrationEnd),
        eventStart: new Date(values.eventStart),
        eventEnd: new Date(values.eventEnd),
        rules: values.rules || null,
        faq: values.faq || null,
        prizes: values.prizes || null,
        sponsors: values.sponsors || null,
        schedule: values.schedule || null,
        timeline: values.timeline || null,
        version: event.version,
      });
      setSuccess("Event details updated successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update event parameters");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 shadow-xl overflow-hidden font-sans">
      {/* Alert if Event is Completed */}
      {isCompleted && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 text-amber-400 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />
          <span>This event has completed. Dates and details are now locked and cannot be edited.</span>
        </div>
      )}

      <CardContent className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="bg-neutral-950 border border-neutral-800 p-1 rounded-lg flex flex-wrap max-w-full mb-6">
              <TabsTrigger
                value="basic"
                className="flex-1 py-1.5 text-xs font-semibold rounded text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="dates"
                className="flex-1 py-1.5 text-xs font-semibold rounded text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                Dates
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="flex-1 py-1.5 text-xs font-semibold rounded text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Assets
              </TabsTrigger>
              <TabsTrigger
                value="agenda"
                className="flex-1 py-1.5 text-xs font-semibold rounded text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                Agenda & Timeline
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="flex-1 py-1.5 text-xs font-semibold rounded text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                FAQ & Prizes
              </TabsTrigger>
            </TabsList>

            {/* TAB: Basic Info */}
            <TabsContent value="basic" className="space-y-4 outline-none">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold text-neutral-400">Event Title</Label>
                <Input
                  id="title"
                  disabled={isCompleted}
                  className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-sm"
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
                <Label htmlFor="slug" className="text-xs font-bold text-neutral-400">Event URL Slug</Label>
                <Input
                  id="slug"
                  disabled={isCompleted}
                  className="bg-neutral-955 border-neutral-805 focus:border-violet-500 text-neutral-100 font-mono text-xs"
                  placeholder="e.g. global-ai-hackathon-2026"
                  {...form.register("slug")}
                />
                {form.formState.errors.slug && (
                  <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-neutral-400">Description</Label>
                <textarea
                  id="description"
                  rows={6}
                  disabled={isCompleted}
                  className="w-full rounded bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-neutral-100 text-sm p-3 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-55"
                  placeholder="Detailed introduction of the hackathon theme..."
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rules" className="text-xs font-bold text-neutral-400">Hackathon Rules & Guidelines</Label>
                <textarea
                  id="rules"
                  rows={4}
                  disabled={isCompleted}
                  className="w-full rounded bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-neutral-100 text-sm p-3 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-55"
                  placeholder="Configure criteria for disqualification, team sizes, and submission guidelines..."
                  {...form.register("rules")}
                />
              </div>
            </TabsContent>

            {/* TAB: Dates */}
            <TabsContent value="dates" className="space-y-4 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="registrationStart" className="text-xs font-bold text-neutral-400">Registration Start Date</Label>
                  <Input
                    id="registrationStart"
                    type="datetime-local"
                    disabled={isCompleted}
                    className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                    {...form.register("registrationStart")}
                  />
                  {form.formState.errors.registrationStart && (
                    <p className="text-xs text-red-500">{form.formState.errors.registrationStart.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="registrationEnd" className="text-xs font-bold text-neutral-400">Registration End Date</Label>
                  <Input
                    id="registrationEnd"
                    type="datetime-local"
                    disabled={isCompleted}
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
                  <Label htmlFor="eventStart" className="text-xs font-bold text-neutral-400">Hackathon Start Date</Label>
                  <Input
                    id="eventStart"
                    type="datetime-local"
                    disabled={isCompleted}
                    className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                    {...form.register("eventStart")}
                  />
                  {form.formState.errors.eventStart && (
                    <p className="text-xs text-red-500">{form.formState.errors.eventStart.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eventEnd" className="text-xs font-bold text-neutral-400">Hackathon End Date</Label>
                  <Input
                    id="eventEnd"
                    type="datetime-local"
                    disabled={isCompleted}
                    className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                    {...form.register("eventEnd")}
                  />
                  {form.formState.errors.eventEnd && (
                    <p className="text-xs text-red-500">{form.formState.errors.eventEnd.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB: Media & Assets */}
            <TabsContent value="media" className="space-y-4 outline-none">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Event Banner Image</Label>
                <div className="relative w-full h-44 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center overflow-hidden group">
                  {form.watch("bannerUrl") ? (
                    <>
                      <img
                        src={form.watch("bannerUrl") || ""}
                        alt="Banner Preview"
                        className="h-full w-full object-cover"
                      />
                      {!isCompleted && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-200">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => bannerInputRef.current?.click()}
                            className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                          >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Change Banner
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => form.setValue("bannerUrl", "")}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <ImageIcon className="w-8 h-8 text-neutral-600 mb-2" />
                      <p className="text-xs text-neutral-500 mb-2">No banner uploaded</p>
                      {!isCompleted && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingBanner}
                          onClick={() => bannerInputRef.current?.click()}
                          className="border-neutral-800 bg-neutral-900 text-neutral-355 hover:bg-neutral-800"
                        >
                          {uploadingBanner ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 mr-1.5" />
                              Upload Banner
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerUpload}
                  disabled={isCompleted}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Payment QR Code (Optional)</Label>
                <div className="relative border border-neutral-800 rounded-lg bg-neutral-950 overflow-hidden min-h-[110px] flex items-center justify-center">
                  {form.watch("paymentQrUrl") ? (
                    <div className="p-4 w-full flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-violet-400 shrink-0" />
                        <span className="text-xs text-neutral-300 font-semibold truncate max-w-[300px]">Payment QR Code Uploaded</span>
                      </div>
                      {!isCompleted && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => form.setValue("paymentQrUrl", "")}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20 h-8"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <ImageIcon className="w-6 h-6 text-neutral-600 mb-1" />
                      {!isCompleted && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingQr}
                          onClick={() => qrInputRef.current?.click()}
                          className="border-neutral-800 bg-neutral-900 text-neutral-355 hover:bg-neutral-800 text-[11px] h-8"
                        >
                          {uploadingQr ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 mr-1.5" />
                              Upload Payment QR
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={qrInputRef}
                  onChange={handleQrUpload}
                  disabled={isCompleted}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </TabsContent>

            {/* TAB: Agenda & Timeline */}
            <TabsContent value="agenda" className="space-y-6 outline-none">
              {/* Event Schedule List Builder */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <div>
                    <Label className="text-sm font-bold text-neutral-200">Event Schedule</Label>
                    <p className="text-xs text-neutral-500 mt-0.5">Program sequence of slots and timings.</p>
                  </div>
                  {!isCompleted && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendSchedule({ time: "", title: "" })}
                      className="h-8 border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-850"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Slot
                    </Button>
                  )}
                </div>
                
                {scheduleFields.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-4 text-center">No schedule slots configured.</p>
                ) : (
                  <div className="space-y-3">
                    {scheduleFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start bg-neutral-950 p-3 rounded-lg border border-neutral-850">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                          <div className="sm:col-span-1">
                            <Input
                              disabled={isCompleted}
                              placeholder="e.g. 10:00 AM"
                              className="bg-neutral-900 border-neutral-800 text-xs text-neutral-200"
                              {...form.register(`schedule.${index}.time` as const)}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Input
                              disabled={isCompleted}
                              placeholder="e.g. Opening Ceremony & Keynote"
                              className="bg-neutral-900 border-neutral-800 text-xs text-neutral-200"
                              {...form.register(`schedule.${index}.title` as const)}
                            />
                          </div>
                        </div>
                        {!isCompleted && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSchedule(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20 px-2 h-9"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Milestone Timeline List Builder */}
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <div>
                    <Label className="text-sm font-bold text-neutral-200">Milestone Timeline</Label>
                    <p className="text-xs text-neutral-500 mt-0.5">Crucial dates, deadlines, and markers.</p>
                  </div>
                  {!isCompleted && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendTimeline({ date: "", label: "" })}
                      className="h-8 border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-850"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone
                    </Button>
                  )}
                </div>

                {timelineFields.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-4 text-center">No milestones configured.</p>
                ) : (
                  <div className="space-y-3">
                    {timelineFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start bg-neutral-950 p-3 rounded-lg border border-neutral-850">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                          <div className="sm:col-span-1">
                            <Input
                              disabled={isCompleted}
                              placeholder="e.g. Oct 24, 2026"
                              className="bg-neutral-900 border-neutral-800 text-xs text-neutral-200"
                              {...form.register(`timeline.${index}.date` as const)}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Input
                              disabled={isCompleted}
                              placeholder="e.g. Proposal Submission Deadline"
                              className="bg-neutral-900 border-neutral-800 text-xs text-neutral-200"
                              {...form.register(`timeline.${index}.label` as const)}
                            />
                          </div>
                        </div>
                        {!isCompleted && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeline(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20 px-2 h-9"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: FAQ & Prizes */}
            <TabsContent value="content" className="space-y-6 outline-none">
              {/* FAQ List Builder */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <div>
                    <Label className="text-sm font-bold text-neutral-200">Frequently Asked Questions (FAQ)</Label>
                    <p className="text-xs text-neutral-500 mt-0.5">Common developer queries and your answers.</p>
                  </div>
                  {!isCompleted && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendFaq({ q: "", a: "" })}
                      className="h-8 border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-850"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add FAQ
                    </Button>
                  )}
                </div>

                {faqFields.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-4 text-center">No FAQ questions configured.</p>
                ) : (
                  <div className="space-y-4">
                    {faqFields.map((field, index) => (
                      <div key={field.id} className="bg-neutral-950 p-4 rounded-lg border border-neutral-850 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Question #{index + 1}</span>
                          {!isCompleted && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFaq(index)}
                              className="text-red-400 hover:text-red-350 hover:bg-red-950/10 px-2 h-8"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            disabled={isCompleted}
                            placeholder="Question text..."
                            className="bg-neutral-900 border-neutral-800 text-xs text-neutral-200"
                            {...form.register(`faq.${index}.q` as const)}
                          />
                          <textarea
                            disabled={isCompleted}
                            rows={2}
                            placeholder="Answer description..."
                            className="w-full rounded bg-neutral-900 border border-neutral-800 focus:border-violet-500 text-neutral-200 text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-55"
                            {...form.register(`faq.${index}.a` as const)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prizes List Builder */}
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <div>
                    <Label className="text-sm font-bold text-neutral-200">Prizes & Rewards</Label>
                    <p className="text-xs text-neutral-500 mt-0.5">Define ranks, rewards, and cash prizes.</p>
                  </div>
                  {!isCompleted && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendPrize({ rank: prizeFields.length + 1, title: "", reward: "" })}
                      className="h-8 border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-850"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Prize
                    </Button>
                  )}
                </div>

                {prizeFields.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-4 text-center">No prizes configured.</p>
                ) : (
                  <div className="space-y-3">
                    {prizeFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start bg-neutral-955 p-3 rounded-lg border border-neutral-850">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                          <div>
                            <Input
                              type="number"
                              disabled={isCompleted}
                              placeholder="Rank"
                              className="bg-neutral-900 border-neutral-800 text-xs text-neutral-200"
                              {...form.register(`prizes.${index}.rank` as const, { valueAsNumber: true })}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Input
                              disabled={isCompleted}
                              placeholder="e.g. Grand Winner"
                              className="bg-neutral-900 border-neutral-800 text-xs text-neutral-200"
                              {...form.register(`prizes.${index}.title` as const)}
                            />
                          </div>
                          <div>
                            <Input
                              disabled={isCompleted}
                              placeholder="e.g. $5,000 Cash"
                              className="bg-neutral-900 border-neutral-800 text-xs text-neutral-200"
                              {...form.register(`prizes.${index}.reward` as const)}
                            />
                          </div>
                        </div>
                        {!isCompleted && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePrize(index)}
                            className="text-red-400 hover:text-red-350 hover:bg-red-955/20 px-2 h-9"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Form Save Footer */}
          {!isCompleted && (
            <div className="flex justify-end pt-4 border-t border-neutral-800">
              <Button
                type="submit"
                disabled={loading}
                className="bg-violet-600 hover:bg-violet-700 text-neutral-100 font-semibold px-6 shadow-md shadow-violet-500/10 transition-all duration-200 flex items-center gap-2 h-10 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Event Details
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
