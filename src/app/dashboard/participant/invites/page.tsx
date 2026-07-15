import { getPendingInvitations } from "@/actions/invitations";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const PendingInvitationsList = dynamic(
  () => import("@/components/dashboard/pending-invitations-list").then((mod) => mod.PendingInvitationsList),
  {
    ssr: false,
    loading: () => <div className="p-8 text-center text-neutral-500 text-xs">Loading invitations...</div>,
  }
);

export default async function ParticipantInvitesPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const invites = await getPendingInvitations(session.user.id);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50">Team Invitations</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Review and respond to invitations from other hackathon team leaders.
        </p>
      </div>
      <PendingInvitationsList initialInvites={invites as any} />
    </div>
  );
}
