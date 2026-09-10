import { loadWorkspace } from "@/lib/workspace";
import { seoulDateKey } from "@/lib/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  const workspace = await loadWorkspace();
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    timezone: "Asia/Seoul",
    durationUnit: "seconds",
    data: workspace,
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="plandosee-${seoulDateKey()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
