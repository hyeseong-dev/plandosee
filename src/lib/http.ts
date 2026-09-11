import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export const unauthorized = () =>
  NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

export const notFound = () =>
  NextResponse.json({ error: "자료를 찾을 수 없어요." }, { status: 404 });

export function validationError(error: ZodError) {
  return NextResponse.json(
    { error: error.issues[0]?.message ?? "입력값을 확인해 주세요." },
    { status: 400 },
  );
}
