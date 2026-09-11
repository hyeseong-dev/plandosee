import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, revokeCurrentSession } from "@/lib/auth";
import { deleteAccountSchema } from "@/lib/auth-validation";
import { unauthorized } from "@/lib/http";
import { ZodError } from "zod";

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
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "입력값을 확인해 주세요." },
        { status: 400 },
      );
    }
    console.error("auth:account", "account deletion failed");
    return Response.json({ error: "계정을 지우지 못했어요." }, { status: 500 });
  }
}
