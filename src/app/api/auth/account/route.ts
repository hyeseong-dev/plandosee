import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, revokeCurrentSession } from "@/lib/auth";
import { deleteAccountSchema } from "@/lib/auth-validation";
import { unauthorized } from "@/lib/http";

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  try {
    const input = deleteAccountSchema.parse(await request.json());
    if (!(await bcrypt.compare(input.password, user.passwordHash))) {
      return Response.json({ error: "비밀번호가 올바르지 않아요." }, { status: 400 });
    }
    await prisma.user.delete({ where: { id: user.id } });
    await revokeCurrentSession();
    return Response.json({ ok: true });
  } catch {
    console.error("auth:account", "account deletion failed");
    return Response.json({ error: "계정을 지우지 못했어요." }, { status: 500 });
  }
}
