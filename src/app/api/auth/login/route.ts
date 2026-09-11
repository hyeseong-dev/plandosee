import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, publicUser } from "@/lib/auth";
import { loginSchema } from "@/lib/auth-validation";

const LOGIN_ERROR = "이메일 또는 비밀번호가 올바르지 않아요.";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const matches = user
      ? await bcrypt.compare(input.password, user.passwordHash)
      : await bcrypt.compare(input.password, await bcrypt.hash("timing-only-password", 12));
    if (!user || !matches) {
      return Response.json({ error: LOGIN_ERROR }, { status: 401 });
    }
    const expiresAt = await createSession(user.id);
    return Response.json({
      user: publicUser(user),
      sessionExpiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    if (typeof error === "object" && error && "issues" in error) {
      return Response.json({ error: LOGIN_ERROR }, { status: 401 });
    }
    console.error("auth:login", "login failed");
    return Response.json({ error: "로그인 요청을 처리하지 못했어요." }, { status: 500 });
  }
}
