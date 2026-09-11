import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

describe("password storage", () => {
  it("uses bcrypt salts so equal inputs produce different irreversible values", async () => {
    const input = randomBytes(24).toString("base64url");
    const [first, second] = await Promise.all([
      bcrypt.hash(input, 12),
      bcrypt.hash(input, 12),
    ]);
    expect(first).not.toBe(input);
    expect(second).not.toBe(input);
    expect(first).not.toBe(second);
    expect(await bcrypt.compare(input, first)).toBe(true);
    expect(await bcrypt.compare(input, second)).toBe(true);
  });
});
