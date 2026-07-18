"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createOrAssignOrganizer } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { UserPlus, Link2, Loader2, Mail, Shield, User, KeyRound, Calendar, Globe, FileText } from "lucide-react";

// Schemas with inline event validation if mode is "new"
const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  eventMode: z.enum(["existing", "new"]),
  eventId: z.string().optional(),
  eventTitle: z.string().optional(),
  eventSlug: z.string().optional(),
  eventDescription: z.string().optional(),
  eventRegistrationStart: z.string().optional(),
  eventRegistrationEnd: z.string().optional(),
  eventEventStart: z.string().optional(),
  eventEventEnd: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.eventMode === "existing") {
    if (!data.eventId || data.eventId === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select an event",
        path: ["eventId"],
      });
    }
  } else {
    if (!data.eventTitle || data.eventTitle.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Title must be at least 3 characters",
        path: ["eventTitle"],
      });
    }
    if (!data.eventSlug || data.eventSlug.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Slug must be at least 3 characters",
        path: ["eventSlug"],
      });
    }
    if (!data.eventDescription || data.eventDescription.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Description must be at least 10 characters",
        path: ["eventDescription"],
      });
    }
    if (!data.eventRegistrationStart || data.eventRegistrationStart === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["eventRegistrationStart"],
      });
    }
    if (!data.eventRegistrationEnd || data.eventRegistrationEnd === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["eventRegistrationEnd"],
      });
    }
    if (!data.eventEventStart || data.eventEventStart === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["eventEventStart"],
      });
    }
    if (!data.eventEventEnd || data.eventEventEnd === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["eventEventEnd"],
      });
    }
  }
});

const assignSchema = z.object({
  email: z.string().email("Invalid email address"),
  eventMode: z.enum(["existing", "new"]),
  eventId: z.string().optional(),
  eventTitle: z.string().optional(),
  eventSlug: z.string().optional(),
  eventDescription: z.string().optional(),
  eventRegistrationStart: z.string().optional(),
  eventRegistrationEnd: z.string().optional(),
  eventEventStart: z.string().optional(),
  eventEventEnd: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.eventMode === "existing") {
    if (!data.eventId || data.eventId === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select an event",
        path: ["eventId"],
      });
    }
  } else {
    if (!data.eventTitle || data.eventTitle.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Title must be at least 3 characters",
        path: ["eventTitle"],
      });
    }
    if (!data.eventSlug || data.eventSlug.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Slug must be at least 3 characters",
        path: ["eventSlug"],
      });
    }
    if (!data.eventDescription || data.eventDescription.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Description must be at least 10 characters",
        path: ["eventDescription"],
      });
    }
    if (!data.eventRegistrationStart || data.eventRegistrationStart === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["eventRegistrationStart"],
      });
    }
    if (!data.eventRegistrationEnd || data.eventRegistrationEnd === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["eventRegistrationEnd"],
      });
    }
    if (!data.eventEventStart || data.eventEventStart === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["eventEventStart"],
      });
    }
    if (!data.eventEventEnd || data.eventEventEnd === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["eventEventEnd"],
      });
    }
  }
});

type CreateFormValues = z.infer<typeof createSchema>;
type AssignFormValues = z.infer<typeof assignSchema>;

interface EventOption {
  id: string;
  title: string;
}

interface CreateOrganizerDialogProps {
  events: EventOption[];
}

