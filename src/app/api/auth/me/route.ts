import { publicUser, requireUser } from "@/lib/auth";
import { unauthorized } from "@/lib/http";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  return Response.json({ user: publicUser(user) });
}
