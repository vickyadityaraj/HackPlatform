import { getUsersList } from "@/actions/admin";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserManagementTable } from "@/components/dashboard/user-management-table";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const users = await getUsersList();

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50">User Management</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Assign platform roles (Admin, Organizer, Participant, Judge) and suspend/activate user accounts.
        </p>
      </div>
      <UserManagementTable users={users as any} currentUserId={session.user.id} />
    </div>
  );
}
