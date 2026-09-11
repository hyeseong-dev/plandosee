import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession, publicUser } from "@/lib/auth";
import { signupSchema } from "@/lib/auth-validation";

export async function POST(request: Request) {
  try {
    const input = signupSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({ select: { id: true } });
      const created = await tx.user.create({
        data: {
          email: input.email,
          displayName: input.displayName,
          passwordHash,
        },
      });
      if (!existingUser) {
        await tx.plan.updateMany({
          where: { userId: null },
          data: { userId: created.id },
        });
      }
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    const expiresAt = await createSession(user.id);
    return Response.json(
      { user: publicUser(user), sessionExpiresAt: expiresAt.toISOString() },
      { status: 201 },
    );
  } catch (error) {
    if (typeof error === "object" && error && "issues" in error) {
      const issue = (error as { issues: Array<{ message: string }> }).issues[0];
      return Response.json({ error: issue?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
    }
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return Response.json({ error: "이미 가입된 이메일이에요." }, { status: 409 });
    }
    console.error("auth:signup", "account creation failed");
    return Response.json({ error: "계정을 만들지 못했어요." }, { status: 500 });
  }
}
