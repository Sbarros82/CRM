import { describe, expect, it } from "vitest";
import {
  buildContactAvatarPath,
  contactAvatarExtension,
  contactAvatarPathFromUrl,
} from "./avatar";

describe("contactAvatarPathFromUrl", () => {
  it("extracts the object path from a public URL", () => {
    const url =
      "https://abc.supabase.co/storage/v1/object/public/contact-avatars/account-111/cid/avatar-9.jpg?t=1";
    expect(contactAvatarPathFromUrl(url)).toBe(
      "account-111/cid/avatar-9.jpg",
    );
  });

  it("returns null for a foreign URL", () => {
    expect(
      contactAvatarPathFromUrl(
        "https://abc.supabase.co/storage/v1/object/public/avatars/u/x.png",
      ),
    ).toBeNull();
    expect(contactAvatarPathFromUrl(null)).toBeNull();
  });
});

describe("buildContactAvatarPath", () => {
  it("keeps the account- folder RLS expects", () => {
    const path = buildContactAvatarPath("acc", "c1", "jpg", 1700000000000);
    expect(path).toBe("account-acc/c1/avatar-1700000000000.jpg");
  });
});

describe("contactAvatarExtension", () => {
  it("maps jpeg to jpg", () => {
    expect(contactAvatarExtension("image/jpeg")).toBe("jpg");
    expect(contactAvatarExtension("application/pdf")).toBeNull();
  });
});
