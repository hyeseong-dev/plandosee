import { z } from "zod";

const email = z.string().trim().email("이메일 형식을 확인해 주세요.").max(254)
  .transform((value) => value.toLowerCase());
const password = z.string().min(10, "비밀번호는 10자 이상이어야 해요.").max(128)
  .regex(/[A-Za-z]/, "영문자를 하나 이상 넣어 주세요.")
  .regex(/[0-9]/, "숫자를 하나 이상 넣어 주세요.");

export const signupSchema = z.object({
  displayName: z.string().trim().min(1, "이름을 입력해 주세요.").max(50),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
});
