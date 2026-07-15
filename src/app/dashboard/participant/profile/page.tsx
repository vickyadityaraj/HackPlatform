import { getProfile } from "@/actions/profile";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const ProfileForm = dynamic(
  () => import("@/components/dashboard/profile-form").then((mod) => mod.ProfileForm),
  {
    ssr: false,
    loading: () => <div className="p-8 text-center text-neutral-500 text-xs">Loading profile form...</div>,
  }
);

export default async function ParticipantProfilePage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const profile = await getProfile(session.user.id);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50">My Profile</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Update your experience level, skills list, bio, and resume download link.
        </p>
      </div>
      <ProfileForm initialProfile={profile as any} />
    </div>
  );
}
