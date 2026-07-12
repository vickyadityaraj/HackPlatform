import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const role = session.user.role;

  switch (role) {
    case "SUPER_ADMIN":
      redirect("/dashboard/admin");
    case "ORGANIZER":
      redirect("/dashboard/organizer");
    case "JUDGE":
      redirect("/dashboard/judge");
    case "PARTICIPANT":
    default:
      redirect("/dashboard/participant");
  }
}
