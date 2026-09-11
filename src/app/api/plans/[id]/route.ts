import { requireUser } from "@/lib/auth";
import { notFound, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { planInput } from "@/lib/validation";

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

export async function GET(_request: Request, context: RouteContext<"/api/plans/[id]">) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  const plan = await prisma.plan.findFirst({ where: { id, userId: user.id } });
  return plan ? Response.json({ plan }) : notFound();
}

export async function PATCH(request: Request, context: RouteContext<"/api/plans/[id]">) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  const current = await prisma.plan.findFirst({ where: { id, userId: user.id } });
  if (!current) return notFound();
  try {
    const data = planInput.parse(await request.json());
    await prisma.plan.update({
      where: { id: current.id },
      data: { ...data, startDate: day(data.startDate), endDate: day(data.endDate) },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "입력값을 확인해 주세요." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/plans/[id]">) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  const result = await prisma.plan.deleteMany({ where: { id, userId: user.id } });
  return result.count === 1 ? Response.json({ ok: true }) : notFound();
}