export function CreateOrganizerDialog({ events }: CreateOrganizerDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "assign">("create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { 
      name: "", 
      email: "", 
      password: "", 
      eventMode: "existing", 
      eventId: "",
      eventTitle: "",
      eventSlug: "",
      eventDescription: "",
      eventRegistrationStart: "",
      eventRegistrationEnd: "",
      eventEventStart: "",
      eventEventEnd: "",
    },
  });

  const assignForm = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { 
      email: "", 
      eventMode: "existing", 
      eventId: "",
      eventTitle: "",
      eventSlug: "",
      eventDescription: "",
      eventRegistrationStart: "",
      eventRegistrationEnd: "",
      eventEventStart: "",
      eventEventEnd: "",
    },
  });

  const createEventMode = createForm.watch("eventMode");
  const assignEventMode = assignForm.watch("eventMode");

  const onSubmitCreate = async (values: CreateFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        mode: "create",
        name: values.name,
        email: values.email,
        password: values.password,
        eventMode: values.eventMode,
      };

      if (values.eventMode === "existing") {
        payload.eventId = values.eventId;
      } else {
        payload.newEventData = {
          title: values.eventTitle!,
          slug: values.eventSlug!,
          description: values.eventDescription!,
          registrationStart: values.eventRegistrationStart!,
          registrationEnd: values.eventRegistrationEnd!,
          eventStart: values.eventEventStart!,
          eventEnd: values.eventEventEnd!,
        };
      }

      await createOrAssignOrganizer(payload);
      setOpen(false);
      createForm.reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create organizer");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitAssign = async (values: AssignFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        mode: "assign",
        email: values.email,
        eventMode: values.eventMode,
      };

      if (values.eventMode === "existing") {
        payload.eventId = values.eventId;
      } else {
        payload.newEventData = {
          title: values.eventTitle!,
          slug: values.eventSlug!,
          description: values.eventDescription!,
          registrationStart: values.eventRegistrationStart!,
          registrationEnd: values.eventRegistrationEnd!,
          eventStart: values.eventEventStart!,
          eventEnd: values.eventEventEnd!,
        };
      }

      await createOrAssignOrganizer(payload);
      setOpen(false);
      assignForm.reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to assign organizer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-750 text-neutral-100 font-semibold h-10 px-5 shadow-lg shadow-violet-500/20 transition-all duration-200">
          <UserPlus className="w-4.5 h-4.5" />
          Assign Organizer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-neutral-900 border-neutral-850 text-neutral-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            Organizer Authorization Setup
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold mt-4">
            {error}
          </div>
        )}

        <Tabs defaultValue="create" onValueChange={(val) => setActiveTab(val as "create" | "assign")} className="w-full mt-4">
          <TabsList className="bg-neutral-950 border border-neutral-800 p-1 rounded-lg flex mb-6">
            <TabsTrigger
              value="create"
              className="flex-1 py-1.5 text-xs font-semibold rounded text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              New Account
            </TabsTrigger>
            <TabsTrigger
              value="assign"
              className="flex-1 py-1.5 text-xs font-semibold rounded text-neutral-400 data-[state=active]:bg-neutral-850 data-[state=active]:text-neutral-100 flex items-center justify-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5" />
              Existing User
            </TabsTrigger>
          </TabsList>

          {/* TAB: Create New Organizer */}
          <TabsContent value="create">
            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="create-name" className="text-xs font-bold text-neutral-400">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                  <Input
                    id="create-name"
                    placeholder="Jane Doe"
                    className="pl-9 bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                    {...createForm.register("name")}
                  />
                </div>
                {createForm.formState.errors.name && (
                  <p className="text-xs text-red-500">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-email" className="text-xs font-bold text-neutral-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="jane.doe@example.com"
                    className="pl-9 bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                    {...createForm.register("email")}
                  />
                </div>
                {createForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{createForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-password" className="text-xs font-bold text-neutral-400">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                  <Input
                    id="create-password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    className="pl-9 bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                    {...createForm.register("password")}
                  />
                </div>
                {createForm.formState.errors.password && (
                  <p className="text-xs text-red-500">{createForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* Event Link Method Segment */}
              <div className="space-y-1.5 py-1">
                <Label className="text-xs font-bold text-neutral-400">Event Mode</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      value="existing"
                      {...createForm.register("eventMode")}
                      className="accent-violet-605"
                    />
                    Assign Existing Hackathon
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      value="new"
                      {...createForm.register("eventMode")}
                      className="accent-violet-605"
                    />
                    Create New Hackathon
                  </label>
                </div>
              </div>

              {createEventMode === "existing" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="create-event" className="text-xs font-bold text-neutral-400">Assign Hackathon Event</Label>
                  {events.length === 0 ? (
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-500 italic">
                      No active hackathons found. Please select &quot;Create New Hackathon&quot; instead.
                    </div>
                  ) : (
                    <select
                      id="create-event"
                      className="w-full rounded bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-neutral-200 text-xs p-2.5 focus:outline-none"
                      {...createForm.register("eventId")}
                    >
                      <option value="">-- Choose Event --</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                  )}
                  {createForm.formState.errors.eventId && (
                    <p className="text-xs text-red-500">{createForm.formState.errors.eventId.message}</p>
                  )}
                </div>
              ) : (
                /* INLINE NEW EVENT FIELDS FOR CREATION */
                <div className="border border-neutral-800/80 rounded-lg p-4 bg-neutral-950/40 space-y-4 mt-2">
                  <h4 className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    New Event Specifications
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="create-event-title" className="text-[11px] text-neutral-400">Event Title</Label>
                    <Input
                      id="create-event-title"
                      placeholder="e.g. AI Innovation Summit"
                      className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-xs text-neutral-200"
                      {...createForm.register("eventTitle", {
                        onChange: (e) => {
                          const slug = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "");
                          createForm.setValue("eventSlug", slug);
                        }
                      })}
                    />
                    {createForm.formState.errors.eventTitle && (
                      <p className="text-[11px] text-red-500">{createForm.formState.errors.eventTitle.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="create-event-slug" className="text-[11px] text-neutral-400">URL Slug</Label>
                    <Input
                      id="create-event-slug"
                      placeholder="e.g. ai-innovation-summit"
                      className="bg-neutral-950 border-neutral-800 focus:border-violet-500 font-mono text-xs text-neutral-300"
                      {...createForm.register("eventSlug")}
                    />
                    {createForm.formState.errors.eventSlug && (
                      <p className="text-[11px] text-red-500">{createForm.formState.errors.eventSlug.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="create-event-desc" className="text-[11px] text-neutral-400">Short Description</Label>
                    <textarea
                      id="create-event-desc"
                      rows={2}
                      placeholder="Introduction of the event theme and tracks..."
                      className="w-full rounded bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-xs p-2 text-neutral-200 focus:outline-none"
                      {...createForm.register("eventDescription")}
                    />
                    {createForm.formState.errors.eventDescription && (
                      <p className="text-[11px] text-red-500">{createForm.formState.errors.eventDescription.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="create-reg-start" className="text-[10px] text-neutral-400 uppercase font-bold">Reg Start</Label>
                      <Input
                        id="create-reg-start"
                        type="datetime-local"
                        className="bg-neutral-955 border-neutral-800 text-[10px] h-8 text-neutral-350"
                        {...createForm.register("eventRegistrationStart")}
                      />
                      {createForm.formState.errors.eventRegistrationStart && (
                        <p className="text-[10px] text-red-500">{createForm.formState.errors.eventRegistrationStart.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="create-reg-end" className="text-[10px] text-neutral-400 uppercase font-bold">Reg End</Label>
                      <Input
                        id="create-reg-end"
                        type="datetime-local"
                        className="bg-neutral-955 border-neutral-800 text-[10px] h-8 text-neutral-350"
                        {...createForm.register("eventRegistrationEnd")}
                      />
                      {createForm.formState.errors.eventRegistrationEnd && (
                        <p className="text-[10px] text-red-500">{createForm.formState.errors.eventRegistrationEnd.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="create-event-start" className="text-[10px] text-neutral-400 uppercase font-bold">Hackathon Start</Label>
                      <Input
                        id="create-event-start"
                        type="datetime-local"
                        className="bg-neutral-955 border-neutral-800 text-[10px] h-8 text-neutral-350"
                        {...createForm.register("eventEventStart")}
                      />
                      {createForm.formState.errors.eventEventStart && (
                        <p className="text-[10px] text-red-500">{createForm.formState.errors.eventEventStart.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="create-event-end" className="text-[10px] text-neutral-400 uppercase font-bold">Hackathon End</Label>
                      <Input
                        id="create-event-end"
                        type="datetime-local"
                        className="bg-neutral-955 border-neutral-800 text-[10px] h-8 text-neutral-350"
                        {...createForm.register("eventEventEnd")}
                      />
                      {createForm.formState.errors.eventEventEnd && (
                        <p className="text-[10px] text-red-500">{createForm.formState.errors.eventEventEnd.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800 mt-6">
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
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Authorize & Assign"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB: Assign Existing Organizer */}
          <TabsContent value="assign">
            <form onSubmit={assignForm.handleSubmit(onSubmitAssign)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="assign-email" className="text-xs font-bold text-neutral-400">User Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                  <Input
                    id="assign-email"
                    type="email"
                    placeholder="user@example.com"
                    className="pl-9 bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 text-xs"
                    {...assignForm.register("email")}
                  />
                </div>
                {assignForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{assignForm.formState.errors.email.message}</p>
                )}
              </div>

              {/* Event Link Method Segment */}
              <div className="space-y-1.5 py-1">
                <Label className="text-xs font-bold text-neutral-400">Event Mode</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      value="existing"
                      {...assignForm.register("eventMode")}
                      className="accent-violet-605"
                    />
                    Assign Existing Hackathon
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      value="new"
                      {...assignForm.register("eventMode")}
                      className="accent-violet-605"
                    />
                    Create New Hackathon
                  </label>
                </div>
              </div>

              {assignEventMode === "existing" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="assign-event" className="text-xs font-bold text-neutral-400">Assign Hackathon Event</Label>
                  {events.length === 0 ? (
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-500 italic">
                      No active hackathons found. Please select &quot;Create New Hackathon&quot; instead.
                    </div>
                  ) : (
                    <select
                      id="assign-event"
                      className="w-full rounded bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-neutral-200 text-xs p-2.5 focus:outline-none"
                      {...assignForm.register("eventId")}
                    >
                      <option value="">-- Choose Event --</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                  )}
                  {assignForm.formState.errors.eventId && (
                    <p className="text-xs text-red-500">{assignForm.formState.errors.eventId.message}</p>
                  )}
                </div>
              ) : (
                /* INLINE NEW EVENT FIELDS FOR ASSIGN */
                <div className="border border-neutral-800/80 rounded-lg p-4 bg-neutral-955/40 space-y-4 mt-2">
                  <h4 className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    New Event Specifications
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="assign-event-title" className="text-[11px] text-neutral-400">Event Title</Label>
                    <Input
                      id="assign-event-title"
                      placeholder="e.g. AI Innovation Summit"
                      className="bg-neutral-950 border-neutral-800 focus:border-violet-500 text-xs text-neutral-200"
                      {...assignForm.register("eventTitle", {
                        onChange: (e) => {
                          const slug = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "");
                          assignForm.setValue("eventSlug", slug);
                        }
                      })}
                    />
                    {assignForm.formState.errors.eventTitle && (
                      <p className="text-[11px] text-red-500">{assignForm.formState.errors.eventTitle.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="assign-event-slug" className="text-[11px] text-neutral-400">URL Slug</Label>
                    <Input
                      id="assign-event-slug"
                      placeholder="e.g. ai-innovation-summit"
                      className="bg-neutral-950 border-neutral-800 focus:border-violet-500 font-mono text-xs text-neutral-300"
                      {...assignForm.register("eventSlug")}
                    />
                    {assignForm.formState.errors.eventSlug && (
                      <p className="text-[11px] text-red-500">{assignForm.formState.errors.eventSlug.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="assign-event-desc" className="text-[11px] text-neutral-400">Short Description</Label>
                    <textarea
                      id="assign-event-desc"
                      rows={2}
                      placeholder="Introduction of the event theme and tracks..."
                      className="w-full rounded bg-neutral-950 border border-neutral-800 focus:border-violet-500 text-xs p-2 text-neutral-200 focus:outline-none"
                      {...assignForm.register("eventDescription")}
                    />
                    {assignForm.formState.errors.eventDescription && (
                      <p className="text-[11px] text-red-500">{assignForm.formState.errors.eventDescription.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="assign-reg-start" className="text-[10px] text-neutral-400 uppercase font-bold">Reg Start</Label>
                      <Input
                        id="assign-reg-start"
                        type="datetime-local"
                        className="bg-neutral-955 border-neutral-800 text-[10px] h-8 text-neutral-350"
                        {...assignForm.register("eventRegistrationStart")}
                      />
                      {assignForm.formState.errors.eventRegistrationStart && (
                        <p className="text-[10px] text-red-500">{assignForm.formState.errors.eventRegistrationStart.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="assign-reg-end" className="text-[10px] text-neutral-400 uppercase font-bold">Reg End</Label>
                      <Input
                        id="assign-reg-end"
                        type="datetime-local"
                        className="bg-neutral-955 border-neutral-800 text-[10px] h-8 text-neutral-350"
                        {...assignForm.register("eventRegistrationEnd")}
                      />
                      {assignForm.formState.errors.eventRegistrationEnd && (
                        <p className="text-[10px] text-red-500">{assignForm.formState.errors.eventRegistrationEnd.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="assign-event-start" className="text-[10px] text-neutral-400 uppercase font-bold">Hackathon Start</Label>
                      <Input
                        id="assign-event-start"
                        type="datetime-local"
                        className="bg-neutral-955 border-neutral-800 text-[10px] h-8 text-neutral-350"
                        {...assignForm.register("eventEventStart")}
                      />
                      {assignForm.formState.errors.eventEventStart && (
                        <p className="text-[10px] text-red-500">{assignForm.formState.errors.eventEventStart.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="assign-event-end" className="text-[10px] text-neutral-400 uppercase font-bold">Hackathon End</Label>
                      <Input
                        id="assign-event-end"
                        type="datetime-local"
                        className="bg-neutral-955 border-neutral-800 text-[10px] h-8 text-neutral-350"
                        {...assignForm.register("eventEventEnd")}
                      />
                      {assignForm.formState.errors.eventEventEnd && (
                        <p className="text-[10px] text-red-500">{assignForm.formState.errors.eventEventEnd.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800 mt-6">
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
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Authorize & Assign"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
