import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, requireUser, revokeCurrentSession } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/auth-validation";
import { unauthorized } from "@/lib/http";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  try {
    const input = changePasswordSchema.parse(await request.json());
    if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      return Response.json({ error: "현재 비밀번호가 올바르지 않아요." }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);
    await revokeCurrentSession();
    const expiresAt = await createSession(user.id);
    return Response.json({ ok: true, sessionExpiresAt: expiresAt.toISOString() });
  } catch (error) {
    if (typeof error === "object" && error && "issues" in error) {
      const issue = (error as { issues: Array<{ message: string }> }).issues[0];
      return Response.json({ error: issue?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
    }
    console.error("auth:password", "password change failed");
    return Response.json({ error: "비밀번호를 바꾸지 못했어요." }, { status: 500 });
  }
}
