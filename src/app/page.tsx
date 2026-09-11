import { PlannerApp } from "@/components/planner-app";
import { AuthScreen } from "@/components/auth-screen";
import { publicUser, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  return user ? <PlannerApp user={publicUser(user)} /> : <AuthScreen />;
}
