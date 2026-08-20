import { describe, expect, it } from "vitest";
import { getManagerAuthEmail, normalizeManagerPhone } from "@/lib/managerAuth";

describe("manager auth identity", () => {
  it.each([
    ["0700 123 456", "996700123456"],
    ["700123456", "996700123456"],
    ["+996 (700) 123-456", "996700123456"],
  ])("normalizes %s to one stable identity", (phone, digits) => {
    expect(normalizeManagerPhone(phone)).toEqual({ digits, e164: `+${digits}` });
    expect(getManagerAuthEmail(phone)).toBe(`manager.${digits}@tehno-six.vercel.app`);
  });

  it("rejects incomplete phone numbers", () => {
    expect(() => getManagerAuthEmail("123")).toThrow("Введите корректный номер телефона");
  });
});
