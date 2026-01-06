import { describe, it, expect } from "vitest";
import { formatPhone, cleanPhone, isValidPhone } from "./utils";

describe("Phone Formatting Functions", () => {
  describe("formatPhone", () => {
    it("should format 11-digit phone number", () => {
      expect(formatPhone("11999887766")).toBe("(11) 9 9988-7766");
    });

    it("should format 10-digit phone number", () => {
      expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
    });

    it("should handle phone with special characters", () => {
      expect(formatPhone("(11) 9 9988-7766")).toBe("(11) 9 9988-7766");
    });

    it("should handle phone with spaces", () => {
      expect(formatPhone("11 9 9988 7766")).toBe("(11) 9 9988-7766");
    });

    it("should return original if invalid length", () => {
      expect(formatPhone("123")).toBe("123");
    });

    it("should handle empty string", () => {
      expect(formatPhone("")).toBe("");
    });
  });

  describe("cleanPhone", () => {
    it("should remove all non-digit characters", () => {
      expect(cleanPhone("(11) 99988-7766")).toBe("11999887766");
    });

    it("should handle already clean phone", () => {
      expect(cleanPhone("11999887766")).toBe("11999887766");
    });

    it("should handle phone with spaces", () => {
      expect(cleanPhone("11 99988 7766")).toBe("11999887766");
    });
  });

  describe("isValidPhone", () => {
    it("should validate 11-digit phone", () => {
      expect(isValidPhone("11999887766")).toBe(true);
    });

    it("should validate 10-digit phone", () => {
      expect(isValidPhone("1133334444")).toBe(true);
    });

    it("should validate formatted phone", () => {
      expect(isValidPhone("(11) 99988-7766")).toBe(true);
    });

    it("should reject invalid length", () => {
      expect(isValidPhone("123")).toBe(false);
    });

    it("should reject empty string", () => {
      expect(isValidPhone("")).toBe(false);
    });
  });
});
