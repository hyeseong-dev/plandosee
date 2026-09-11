import { loadWorkspace } from "@/lib/workspace";
import { seoulDateKey } from "@/lib/domain";
import { publicUser, requireUser } from "@/lib/auth";
import { unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const workspace = await loadWorkspace(user.id);
  const diaryStudy = await prisma.diaryStudy.findUnique({
    where: { userId: user.id },
    include: {
      entries: { orderBy: { date: "asc" } },
      ruleChange: true,
    },
  });
  const payload = {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    timezone: "Asia/Seoul",
    durationUnit: "seconds",
    data: {
      account: publicUser(user),
      ...workspace,
      diaryStudy,
    },
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="plandosee-${seoulDateKey()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
