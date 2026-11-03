import { describe, expect, it } from "vitest";
import { setupTokenMatches, validateSetupInput } from "@/lib/admin-setup.shared";

describe("setupTokenMatches", () => {
  it("rejects a wrong setup key of the same length", () => {
    expect(setupTokenMatches("aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb")).toBe(false);
  });

  it("accepts the exact setup key", () => {
    expect(setupTokenMatches("quartz-lantern-7f3k9", "quartz-lantern-7f3k9")).toBe(true);
  });

  it("rejects shorter and longer guesses", () => {
    expect(setupTokenMatches("quartz-lantern-7f3k", "quartz-lantern-7f3k9")).toBe(false);
    expect(setupTokenMatches("quartz-lantern-7f3k99", "quartz-lantern-7f3k9")).toBe(false);
  });
});

describe("validateSetupInput", () => {
  it("rejects a missing setup key", () => {
    expect(validateSetupInput({ email: "admin@example.com", password: "longenough1" })).toEqual({
      ok: false,
      error: "Enter the setup key.",
    });
  });

  it("rejects an invalid email", () => {
    expect(
      validateSetupInput({ setupToken: "k1", email: "not-an-email", password: "longenough1" }),
    ).toEqual({ ok: false, error: "Enter a valid email address." });
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      validateSetupInput({ setupToken: "k1", email: "admin@example.com", password: "short1" }),
    ).toEqual({ ok: false, error: "Password must be at least 8 characters." });
  });

  it("accepts a valid entry and normalizes the email", () => {
    expect(
      validateSetupInput({
        setupToken: "  k1  ",
        email: "  Admin@Example.COM ",
        password: "longenough1",
      }),
    ).toEqual({
      ok: true,
      setupToken: "k1",
      email: "admin@example.com",
      password: "longenough1",
    });
  });
});
